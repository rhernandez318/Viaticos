-- ════════════════════════════════════════════════════════════════════════
-- VIÁTICOS — Datos iniciales (seed)
-- Ejecuta DESPUÉS de supabase-schema.sql
-- ════════════════════════════════════════════════════════════════════════

-- ── Centros de beneficio ────────────────────────────────────────────────
INSERT INTO centros (id, nombre, depto, division) VALUES
  ('100020009','VANES',          'Operaciones',    '4105'),
  ('100020011','FL360',          'Operaciones',    '4105'),
  ('100020008','PASAJE',         'Operaciones',    '4105'),
  ('100020007','CARGA',          'Operaciones',    '4105'),
  ('100020010','TRACTO',         'Operaciones',    '4106'),
  ('100020012','SEMIRREMOLQUES', 'Operaciones',    '4106'),
  ('100020017','REFACCIONES',    'Refacciones',    '4105'),
  ('100020002','SEMINUEVOS',     'Comercial',      '4105'),
  ('100010009','ADMINISTRACIÓN', 'Administración', '4105'),
  ('100030001','TALLER',         'Servicio',       '4106')
ON CONFLICT (id) DO NOTHING;

-- ── Catálogo de cuentas contables ───────────────────────────────────────
INSERT INTO cuentas_contables (cuenta, nombre, grupo) VALUES
  ('6122900001','Pasajes Nacionales',  'Transporte'),
  ('6122900002','Peaje',               'Transporte'),
  ('6122900003','Alojamiento Nacional','Hospedaje'),
  ('6122900004','Estacionamiento',     'Transporte'),
  ('6122900005','Comidas',             'Alimentos'),
  ('6122900006','Renta de Vehículos',  'Transporte'),
  ('6120800001','Gasolina',            'Transporte'),
  ('6121200001','No Deducibles',       'Otros'),
  ('6122700001','Otros Impuestos (TUA)','Impuestos')
ON CONFLICT (cuenta) DO NOTHING;

-- ── Usuarios admin iniciales ────────────────────────────────────────────
-- IMPORTANTE: Estos usuarios deben crearse PRIMERO en Authentication → Users
-- en el panel de Supabase. Después de crearlos, copia el UUID que asigne
-- Supabase y úsalo abajo, o usa el correo para buscarlo.
--
-- Aquí los insertamos manualmente. Reemplaza los UUID por los reales.

-- Opción A: si ya creaste los usuarios en auth.users desde el panel,
-- ejecuta esto para actualizar nombre/rol:
--
-- UPDATE usuarios SET
--   nombre = 'Admin Viáticos', rol = 'admin', iniciales = 'AV',
--   centro_id = '100010009', division = '4105'
-- WHERE correo = 'admin@viaticos.mx';
--
-- UPDATE usuarios SET
--   nombre = 'Roberto Hernández', rol = 'admin', iniciales = 'RH',
--   centro_id = '100010009', division = '4105'
-- WHERE correo = 'rhernandez@zapata.com.mx';

-- Opción B: crear los usuarios desde SQL (requiere extension pgcrypto).
-- Recomendado: SOLO use esto si no quieres usar el panel.
--
-- DO $$
-- DECLARE
--   uid1 UUID := gen_random_uuid();
--   uid2 UUID := gen_random_uuid();
-- BEGIN
--   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
--   VALUES
--     (uid1, 'admin@viaticos.mx',       crypt('1234', gen_salt('bf')), NOW(),
--      '{"nombre":"Admin Viáticos","rol":"admin"}'::jsonb),
--     (uid2, 'rhernandez@zapata.com.mx', crypt('1234', gen_salt('bf')), NOW(),
--      '{"nombre":"Roberto Hernández","rol":"admin"}'::jsonb);
--
--   -- El trigger handle_new_auth_user crea la fila en public.usuarios;
--   -- aquí solo completamos campos extra.
--   UPDATE usuarios SET centro_id='100010009', division='4105', iniciales='AV'
--   WHERE id = uid1;
--   UPDATE usuarios SET centro_id='100010009', division='4105', iniciales='RH'
--   WHERE id = uid2;
-- END $$;
