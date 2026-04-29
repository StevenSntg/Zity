# Zity · Modelo de datos

> Estado al cierre del Sprint 3 (post-auditoría pre-Sprint 4) — extraído directamente del proyecto Supabase `hjxlahdvwqenwedhbtsu` (rama principal).
>
> Migraciones aplicadas:
> - `20260415163716 · create_tables`
> - `20260415163741 · auth_triggers_and_rls`
> - `20260422190400 · sprint2_schema` — rename profiles → usuarios y nuevas tablas
> - `20260422192733 · sprint2_fix_functions_profiles_to_usuarios`
> - `20260422222347 · sprint2_harden_insert_policies` — cierre de policies permisivas detectadas por el advisor
> - `20260428xxxxxx · sprint3_audit_security_perf_hardening` — eliminó trigger `on_auth_user_verified`, policy anon de invitaciones, policies duplicadas en solicitudes/audit_log; reescribió todas las policies con `(select …)` para optimizar planes; añadió índices faltantes
> - `20260428xxxxxx · sprint3_audit_consolidate_policies` — consolidó policies permisivas múltiples en una sola por (rol, acción)

## Diagrama ER

```mermaid
erDiagram
    auth_users ||--o| usuarios : "1-1 (FK a auth.users.id)"
    usuarios ||--o{ invitaciones : "crea"
    usuarios ||--o{ solicitudes : "crea (residente)"
    usuarios ||--o{ asignaciones : "asignado_por (admin)"
    usuarios ||--o{ asignaciones : "tecnico_id"
    usuarios ||--o{ historial_estados : "cambiado_por"
    usuarios ||--o{ notificaciones : "destinatario"
    usuarios ||--o{ audit_log : "actor"
    edificios ||--o{ unidades : "contiene"
    unidades ||--o{ solicitudes : "ubica"
    solicitudes ||--o{ asignaciones : "se asigna en"
    solicitudes ||--o{ historial_estados : "cambios"
    solicitudes ||--o{ notificaciones : "genera"

    auth_users {
        uuid id PK
        text email
        timestamptz email_confirmed_at
        jsonb raw_user_meta_data
    }

    usuarios {
        uuid id PK "FK auth.users.id"
        text email UK
        text nombre
        text apellido
        text telefono
        text rol "residente | admin | tecnico"
        text piso
        text departamento
        text estado_cuenta "pendiente | activo | bloqueado"
        text empresa_tercero "nullable"
        timestamptz created_at
        timestamptz updated_at
    }

    invitaciones {
        uuid id PK
        text email
        text rol
        text nombre
        text piso
        text departamento
        text token UK
        text estado "pendiente | aceptada | expirada"
        uuid creada_por FK
        timestamptz expires_at "default now() + 48h"
        timestamptz created_at
    }

    edificios {
        uuid id PK
        text nombre
        text direccion
        int pisos "check > 0"
        int unidades_por_piso "check > 0"
        timestamptz created_at
    }

    unidades {
        uuid id PK
        uuid edificio_id FK
        text numero
        int piso
        text descripcion
        timestamptz created_at
    }

    solicitudes {
        uuid id PK
        uuid residente_id FK
        uuid unidad_id FK "nullable"
        text tipo "mantenimiento|reparacion|queja|sugerencia|otro"
        text categoria "plomeria|electricidad|limpieza|seguridad|areas_comunes|otro"
        text descripcion
        text estado "pendiente|asignada|en_progreso|resuelta|cerrada"
        text prioridad
        text imagen_url
        text piso
        text departamento
        timestamptz created_at
        timestamptz updated_at
    }

    asignaciones {
        uuid id PK
        uuid solicitud_id FK
        uuid tecnico_id FK
        uuid asignado_por FK
        timestamptz fecha_asignacion
        text notas
        text empresa_tercero
    }

    historial_estados {
        uuid id PK
        uuid solicitud_id FK
        text estado_anterior
        text estado_nuevo
        uuid cambiado_por FK
        text nota
        timestamptz created_at
    }

    notificaciones {
        uuid id PK
        uuid usuario_id FK
        uuid solicitud_id FK "nullable"
        text tipo "estado_cambio|asignacion|nueva_solicitud|sistema"
        text mensaje
        boolean leida
        timestamptz created_at
    }

    audit_log {
        uuid id PK
        uuid usuario_id FK "nullable"
        text accion
        text entidad
        uuid entidad_id
        jsonb detalles
        text resultado "exitoso | fallido"
        timestamptz created_at
    }
```

## Tablas por módulo

### Módulo Usuarios (operativo · Sprint 2)

| Tabla | Propósito | Check constraints |
|---|---|---|
| `usuarios` | Perfil de aplicación ligado 1-1 a `auth.users`. El trigger `on_auth_user_created` inserta la fila al registrarse. | `rol ∈ {residente, admin, tecnico}`, `estado_cuenta ∈ {pendiente, activo, bloqueado}` |
| `invitaciones` | Tracking de invitaciones enviadas por el admin. Token único y `expires_at` con default `now() + 48h`. | `rol ∈ {residente, tecnico, admin}`, `estado ∈ {pendiente, aceptada, expirada}` |
| `edificios` | Datos del edificio gestionado. Una instancia = un edificio. | `pisos > 0`, `unidades_por_piso > 0` |
| `unidades` | Unidades habitacionales del edificio. | — |

### Módulo Mantenimiento (diseño anticipado · Sprint 3+)

| Tabla | Propósito | Check constraints |
|---|---|---|
| `solicitudes` | Solicitudes de mantenimiento creadas por residentes. | `tipo`, `categoria`, `estado` con dominios cerrados |
| `asignaciones` | Relación técnico ↔ solicitud, con `empresa_tercero` opcional. | — |
| `historial_estados` | Auditoría de cada cambio de estado de una solicitud. | — |

### Soporte global

| Tabla | Propósito | Check constraints |
|---|---|---|
| `notificaciones` | Bandeja por usuario. | `tipo ∈ {estado_cambio, asignacion, nueva_solicitud, sistema}` |
| `audit_log` | Registro de acciones administrativas. Solo admin lee; solo service_role escribe. | `resultado ∈ {exitoso, fallido}` |

## Triggers y funciones

| Objeto | Schema | Tipo | Responsabilidad |
|---|---|---|---|
| `handle_new_user()` | public | SECURITY DEFINER · PLPGSQL | Crea fila en `usuarios` al registrarse un usuario en `auth.users`. Copia nombre, apellido, rol, piso, departamento desde `raw_user_meta_data`. EXECUTE revocado de `anon` y `authenticated`. |
| `handle_updated_at()` | public | SECURITY DEFINER · PLPGSQL | Refresca `updated_at` en `UPDATE` de `usuarios` y `solicitudes`. EXECUTE revocado de `anon` y `authenticated`. |
| `get_user_rol()` | public | SECURITY DEFINER · SQL · STABLE | Helper que devuelve el rol del usuario autenticado actual. Se usa en policies RLS envuelto en `(select …)` para que Postgres la cachee con `initPlan`. EXECUTE revocado de `anon`. |
| `on_auth_user_created` | auth.users | trigger AFTER INSERT | Dispara `handle_new_user`. |
| `set_profiles_updated_at` | public.usuarios | trigger BEFORE UPDATE | Dispara `handle_updated_at`. (Conserva el nombre histórico `profiles` aunque la tabla se renombró a `usuarios`.) |
| `set_solicitudes_updated_at` | public.solicitudes | trigger BEFORE UPDATE | Dispara `handle_updated_at`. |

**Eliminados en la auditoría pre-Sprint 4:**
- `handle_user_verified()` y el trigger `on_auth_user_verified`: activaban `estado_cuenta='activo'` automáticamente al confirmar el email, contradiciendo el flujo donde el admin debe aprobar la cuenta primero.

## Edge Functions

> Ambas funciones usan `verify_jwt: false` en el deploy y validan ellas mismas el token.
> La validación se hace con `supabase.auth.getUser(token)` (que verifica la firma criptográfica
> contra la clave secreta del proyecto) — **no** con decodificación manual `atob` del payload,
> que era el patrón anterior y permitía falsificar JWTs.
>
> CORS restringido a `https://zity.site`, `https://www.zity.site` y `localhost` para dev.
>
> Helpers compartidos en `supabase/functions/_shared/auth.ts`: `requireAdmin`, `corsHeaders`, `jsonResponse`.

| Función | Responsabilidad |
|---|---|
| `invitaciones` | `accion='crear'`: valida admin, llama `inviteUserByEmail`, registra en `invitaciones` con `expires_at = now() + 48h`, audita. `accion='reenviar'`: regenera link con `generateLink({type:'invite'})` y actualiza `expires_at`. |
| `bloquear-cuenta` | Valida admin, rechaza auto-bloqueo (`caller.id === target.id`), actualiza `estado_cuenta`, aplica/revoca `ban_duration` para invalidar sesión activa, audita. |
