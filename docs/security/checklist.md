# Checklist OWASP Top 10 — Zity

> Cobertura aplicada hasta Sprint 4 (Semana 6).
> Estado: parcial — A01, A03 y A07 cubiertos. Resto se completa en Sprint 7 (PBI-20).

| ID | Categoría | Estado | Evidencia |
|---|---|---|---|
| A01 | Broken Access Control | ✅ Sprint 4 | RLS por rol en todas las tablas + `ProtectedRoute` en frontend + trigger `enforce_residente_update_scope_trg`. |
| A02 | Cryptographic Failures | ⏳ Sprint 7 | Supabase fuerza HTTPS. Tokens JWT firmados con clave del proyecto. Sin secretos en código (verificable). |
| A03 | Injection | ✅ Sprint 4 | Cliente JS de Supabase usa parámetros ligados (no string interpolation). Toda función `SECURITY DEFINER` declara `SET search_path = public`. |
| A04 | Insecure Design | ⏳ Sprint 7 | Pendiente: threat model formal + diagrama de flujo de datos. |
| A05 | Security Misconfiguration | ⏳ Sprint 7 | `.env` en `.gitignore`. CORS limitado en Edge Functions. Falta auditoría completa. |
| A06 | Vulnerable & Outdated Components | ⏳ Sprint 7/10 | `npm audit` se corre manualmente. En Sprint 10 se programará como check de CI. |
| A07 | Identification & Authentication Failures | ✅ Sprint 4 | Supabase Auth + JWT con verificación criptográfica en Edge Functions (no `atob`). Email verification obligatoria. Recuperación segura via magic link. |
| A08 | Software & Data Integrity Failures | ⏳ Sprint 7 | Pending. |
| A09 | Security Logging & Monitoring Failures | 🔄 Parcial | `audit_log` opera para crear/asignar/cerrar/bloquear/confirmar/rechazar. Sin alertas todavía (Sprint 13). |
| A10 | Server-Side Request Forgery | ⏳ Sprint 7 | Edge Functions no hacen requests a URLs proporcionadas por el usuario. |

## A01 — Broken Access Control

### Verificación en Sprint 4

| Vector | Mitigación |
|---|---|
| Residente intenta leer solicitudes de otro residente | RLS `solicitudes_select`: `residente_id = auth.uid()` para residentes |
| Técnico A intenta UPDATE en solicitud de técnico B | RLS `solicitudes_update`: subquery a `asignaciones WHERE tecnico_id = auth.uid()` |
| Residente intenta cambiar `descripcion`/`tipo` de su propia solicitud | Trigger `enforce_residente_update_scope_trg`: rechaza con `42501` si cualquier campo fuera de `{estado, confirmada_por_residente, intentos_resolucion, updated_at}` cambia |
| Residente intenta confirmar antes de que el técnico marque resuelta | RLS USING `estado = 'resuelta'`: el residente sólo ve la fila como editable cuando está en `resuelta` |
| Residente intenta dejar la solicitud en `asignada` o `resuelta` (estados no válidos para él) | RLS WITH CHECK: el estado final debe ser `cerrada`, `en_progreso` o `pendiente` |
| Anónimo intenta listar o modificar | RLS: todas las policies se asignan al rol `authenticated` |
| Usuario `bloqueado` intenta operar | Frontend redirige al bloqueo; backend rechaza por RLS (`get_user_rol()` no aplica) |

### Tests automatizados

- `src/test/admin/rls-mantenimiento.test.ts` (13 casos)
- `src/test/admin/rls.test.ts` (cuentas y RLS general)
- `src/test/residente/cambiarEstadoSolicitud.test.ts` (8 casos del helper centralizado)

## A03 — Injection

### Verificación en Sprint 4

- **No usamos `execute_sql` con string interpolation desde frontend.** Todas las queries pasan por el cliente JS de Supabase con parámetros ligados.
- **Funciones `SECURITY DEFINER` con `search_path` fijo:**
  - `get_user_rol()`, `handle_new_user()`, `handle_updated_at()`, `generate_solicitud_codigo()`, `log_solicitud_creada()`, `log_solicitud_prioridad_cambiada()`, `revoke_user_sessions()`, `guard_usuario_estado_y_rol()`, `enforce_residente_update_scope()` declaran `SET search_path = public`.
- **EXECUTE revocado de `anon` y `authenticated`** para funciones internas (sólo invocables vía trigger o por `service_role`).
- **Edge Functions:**
  - CORS limitado a `https://zity.site`, `https://www.zity.site`, `localhost` (no wildcard).
  - JWT verificado con `supabase.auth.getUser(token)` (validación criptográfica) — **no** se decodifica manualmente con `atob`.
- **Validación en el cliente y en el backend:**
  - HU-MANT-04: nota de cierre obligatoria 20-500 chars validada en frontend Y por longitud lógica al insertar en `historial_estados`.
  - HU-MANT-07: nota de rechazo obligatoria 20-500 chars validada en cliente.

## A07 — Identification & Authentication Failures

### Verificación en Sprint 4

- **JWT criptográfico:** Edge Functions usan `supabase.auth.getUser(token)` que valida la firma contra la clave del proyecto. Eliminado el patrón previo `atob(payload)` (Sprint 3 hardening).
- **Email verification obligatoria:** trigger `on_auth_user_created` deja al usuario en `estado_cuenta = 'pendiente'`. El admin debe activarlo manualmente desde `/admin/usuarios`.
- **Recuperación de contraseña:** vía magic link de Supabase Auth. Token de un solo uso, expiración corta.
- **Invalidación de sesión al bloquear:** `bloquear-cuenta` Edge Function llama a `revoke_user_sessions(uuid)` (RPC `SECURITY DEFINER`, EXECUTE sólo para `service_role`) que elimina filas de `auth.sessions` — fuerza re-login.
- **Anti-auto-bloqueo:** la Edge Function `bloquear-cuenta` rechaza si `caller.id === target.id`.

### Pendientes (Sprint 14)

- 2FA opcional via Twilio Verify para cuentas `admin` (sorpresa final del curso).
- Política de complejidad de contraseñas (Sprint 13).
- Detección de contraseñas filtradas via HaveIBeenPwned (advisor de Supabase, fácil de activar — ver `auth_leaked_password_protection`).

## Referencias

- [OWASP Top 10:2021](https://owasp.org/Top10/)
- [Supabase — Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- `docs/db/rls.md` — políticas RLS detalladas
- `docs/adr/008-confirmacion-residente.md` — defensa en profundidad para HU-MANT-07
