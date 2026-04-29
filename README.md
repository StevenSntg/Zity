# Zity

Sistema de gestión de solicitudes de mantenimiento para edificios y condominios.

## Prerequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- Cuenta de [Supabase](https://supabase.com/) (para base de datos y autenticación)

## Configuración de entorno

1. Copia el archivo de ejemplo de variables de entorno:

```bash
cp .env.example .env
```

2. Edita `.env` con las credenciales de tu proyecto Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
# Solo necesaria para scripts/seed.js
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
# Opcional — URL absoluta usada en los correos de Supabase Auth
VITE_SITE_URL=https://zity.site
```

> Las tres primeras variables se obtienen desde el dashboard de Supabase en Settings → API.

## Correr localmente

```bash
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`.

## Ejecutar pruebas

```bash
# Tests en modo watch
npm test

# Tests una sola vez
npm run test:run

# Tests con reporte de cobertura
npm run test:coverage
```

## Lint y typecheck

```bash
# ESLint sobre src/, scripts/, configs.
npm run lint

# Comprobación de tipos sin emitir archivos.
npm run typecheck
```

## Datos demo (seed)

```bash
# Inserta los usuarios demo; idempotente (upsert por id).
npm run seed

# Limpia la BD demo y vuelve a insertar desde cero.
npm run seed:clean
```

El seed carga **6 usuarios ficticios + 1 invitación pendiente** (ver `scripts/seed.js`):

| Email | Contraseña | Rol | Estado |
|---|---|---|---|
| carlos@zity-demo.com | `Admin1234!` | admin | activo |
| laura@zity-demo.com | `Residente1!` | residente | activo (piso 4-B) |
| pedro@zity-demo.com | `Residente2!` | residente | activo (piso 2-A) |
| julia@zity-demo.com | `Residente3!` | residente | activo (piso 5-C) |
| mario@zity-demo.com | `Tecnico1234!` | técnico interno | activo |
| ana@zity-demo.com | `Tecnico5678!` | técnico tercero · TecnoEdif SAC | activo |
| nuevo.residente@ejemplo.com | — | — | invitación pendiente (hace 3 días) |

> Sin PII real. Todos los datos son ficticios.

## Build para producción

```bash
npm run build
npm run preview
```

## Estructura de base de datos

La documentación completa del modelo de datos y las policies RLS vive en `docs/db/`:

- [`docs/db/schema.md`](docs/db/schema.md) — diagrama ER (Mermaid), tablas por módulo, triggers, funciones y Edge Functions.
- [`docs/db/rls.md`](docs/db/rls.md) — principios y tabla por tabla de las policies aplicadas.

### Módulos modelados (Sprint 2)

| Módulo | Tablas | Estado |
|---|---|---|
| Usuarios | `usuarios`, `invitaciones`, `edificios`, `unidades` | ✅ operativo |
| Mantenimiento | `solicitudes`, `asignaciones`, `historial_estados` | 🔜 activación en Sprint 3 |
| Soporte global | `notificaciones`, `audit_log` | ✅ disponible |

### Migraciones

Gestionadas con Supabase (`supabase db push` o MCP). Las migraciones aplicadas hasta el cierre del Sprint 2 están listadas en `docs/db/schema.md`.

### Edge Functions

Viven en `supabase/functions/`:

- `invitaciones` — crear/reenviar invitación (`accion: 'crear' | 'reenviar'`), escribe en `invitaciones` + `audit_log` con `service_role`.
- `bloquear-cuenta` — bloquear/desbloquear usuario, invalida la sesión activa vía `ban_duration`, impide auto-bloqueo.

Despliegue:

```bash
supabase functions deploy invitaciones
supabase functions deploy bloquear-cuenta
# Variable opcional que fija el dominio de los links en los correos:
supabase secrets set SITE_URL=https://zity.site
```

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + TailwindCSS v4 |
| Auth + DB | Supabase (Postgres 17 + Auth + Edge Functions) |
| Deploy | Vercel |
| CI/CD | GitHub Actions |
| Testing | Vitest + Testing Library |

## Política de datos

- Todos los datos de demo son ficticios.
- Prohibido subir PII real al repositorio.
- `.env` y `.env.local` están en `.gitignore`.
- El `audit_log` y las acciones administrativas (bloquear, invitar) las escribe solo el backend vía `service_role`; los clientes autenticados no escriben directamente en `audit_log`.
