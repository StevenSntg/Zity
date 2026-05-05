// HU-MANT-07 SPRINT-4
// Lógica de confirmación/rechazo de solicitudes resueltas por el residente.
// Flujo confirmar: UPDATE estado='cerrada' + confirmada_por_residente=true + historial + audit_log
// Flujo rechazar: UPDATE estado='en_progreso' + intentos_resolucion+=1 + historial + audit_log
//   Si intentos_resolucion >= 3 tras el rechazo: UPDATE estado='pendiente' (escalada)

import { supabase } from '../lib/supabase'

// HU-MANT-07 SPRINT-4 — Umbral de escalada al admin
export const MAX_INTENTOS_RESOLUCION = 3
export const NOTA_RECHAZO_MIN = 20
export const NOTA_RECHAZO_MAX = 500

export type ResultadoConfirmacion = {
  ok: boolean
  escalada?: boolean   // true si intentos >= MAX tras rechazar
  error?: string
}

// ─── Confirmar solución ──────────────────────────────────────────────────────

/**
 * HU-MANT-07 SPRINT-4
 * El residente confirma que la solicitud fue resuelta correctamente.
 * Transición: resuelta → cerrada, confirmada_por_residente = true
 */
export async function confirmarSolicitud(
  solicitudId: string,
  residenteId: string,
): Promise<ResultadoConfirmacion> {
  // 1. Actualizar estado
  const { error: updateError } = await supabase
    .from('solicitudes')
    .update({
      estado: 'cerrada',
      confirmada_por_residente: true,
    })
    .eq('id', solicitudId)
    .eq('residente_id', residenteId) // doble check con RLS

  if (updateError) return { ok: false, error: updateError.message }

  // 2. Historial
  const { error: histError } = await supabase
    .from('historial_estados')
    .insert({
      solicitud_id: solicitudId,
      estado_anterior: 'resuelta',
      estado_nuevo: 'cerrada',
      cambiado_por: residenteId,
      nota: 'Residente confirmó la solución.',
    })

  if (histError) {
    return {
      ok: false,
      error: `Estado actualizado, pero no se pudo registrar historial: ${histError.message}`,
    }
  }

  // 3. Audit log (fire-and-forget)
  await supabase.from('audit_log').insert({
    usuario_id: residenteId,
    accion: 'confirmar_solicitud',
    entidad: 'solicitudes',
    entidad_id: solicitudId,
    resultado: JSON.stringify({ estado_nuevo: 'cerrada' }),
  })

  return { ok: true }
}

// ─── Rechazar solución ───────────────────────────────────────────────────────

/**
 * HU-MANT-07 SPRINT-4
 * El residente rechaza la solución del técnico.
 * - Valida nota mínima de 20 chars
 * - Incrementa intentos_resolucion
 * - Si >= MAX_INTENTOS_RESOLUCION → estado='pendiente' (escalada al admin)
 * - Si < MAX → estado='en_progreso'
 */
export async function rechazarSolicitud(
  solicitudId: string,
  residenteId: string,
  nota: string,
  intentosActuales: number,
): Promise<ResultadoConfirmacion> {
  const notaTrim = nota.trim()

  // Validación cliente
  if (notaTrim.length < NOTA_RECHAZO_MIN) {
    return {
      ok: false,
      error: `La nota de rechazo debe tener al menos ${NOTA_RECHAZO_MIN} caracteres.`,
    }
  }
  if (notaTrim.length > NOTA_RECHAZO_MAX) {
    return {
      ok: false,
      error: `La nota de rechazo no puede superar ${NOTA_RECHAZO_MAX} caracteres.`,
    }
  }

  const nuevosIntentos = intentosActuales + 1
  // HU-MANT-07 SPRINT-4 — Escalada si >= MAX_INTENTOS_RESOLUCION
  const escalada = nuevosIntentos >= MAX_INTENTOS_RESOLUCION
  const estadoNuevo = escalada ? 'pendiente' : 'en_progreso'

  // 1. Actualizar estado e intentos
  const { error: updateError } = await supabase
    .from('solicitudes')
    .update({
      estado: estadoNuevo,
      intentos_resolucion: nuevosIntentos,
    })
    .eq('id', solicitudId)
    .eq('residente_id', residenteId)

  if (updateError) return { ok: false, error: updateError.message }

  // 2. Historial con nota de rechazo
  const { error: histError } = await supabase
    .from('historial_estados')
    .insert({
      solicitud_id: solicitudId,
      estado_anterior: 'resuelta',
      estado_nuevo: estadoNuevo,
      cambiado_por: residenteId,
      nota: escalada
        ? `[ESCALADA] Rechazo #${nuevosIntentos}: ${notaTrim}`
        : `Rechazo #${nuevosIntentos}: ${notaTrim}`,
    })

  if (histError) {
    return {
      ok: false,
      error: `Estado actualizado, pero no se pudo registrar historial: ${histError.message}`,
    }
  }

  // 3. Audit log (fire-and-forget)
  await supabase.from('audit_log').insert({
    usuario_id: residenteId,
    accion: escalada ? 'escalada_solicitud' : 'rechazar_solucion',
    entidad: 'solicitudes',
    entidad_id: solicitudId,
    resultado: JSON.stringify({ intentos: nuevosIntentos, escalada, estado_nuevo: estadoNuevo }),
  })

  return { ok: true, escalada }
}

// ─── Hook de solicitudes pendientes de confirmación ─────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Solicitud } from '../types/database'

const COLS = `
  id, codigo, residente_id, tipo, categoria, descripcion,
  estado, prioridad, imagen_url, piso, departamento,
  confirmada_por_residente, intentos_resolucion, created_at, updated_at
`

/**
 * HU-MANT-07 SPRINT-4
 * Carga las solicitudes del residente en estado 'resuelta' con
 * confirmada_por_residente = false (pendientes de su confirmación).
 * Si las columnas aún no existen en Supabase (migración pendiente),
 * devuelve array vacío sin mostrar error al usuario.
 */
export function useSolicitudesPendientesConfirmacion(residenteId: string | undefined) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const fetch = useCallback(async () => {
    if (!residenteId) {
      setSolicitudes([])
      setLoading(false)
      return
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('solicitudes')
        .select(COLS)
        .eq('residente_id', residenteId)
        .eq('estado', 'resuelta')
        .eq('confirmada_por_residente', false)
        .order('updated_at', { ascending: false })
        .abortSignal(controller.signal)

      if (controller.signal.aborted) return

      // HU-MANT-07 SPRINT-4 — Si la columna no existe aún (migración pendiente),
      // devolvemos array vacío silenciosamente en lugar de mostrar error al usuario.
      if (fetchError) {
        const esMigracionPendiente =
          fetchError.message.includes('confirmada_por_residente') ||
          fetchError.message.includes('intentos_resolucion') ||
          fetchError.message.includes('does not exist')
        if (!esMigracionPendiente) setError(fetchError.message)
        setSolicitudes([])
        return
      }

      setSolicitudes((data ?? []) as Solicitud[])
    } catch (err) {
      if (!controller.signal.aborted) {
        setError((err as Error).message || 'Error al cargar solicitudes')
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setLoading(false)
      }
    }
  }, [residenteId])

  useEffect(() => {
    fetch()
    return () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [fetch])

  return { solicitudes, loading, error, refetch: fetch }
}
