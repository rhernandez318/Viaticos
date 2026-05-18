-- ════════════════════════════════════════════════════════════════════════
-- VIÁTICOS — Schema Supabase (PostgreSQL)
-- Ejecuta este archivo completo en SQL Editor del proyecto Supabase
-- ════════════════════════════════════════════════════════════════════════

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════ 1. TABLAS ════════════

-- Centros de beneficio
CREATE TABLE IF NOT EXISTS centros (
  id          TEXT PRIMARY KEY,             -- 100020009
  nombre      TEXT NOT NULL,
  depto       TEXT NOT NULL,
  division    TEXT,                          -- 4105, 4106
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Catálogo de cuentas contables
CREATE TABLE IF NOT EXISTS cuentas_contables (
  cuenta      TEXT PRIMARY KEY,              -- 6122900001
  nombre      TEXT NOT NULL,
  grupo       TEXT NOT NULL,                 -- Transporte, Hospedaje, etc.
  activo      BOOLEAN DEFAULT true
);

-- Usuarios (vinculados a auth.users)
CREATE TABLE IF NOT EXISTS usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  correo      TEXT UNIQUE NOT NULL,
  rol         TEXT NOT NULL CHECK (rol IN ('usuario','gerente','tesoreria','contador','admin')),
  centro_id   TEXT REFERENCES centros(id),
  gerente_id  UUID REFERENCES usuarios(id),
  iniciales   TEXT,
  division    TEXT,
  clabe       TEXT,
  banco       TEXT,
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Solicitudes (anticipos, comprobaciones, reembolsos)
CREATE TABLE IF NOT EXISTS solicitudes (
  id              TEXT PRIMARY KEY,          -- ANT-2026-0142
  tipo            TEXT NOT NULL CHECK (tipo IN ('anticipo','comprobacion','reembolso')),
  concepto        TEXT NOT NULL,
  usuario_id      UUID NOT NULL REFERENCES usuarios(id),
  monto           NUMERIC(12,2) NOT NULL,
  fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'solicitado'
                  CHECK (status IN ('solicitado','autorizado','liberado','rechazado','comprobado','parcial')),
  saldo_pendiente NUMERIC(12,2),
  anticipo_ref    TEXT REFERENCES solicitudes(id),
  motivo_rechazo  TEXT,
  centro_id       TEXT REFERENCES centros(id),
  destino         TEXT,
  fecha_salida    DATE,
  fecha_regreso   DATE,
  notas           TEXT,
  comprobantes    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Desglose estimado del anticipo (líneas presupuestadas)
CREATE TABLE IF NOT EXISTS solicitud_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id  TEXT NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  cuenta        TEXT REFERENCES cuentas_contables(cuenta),
  descripcion   TEXT,
  monto         NUMERIC(12,2) NOT NULL,
  orden         INT DEFAULT 0
);

-- Comprobantes CFDI (facturas reales subidas para comprobaciones/reembolsos)
CREATE TABLE IF NOT EXISTS comprobantes_cfdi (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id    TEXT NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  uuid            TEXT NOT NULL,
  emisor          TEXT,
  rfc             TEXT,
  concepto        TEXT,
  subtotal        NUMERIC(12,2),
  iva             NUMERIC(12,2),
  total           NUMERIC(12,2),
  fecha_factura   DATE,
  cuenta          TEXT REFERENCES cuentas_contables(cuenta),
  confianza       NUMERIC(3,2),
  archivo_xml_url TEXT,
  archivo_pdf_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (solicitud_id, uuid)
);

-- Bitácora de movimientos
CREATE TABLE IF NOT EXISTS bitacora (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id  TEXT NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  accion        TEXT NOT NULL,               -- solicitar, autorizar, rechazar, liberar, comprobar, timbrar, comentar
  usuario_id    UUID NOT NULL REFERENCES usuarios(id),
  motivo        TEXT,
  fecha         TIMESTAMPTZ DEFAULT NOW()
);

-- Borradores (formularios guardados sin enviar)
CREATE TABLE IF NOT EXISTS borradores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════ 2. ÍNDICES ════════════

CREATE INDEX IF NOT EXISTS idx_usuarios_rol         ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_centro      ON usuarios(centro_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_gerente     ON usuarios(gerente_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario  ON solicitudes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_status   ON solicitudes(status);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo     ON solicitudes(tipo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha    ON solicitudes(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_centro   ON solicitudes(centro_id);
CREATE INDEX IF NOT EXISTS idx_cfdi_solicitud       ON comprobantes_cfdi(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_cfdi_uuid            ON comprobantes_cfdi(uuid);
CREATE INDEX IF NOT EXISTS idx_bitacora_solicitud   ON bitacora(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_items_solicitud      ON solicitud_items(solicitud_id);

-- ════════════ 3. TRIGGERS / FUNCIONES ════════════

-- Trigger: mantener updated_at en solicitudes
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sol_updated ON solicitudes;
CREATE TRIGGER trg_sol_updated BEFORE UPDATE ON solicitudes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_usr_updated ON usuarios;
CREATE TRIGGER trg_usr_updated BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Función auxiliar: rol del usuario actual
CREATE OR REPLACE FUNCTION current_user_rol() RETURNS TEXT AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Función auxiliar: ¿el usuario X reporta a mí (gerente actual)?
CREATE OR REPLACE FUNCTION es_mi_subordinado(user_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios WHERE id = user_id AND gerente_id = auth.uid()
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Trigger: auto-crear fila en public.usuarios cuando alguien firma en auth.users
-- (la creación inicial la haces manual: ver supabase-seed.sql)
CREATE OR REPLACE FUNCTION handle_new_auth_user() RETURNS TRIGGER AS $$
BEGIN
  -- Si ya existe la fila (caso seed), no hace nada
  INSERT INTO public.usuarios (id, correo, nombre, rol, iniciales)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'usuario'),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email,'@',1)), 2))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ════════════ 4. ROW LEVEL SECURITY ════════════

ALTER TABLE centros            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_contables  ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitud_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes_cfdi  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitacora           ENABLE ROW LEVEL SECURITY;
ALTER TABLE borradores         ENABLE ROW LEVEL SECURITY;

-- ── Centros: todos leen, solo admin escribe ───────────────────────────────────
CREATE POLICY centros_read ON centros FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY centros_write ON centros FOR ALL USING (current_user_rol() = 'admin');

-- ── Cuentas contables: todos leen, admin/contador escriben ────────────────────
CREATE POLICY cuentas_read ON cuentas_contables FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY cuentas_write ON cuentas_contables FOR ALL
  USING (current_user_rol() IN ('admin','contador'));

-- ── Usuarios: todos leen lista básica; solo admin edita ───────────────────────
CREATE POLICY usuarios_read ON usuarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY usuarios_self_update ON usuarios FOR UPDATE USING (id = auth.uid());
CREATE POLICY usuarios_admin_all ON usuarios FOR ALL USING (current_user_rol() = 'admin');

-- ── Solicitudes: usuario ve las propias; gerente las de su equipo;
--     tesorería/contador/admin todas ────────────────────────────────────────────
CREATE POLICY solicitudes_read ON solicitudes FOR SELECT USING (
  usuario_id = auth.uid()
  OR current_user_rol() IN ('tesoreria','contador','admin')
  OR (current_user_rol() = 'gerente' AND es_mi_subordinado(usuario_id))
);
CREATE POLICY solicitudes_insert ON solicitudes FOR INSERT
  WITH CHECK (usuario_id = auth.uid());
CREATE POLICY solicitudes_update_owner ON solicitudes FOR UPDATE
  USING (usuario_id = auth.uid() AND status = 'solicitado');
CREATE POLICY solicitudes_update_gerente ON solicitudes FOR UPDATE
  USING (current_user_rol() = 'gerente' AND es_mi_subordinado(usuario_id));
CREATE POLICY solicitudes_update_priv ON solicitudes FOR UPDATE
  USING (current_user_rol() IN ('tesoreria','contador','admin'));

-- ── Items, CFDI, bitácora, borradores: heredan acceso de la solicitud ─────────
CREATE POLICY items_all ON solicitud_items FOR ALL USING (
  EXISTS (SELECT 1 FROM solicitudes s WHERE s.id = solicitud_items.solicitud_id
    AND (s.usuario_id = auth.uid()
      OR current_user_rol() IN ('tesoreria','contador','admin','gerente')))
);

CREATE POLICY cfdi_all ON comprobantes_cfdi FOR ALL USING (
  EXISTS (SELECT 1 FROM solicitudes s WHERE s.id = comprobantes_cfdi.solicitud_id
    AND (s.usuario_id = auth.uid()
      OR current_user_rol() IN ('tesoreria','contador','admin','gerente')))
);

CREATE POLICY bitacora_read ON bitacora FOR SELECT USING (
  EXISTS (SELECT 1 FROM solicitudes s WHERE s.id = bitacora.solicitud_id
    AND (s.usuario_id = auth.uid()
      OR current_user_rol() IN ('tesoreria','contador','admin','gerente')))
);
CREATE POLICY bitacora_insert ON bitacora FOR INSERT WITH CHECK (usuario_id = auth.uid());

CREATE POLICY borradores_owner ON borradores FOR ALL USING (usuario_id = auth.uid());

-- ════════════ 5. STORAGE BUCKETS ════════════

-- Bucket para XML y PDF de facturas
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', false)
ON CONFLICT (id) DO NOTHING;

-- Política de acceso al bucket
CREATE POLICY "Usuarios suben sus propios comprobantes" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comprobantes' AND auth.role() = 'authenticated');
CREATE POLICY "Lectura de comprobantes a usuarios autenticados" ON storage.objects FOR SELECT
  USING (bucket_id = 'comprobantes' AND auth.role() = 'authenticated');

-- ════════════ FIN ════════════
