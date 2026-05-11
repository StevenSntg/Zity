// HU-MANT-04 SPRINT-4
// Lógica de actualización de estado para el técnico.
// Define la máquina de estados válida (asignada→en_progreso, en_progreso→resuelta)
// y delega la escritura combinada (estado + historial + audit) en el helper
// centralizado `cambiarEstadoSolicitud()`.

import { cambiarEstadoSolicitud } from '../lib/solicitudes'
import type { EstadoSolicitud } from '../types/database'

// ─── Máquina de estados del técnico ─────────────────────────────────────────

// HU-MANT-04 SPRINT-4 — Solo transiciones permitidas para el técnico
export const TRANSICIONES_VALIDAS: Partial<Record<EstadoSolicitud, EstadoSolicitud>> = {
  asignada: 'en_progreso',
  en_progreso: 'resuelta',
}

export const NOTA_RESUELTA_MIN = 20
export const NOTA_RESUELTA_MAX = 500
export const NOTA_EN_PROGRESO_MAX = 300

/**
 * HU-MANT-04 SPRINT-4
 * Devuelve el estado destino válido desde el estado actual,
 * o null si no hay transición disponible (ej. ya está resuelta).
 */
export function estadoDestinoValido(estadoActual: EstadoSolicitud): EstadoSolicitud | null {
  return TRANSICIONES_VALIDAS[estadoActual] ?? null
}

// ─── Payload y resultado ─────────────────────────────────────────────────────

export type PayloadActualizarEstado = {
  solicitudId: string
  estadoAnterior: EstadoSolicitud
  estadoNuevo: EstadoSolicitud
  nota: string          // vacía permitida para en_progreso; obligatoria para resuelta
  tecnicoId: string     // auth.uid() — también validado por RLS en BD
}

export type ResultadoActualizarEstado = {
  ok: boolean
  error?: string
}

// ─── Función principal ───────────────────────────────────────────────────────

/**
 * HU-MANT-04 SPRINT-4
 * Actualiza el estado de una solicitud asignada al técnico.
 *
 * Flujo:
 *   1. Valida la transición y la nota en cliente.
 *   2. Delega en `cambiarEstadoSolicitud()` la escritura combinada de
 *      solicitudes.estado, historial_estados y audit_log.
 *
 * La RLS de solicitudes bloquea el UPDATE si el técnico no tiene la solicitud
 * asignada.
 */
export async function actualizarEstadoTecnico(
  payload: PayloadActualizarEstado,
): Promise<ResultadoActualizarEstado> {
  const { solicitudId, estadoAnterior, estadoNuevo, nota, tecnicoId } = payload

  // ── Validación cliente ───────────────────────────────────────────────────
  const destinoEsperado = TRANSICIONES_VALIDAS[estadoAnterior]
  if (destinoEsperado !== estadoNuevo) {
    return { ok: false, error: `Transición inválida: ${estadoAnterior} → ${estadoNuevo}` }
  }

  // HU-MANT-04 SPRINT-4 — nota obligatoria para "resuelta"
  if (estadoNuevo === 'resuelta') {
    const notaTrim = nota.trim()
    if (notaTrim.length < NOTA_RESUELTA_MIN) {
      return {
        ok: false,
        error: `La nota de cierre debe tener al menos ${NOTA_RESUELTA_MIN} caracteres.`,
      }
    }
    if (notaTrim.length > NOTA_RESUELTA_MAX) {
      return {
        ok: false,
        error: `La nota de cierre no puede superar ${NOTA_RESUELTA_MAX} caracteres.`,
      }
    }
  }

  // ── Cambio de estado vía helper centralizado ─────────────────────────────
  return cambiarEstadoSolicitud({
    solicitudId,
    estadoAnterior,
    estadoNuevo,
    nota,
    usuarioId: tecnicoId,
    accionAudit: 'actualizar_estado_solicitud',
  })
}
