# Zity · Políticas RLS

> Estado al cierre del Sprint 2 — extraído de `pg_policies` en el proyecto `hjxlahdvwqenwedhbtsu`.
>
> **RLS está habilitado en todas las tablas del schema `public`.**
>
> Helper `get_user_rol()` (SECURITY DEFINER): devuelve el rol del usuario autenticado leyendo `public.usuarios.rol` por `auth.uid()`.

## Principios

1. **Admin lo ve todo.** En cada tabla hay al menos una policy que filtra por `get_user_rol() = 'admin'`.
2. **El dueño ve lo suyo.** Residente ve sus solicitudes, técnico ve sus asignaciones, cada usuario lee/edita su propio perfil.
3. **`audit_log` es write-only para las edge functions** (via `service_role`) y read-only para admin. Ningún rol autenticado normal escribe allí.
4. **`service_role` bypass-ea RLS** en todas las tablas — las edge functions usan esta llave para operaciones administrativas.

## Policies por tabla

### `usuarios`

| Policy | Cmd | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `profiles_select_own` | SELECT | public | `auth.uid() = id` | — |
| `profiles_select_admin` | SELECT | public | `get_user_rol() = 'admin'` | — |
| `profiles_update_own` | UPDATE | public | `auth.uid() = id` | `auth.uid() = id` |
| `profiles_update_admin` | UPDATE | public | `get_user_rol() = 'admin'` | — |

**Efecto:** un residente/técnico ve y edita solo su propia fila. El admin ve y edita todas. Cambios de `estado_cuenta` (bloquear/desbloquear) los hace la edge function `bloquear-cuenta` con `service_role`.

### `invitaciones`

| Policy | Cmd | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `admin_select_invitaciones` | SELECT | authenticated | `EXISTS (…usuarios.rol='admin'…)` | — |
| `admin_insert_invitaciones` | INSERT | authenticated | — | `EXISTS (…usuarios.rol='admin'…)` |
| `anon_select_invitacion_por_token` | SELECT | anon | `true` | — |

**Efecto:** solo el admin consulta y crea invitaciones desde el panel. La lectura anónima por token permite al flujo `/activar` validar el link antes de exigir sesión. El insert también lo hace la edge function `invitaciones` con `service_role`.

### `edificios`

| Policy | Cmd | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `edificios_select_authenticated` | SELECT | public | `auth.uid() IS NOT NULL` | — |
| `edificios_insert_admin` | INSERT | public | — | `get_user_rol() = 'admin'` |
| `edificios_update_admin` | UPDATE | public | `get_user_rol() = 'admin'` | — |
| `edificios_delete_admin` | DELETE | public | `get_user_rol() = 'admin'` | — |

### `unidades`

| Policy | Cmd | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `unidades_select_authenticated` | SELECT | public | `auth.uid() IS NOT NULL` | — |
| `unidades_insert_admin` | INSERT | public | — | `get_user_rol() = 'admin'` |
| `unidades_update_admin` | UPDATE | public | `get_user_rol() = 'admin'` | — |

### `solicitudes` (Sprint 3+)

| Policy | Cmd | Roles | Filtro |
|---|---|---|---|
| `solicitudes_select_own` | SELECT | public | `residente_id = auth.uid()` |
| `solicitudes_select_admin` | SELECT | public | `get_user_rol() = 'admin'` |
| `solicitudes_select_tecnico` | SELECT | public | técnico asignado en `asignaciones` |
| `residente_select_own_solicitudes` | SELECT | authenticated | residente propio o rol admin/técnico |
| `solicitudes_insert_residente` | INSERT | public | `residente_id = auth.uid()` y rol residente/admin |
| `residente_insert_solicitud` | INSERT | authenticated | mismo residente + rol `residente` |
| `solicitudes_update_admin` | UPDATE | public | `get_user_rol() = 'admin'` |
| `solicitudes_update_tecnico` | UPDATE | public | técnico asignado |
| `admin_all_solicitudes` | ALL | authenticated | admin |

### `asignaciones` (Sprint 3+)

| Policy | Cmd | Roles | Filtro |
|---|---|---|---|
| `asignaciones_select_admin` | SELECT | public | admin |
| `asignaciones_select_tecnico` | SELECT | public | `tecnico_id = auth.uid()` |
| `asignaciones_insert_admin` | INSERT | public | admin |

### `historial_estados` (Sprint 3+)

| Policy | Cmd | Roles | Filtro |
|---|---|---|---|
| `historial_select_admin` | SELECT | public | admin |
| `historial_select_involved` | SELECT | public | residente o técnico involucrado |
| `historial_insert_auth` | INSERT | public | `cambiado_por = auth.uid()` |

### `notificaciones`

| Policy | Cmd | Roles | Filtro |
|---|---|---|---|
| `notificaciones_select_own` | SELECT | public | `usuario_id = auth.uid()` |
| `notificaciones_update_own` | UPDATE | public | `usuario_id = auth.uid()` |
| `notificaciones_insert_own` | INSERT | authenticated | `usuario_id = auth.uid()` |
| `notificaciones_insert_service_role` | INSERT | service_role | — |

> La policy permisiva original `notificaciones_insert_system (WITH CHECK true)` fue eliminada en la migración `sprint2_harden_insert_policies` (advisor de Supabase la marcaba como demasiado abierta). Ahora un usuario autenticado solo puede crearse notificaciones a sí mismo; el backend las crea con `service_role`.

### `audit_log`

| Policy | Cmd | Roles | Filtro |
|---|---|---|---|
| `audit_select_admin` | SELECT | public | admin |
| `service_role_audit_log` | ALL | service_role | — |
| `audit_insert_service_role` | INSERT | service_role | — |

> La policy original `audit_insert_system (WITH CHECK true)` fue eliminada en la misma migración de hardening. El `audit_log` ahora solo es escrito por las edge functions vía `service_role`.

## Verificación

- Tests de lógica de autorización en `src/test/admin/rls.test.ts`.
- Advisors de seguridad de Supabase corridos después del Sprint 2 (`mcp__Supabase__get_advisors`): **0 lints RLS**. Queda pendiente activar "leaked password protection" en Auth → Password Security del dashboard (no bloquea la demo).

## Próximos pasos (Sprint 3+)

- Tests de integración con clientes de los 3 roles contra las policies reales (acción 1 de la Retrospective del Sprint 2).
- Revisar policies duplicadas en `solicitudes` (hay dos conjuntos — `authenticated` y `public` — que conviene unificar cuando el módulo de mantenimiento entre en desarrollo activo).
