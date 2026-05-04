// HU-MANT-04 SPRINT-4
// Lógica de actualización de estado para el técnico.
// Define la máquina de estados válida (asignada→en_progreso, en_progreso→resuelta)
// y ejecuta: UPDATE solicitudes.estado + INSERT historial_estados + audit_log.
// El historial siempre se registra; el audit_log es fire-and-forget.

import { supabase } from '../lib/supabase'
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
 * Actualiza el estado de una solicitud asignada al técnico:
 *   1. Valida la transición y la nota en cliente
 *   2. UPDATE solicitudes.estado (RLS bloquea si no es el técnico asignado)
 *   3. INSERT historial_estados con nota
 *   4. INSERT audit_log (fire-and-forget)
 *
 * Si el UPDATE falla el INSERT de historial no se ejecuta.
 * Si el INSERT de historial falla, el estado ya cambió en BD — se reporta
 * el error al usuario para que pueda reintentar con la nota preservada.
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

  // ── 1. Actualizar estado en solicitudes ──────────────────────────────────
  const { error: updateError } = await supabase
    .from('solicitudes')
    .update({ estado: estadoNuevo })
    .eq('id', solicitudId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  // ── 2. Insertar en historial_estados ─────────────────────────────────────
  const { error: historialError } = await supabase
    .from('historial_estados')
    .insert({
      solicitud_id: solicitudId,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
      cambiado_por: tecnicoId,
      nota: nota.trim() || null,
    })

  if (historialError) {
    // El estado ya cambió; informamos al usuario pero no revertimos
    // porque el estado es correcto — solo faltó el historial.
    return {
      ok: false,
      error: `Estado actualizado, pero no se pudo registrar en el historial: ${historialError.message}`,
    }
  }

  // ── 3. Audit log (fire-and-forget) ───────────────────────────────────────
  // HU-MANT-04 SPRINT-4 — cualquier cambio de estado registra en audit_log
  await supabase.from('audit_log').insert({
    usuario_id: tecnicoId,
    accion: 'actualizar_estado_solicitud',
    entidad: 'solicitudes',
    entidad_id: solicitudId,
    resultado: JSON.stringify({ estado_anterior: estadoAnterior, estado_nuevo: estadoNuevo }),
  })

  return { ok: true }
}
