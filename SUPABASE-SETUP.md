# Configuración de Supabase — Viáticos

Guía paso a paso para conectar la app `index.html` con una base de datos real en Supabase.

---

## 1. Crear proyecto

1. Entra a [supabase.com](https://supabase.com) → **New project**.
2. Nombre: `viaticos-zapata` (o el que prefieras).
3. Región: **East US (Ohio)** o **South America (São Paulo)** (las más cercanas a México).
4. Database password: guárdala segura — la necesitarás para conectarte por SQL directo.
5. Plan: **Free** (suficiente para empezar).

Espera 1–2 minutos a que se aprovisione.

---

## 2. Ejecutar el schema

1. En el panel lateral → **SQL Editor** → **New query**.
2. Abre `supabase-schema.sql` de este repo, copia todo el contenido y pégalo en el editor.
3. Click **Run**. Deberías ver `Success. No rows returned.`
4. Verifica en **Table Editor** que aparezcan las tablas:
   - centros, cuentas_contables, usuarios, solicitudes, solicitud_items, comprobantes_cfdi, bitacora, borradores

---

## 3. Cargar datos iniciales

1. En **SQL Editor** → nueva query.
2. Abre `supabase-seed.sql`, copia y pega.
3. **Run**. Esto carga los 10 centros y las 9 cuentas contables.

---

## 4. Crear los 2 usuarios admin

### Opción rápida (recomendada):

1. **Authentication → Users → Add user → Create new user**.
2. Crea cada uno:
   - `admin@viaticos.mx` · password: `1234` (o el que prefieras)
   - `rhernandez@zapata.com.mx` · password: `1234`
3. ✅ Marca **Auto Confirm User** (para no requerir verificación de email).

Cada vez que crees un usuario, el trigger automático crea su fila en `public.usuarios` con rol `usuario` por defecto.

### Asignarles rol admin:

En **SQL Editor**:

```sql
UPDATE usuarios SET
  nombre = 'Admin Viáticos', rol = 'admin', iniciales = 'AV',
  centro_id = '100010009', division = '4105'
WHERE correo = 'admin@viaticos.mx';

UPDATE usuarios SET
  nombre = 'Roberto Hernández', rol = 'admin', iniciales = 'RH',
  centro_id = '100010009', division = '4105'
WHERE correo = 'rhernandez@zapata.com.mx';
```

---

## 5. Obtener credenciales para la app

1. **Project Settings → API**.
2. Copia estos dos valores:
   - **Project URL**: `https://xxxxxxx.supabase.co`
   - **anon / public key**: `eyJhb...` (es un JWT largo)

**No copies** la `service_role key` — esa es privada y nunca debe ir en el cliente.

---

## 6. Conectar el `index.html` a Supabase

Próximo paso: actualizar `index.html` para que use el SDK de Supabase en lugar de los arrays locales. Pídeme que lo haga cuando tengas:

- ✅ Project URL
- ✅ Anon key

Te dejaré conectado:
- Login real contra `auth.users`
- Lectura/escritura de solicitudes en BD
- Subida de XML/PDF a Storage
- Sincronización de catálogos

---

## Costos esperados (plan Free)

| Recurso | Límite Free | Tu uso estimado (50 usuarios) |
|---|---|---|
| Base de datos | 500 MB | ~30 MB primer año |
| Storage | 1 GB | ~200 MB primer año |
| Bandwidth | 5 GB/mes | ~500 MB/mes |
| Usuarios activos mensuales | 50,000 | 50 |

Cabes ampliamente. El día que necesites más, subes a **Pro ($25/mes)** sin migrar nada.

---

## Backup y migración futura

Tu BD es PostgreSQL estándar. Para respaldar:

```bash
# desde tu computadora (necesita psql instalado)
pg_dump "postgresql://postgres:[PASSWORD]@db.xxxxxxx.supabase.co:5432/postgres" > backup.sql
```

Esa exportación funciona en cualquier Postgres (RDS, otro Supabase, Neon, etc.).

---

## Soporte

- Docs Supabase: https://supabase.com/docs
- SQL editor con autocompletado: https://supabase.com/dashboard/project/_/sql
