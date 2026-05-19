# ADR-008 — Confirmación del residente al cierre de solicitudes

**Estado:** Aprobado · Sprint 4 (Semana 6)
**Fecha:** 2026-05-08 (Sprint 4 Planning)

## Contexto

En la Sprint 3 Review el profesor del curso planteó la siguiente observación:

> *Cuando el técnico marca una solicitud como `resuelta`, el residente no tiene visibilidad ni control sobre si el problema fue efectivamente corregido. La solicitud se cierra unilateralmente desde el lado del técnico y queda registrada como atendida aunque el residente no esté satisfecho.*

El comportamiento previo era una transición directa `resuelta → cerrada` ejecutada por el técnico o el admin. Esto generaba:

- **Cierres falsos:** solicitudes marcadas como atendidas sin que el problema estuviera realmente resuelto.
- **Falta de retroalimentación:** el técnico no sabía si su trabajo cumplió con la expectativa del residente.
- **Sin trazabilidad de insatisfacción:** no había forma de detectar patrones de mal servicio.

El feedback fue incorporado al Product Backlog como HU-MANT-07 (P1) y se priorizó en el Sprint 4 junto a HU-MANT-06 (captura desde cámara móvil) como las dos mejoras del profesor.

## Opciones evaluadas

### A — Cierre automático tras 48 h sin objeción

El estado `resuelta` se autopromueve a `cerrada` si el residente no rechaza dentro de un plazo.

- ✅ No requiere interacción explícita del residente para casos satisfactorios.
- ❌ Si el residente no entra al sistema en 48 h, el cierre ocurre sin su consentimiento real.
- ❌ Requiere un job programado (cron, Edge Function scheduled) — fuera del scope del Sprint 4.
- ❌ Sigue siendo cierre unilateral disfrazado.

### B — Confirmación explícita del residente *(seleccionada)*

Tras `resuelta`, la solicitud queda en una bandeja "Pendientes de tu confirmación" en el dashboard del residente. El residente decide:

- **Confirmar solución** → estado `cerrada` y `confirmada_por_residente = true`.
- **Rechazar solución** → estado `en_progreso` con nota obligatoria; contador `intentos_resolucion` se incrementa.
- Tras `intentos_resolucion >= 3` → escalada automática: estado vuelve a `pendiente`, badge "ESCALADA AL ADMIN".

### C — Confirmación obligatoria del admin

El admin revisa cada resolución y decide cerrar.

- ❌ Aumenta carga del admin sin valor agregado.
- ❌ El admin no es el destinatario del trabajo; el residente sí.
- ❌ Cuello de botella para volúmenes altos.

## Decisión

**Se adopta la opción B.** El residente es el único actor que puede transicionar `resuelta → cerrada`. El rechazo devuelve la solicitud al ciclo de trabajo. Tras tres rechazos consecutivos se interpreta como un problema persistente y se escala al admin para re-evaluación.

## Implementación

### Cambios en BD (migración `sprint4_confirmacion_residente`)

Dos columnas nuevas en `solicitudes`:

| Columna | Tipo | Default | Propósito |
|---|---|---|---|
| `confirmada_por_residente` | `boolean` | `false` | Marca explícita de aceptación del residente |
| `intentos_resolucion` | `integer` | `0` | Contador de rechazos consecutivos (`>= 3` → escalada) |

Índice parcial para la query "pendientes de confirmación":

```sql
CREATE INDEX idx_solicitudes_pendientes_confirmacion
  ON solicitudes (residente_id, updated_at DESC)
  WHERE estado = 'resuelta' AND confirmada_por_residente = FALSE;
```

### RLS

Se extendió la policy `solicitudes_update` para incluir al residente en el conjunto autorizado, restringido a:

- **USING:** sus propias solicitudes (`residente_id = auth.uid()`) en estado `resuelta`.
- **WITH CHECK:** el estado final debe ser `cerrada`, `en_progreso` o `pendiente`.

Trigger `enforce_residente_update_scope_trg` (defensa en profundidad): si el rol del usuario que ejecuta el UPDATE es `residente`, bloquea cualquier cambio fuera de `estado`, `confirmada_por_residente`, `intentos_resolucion` y `updated_at`.

### Frontend

- Sección **"Pendientes de tu confirmación"** en `/residente` con badge "PENDIENTE TU CONFIRMACIÓN" en cada card.
- Componentes `ModalConfirmarSolucion` y `ModalRechazarSolucion`.
- Hook `useSolicitudesPendientesConfirmacion` y funciones `confirmarSolicitud()` / `rechazarSolicitud()`.
- Toda transición pasa por el helper centralizado `cambiarEstadoSolicitud()` (`src/lib/solicitudes.ts`) que orquesta UPDATE solicitudes + INSERT historial_estados + INSERT audit_log.

## Consecuencias

### Positivas

- **Trazabilidad real:** cada rechazo queda registrado en `historial_estados` con la nota del residente.
- **Control en manos del residente:** sin cierres unilaterales.
- **Detección de problemas:** la escalada tras 3 rechazos genera una alerta natural.
- **Auditable:** `audit_log` registra `confirmar_solicitud`, `rechazar_solucion`, `escalada_solicitud` con sus detalles.

### Negativas / mitigaciones

- **Solicitudes huérfanas:** si el residente no entra al sistema, las solicitudes permanecen indefinidamente en `resuelta`. *Mitigación: Sprint 6 incorpora email recordatorio automático.*
- **Posibles bucles de rechazo:** un residente conflictivo podría rechazar repetidamente. *Mitigación: tope de 3 rechazos antes de escalar; el admin reasigna.*
- **Carga extra de RLS:** la policy de UPDATE ahora evalúa 3 ramas (admin/técnico/residente). *Impacto: marginal — Postgres cachea `get_user_rol()` con initPlan.*

## Evidencia

- Migración aplicada: `sprint4_confirmacion_residente` (verificable con `supabase migrations list`).
- Helper centralizado con 8 tests unitarios en `src/test/residente/cambiarEstadoSolicitud.test.ts`.
- Tests RLS en `src/test/admin/rls-mantenimiento.test.ts`.
- Flujo end-to-end demostrado en Sprint 4 Review:
  - Laura Vega confirma ZIT-002 → `cerrada` ✓
  - Laura Vega rechaza ZIT-003 con nota → `en_progreso`, `intentos_resolucion = 1` ✓
- Documentación de UX y privacidad: `docs/privacidad.md`.

## Referencias

- HU-MANT-07 (Sprint 4 Artefactos, sección 5)
- PRD §3.1 (alcance MVP), §4.4 (modelo de datos), §11 (ADRs)
- [Supabase RLS — UPDATE with USING & WITH CHECK](https://supabase.com/docs/guides/database/postgres/row-level-security#policies-with-using-and-with-check)
