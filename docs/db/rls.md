# Zity · Políticas RLS

> Estado al cierre del Sprint 3 (auditoría pre-Sprint 4) — extraído de `pg_policies` en el proyecto `hjxlahdvwqenwedhbtsu`.
>
> **RLS está habilitado en todas las tablas del schema `public`.**
>
> Helper `get_user_rol()` (SECURITY DEFINER, STABLE): devuelve el rol del usuario autenticado leyendo `public.usuarios.rol` por `auth.uid()`.

## Principios

1. **Admin lo ve todo.** En cada tabla hay al menos una rama OR que filtra por `(select get_user_rol()) = 'admin'`.
2. **El dueño ve lo suyo.** Residente ve sus solicitudes, técnico ve sus asignaciones, cada usuario lee/edita su propio perfil.
3. **`audit_log` es write-only para las edge functions** (via `service_role`) y read-only para admin. Ningún rol autenticado normal escribe allí.
4. **`service_role` bypass-ea RLS** en todas las tablas — las edge functions usan esta llave para operaciones administrativas.
5. **Performance:** todas las llamadas a `auth.uid()` y `get_user_rol()` se envuelven en `(select …)` para que Postgres las cachee con `initPlan` y no las ejecute por fila ([referencia Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)).
6. **Una policy permisiva por (rol, acción)** combinando con OR las distintas ramas de autorización, en lugar de varias policies acumulativas. Reduce el costo de evaluación.

## Policies por tabla

### `usuarios`

| Policy | Cmd | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `usuarios_select` | SELECT | authenticated | `(select auth.uid()) = id OR (select get_user_rol()) = 'admin'` | — |
| `usuarios_update` | UPDATE | authenticated | misma condición | misma condición |

**Efecto:** un residente/técnico ve y edita solo su propia fila. El admin ve y edita todas. Cambios de `estado_cuenta` (bloquear/desbloquear) los hace la edge function `bloquear-cuenta` con `service_role`.

### `invitaciones`

| Policy | Cmd | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `admin_select_invitaciones` | SELECT | authenticated | `EXISTS (… usuarios.id = (select auth.uid()) AND rol='admin')` | — |
| `admin_insert_invitaciones` | INSERT | authenticated | — | misma condición |

**Cambio en Sprint 3 audit:** se eliminó `anon_select_invitacion_por_token` (qual=true) que exponía toda la tabla a usuarios anónimos. El flujo `/activar` no la consume — la sesión de invite se establece vía Supabase Auth y la página lee `email` del JWT.

### `edificios`

| Policy | Cmd | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `edificios_select_authenticated` | SELECT | authenticated | `(select auth.uid()) IS NOT NULL` | — |
| `edificios_insert_admin` | INSERT | authenticated | — | `(select get_user_rol()) = 'admin'` |
| `edificios_update_admin` | UPDATE | authenticated | `(select get_user_rol()) = 'admin'` | — |
| `edificios_delete_admin` | DELETE | authenticated | `(select get_user_rol()) = 'admin'` | — |

### `unidades`

| Policy | Cmd | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `unidades_select_authenticated` | SELECT | authenticated | `(select auth.uid()) IS NOT NULL` | — |
| `unidades_insert_admin` | INSERT | authenticated | — | `(select get_user_rol()) = 'admin'` |
| `unidades_update_admin` | UPDATE | authenticated | `(select get_user_rol()) = 'admin'` | — |

### `solicitudes` (Sprint 3+)

| Policy | Cmd | Roles | Filtro |
|---|---|---|---|
| `solicitudes_select` | SELECT | authenticated | `residente_id = (select auth.uid()) OR admin OR (técnico ∧ id ∈ asignaciones del técnico)` |
| `solicitudes_insert_residente` | INSERT | authenticated | `residente_id = (select auth.uid()) AND rol ∈ {residente, admin}` |
| `solicitudes_update` | UPDATE | authenticated | `admin OR (técnico ∧ id ∈ asignaciones del técnico)` |

**Cambio en Sprint 3 audit:** se eliminaron las policies duplicadas `admin_all_solicitudes`, `residente_select_own_solicitudes` y `residente_insert_solicitud` que dejó la migración `sprint2_schema` sin remover las del schema base. Las restantes se consolidaron en una sola policy permisiva por acción.

### `asignaciones` (Sprint 3+)

| Policy | Cmd | Roles | Filtro |
|---|---|---|---|
| `asignaciones_select` | SELECT | authenticated | `admin OR tecnico_id = (select auth.uid())` |
| `asignaciones_insert_admin` | INSERT | authenticated | `(select get_user_rol()) = 'admin'` |

### `historial_estados` (Sprint 3+)

| Policy | Cmd | Roles | Filtro |
|---|---|---|---|
| `historial_select` | SELECT | authenticated | `admin OR solicitud_id IN (solicitudes propias ∪ asignaciones propias)` |
| `historial_insert_auth` | INSERT | authenticated | `cambiado_por = (select auth.uid())` |

### `notificaciones`

| Policy | Cmd | Roles | Filtro |
|---|---|---|---|
| `notificaciones_select_own` | SELECT | authenticated | `usuario_id = (select auth.uid())` |
| `notificaciones_update_own` | UPDATE | authenticated | `usuario_id = (select auth.uid())` |
| `notificaciones_insert_own` | INSERT | authenticated | `usuario_id = (select auth.uid())` |
| `notificaciones_insert_service_role` | INSERT | service_role | — |

### `audit_log`

| Policy | Cmd | Roles | Filtro |
|---|---|---|---|
| `audit_select_admin` | SELECT | authenticated | `(select get_user_rol()) = 'admin'` |
| `service_role_audit_log` | ALL | service_role | — |

**Cambio en Sprint 3 audit:** se eliminó `audit_insert_service_role`, redundante con `service_role_audit_log` que ya cubre INSERT vía `FOR ALL`.

## Triggers eliminados en Sprint 3 audit

- `on_auth_user_verified` y la función `handle_user_verified()`: activaban `estado_cuenta='activo'` automáticamente al confirmar el email, contradiciendo el flujo donde el admin debe aprobar la cuenta. Sin el trigger, la cuenta queda en `pendiente` hasta que el admin invoque la ruta correspondiente.

## Verificación

- Advisors de Supabase corridos después de la auditoría: **0 lints de seguridad de RLS**, **0 lints `multiple_permissive_policies`**, **0 lints `unindexed_foreign_keys`**.
- Quedan pendientes (no bloquean la demo):
  - Habilitar "leaked password protection" en Auth → Password Security del dashboard.
  - El advisor `auth_security_definer_function_executable` para `get_user_rol()` queda como WARN aceptado: la función necesita ser invocable por `authenticated` para que las policies funcionen.
- Tests de integración con clientes de los 3 roles contra las policies reales — pendiente para Sprint 4 (los actuales en `src/test/admin/rls.test.ts` son tests de mock).
