import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type {
  EstadoSolicitud,
  HistorialEstado,
  Solicitud,
  TipoSolicitud,
} from '../types/database'

const QUERY_TIMEOUT_MS = 8000

const SOLICITUDES_ADMIN_SELECT = `
  id, codigo, residente_id, unidad_id, tipo, categoria, descripcion,
  estado, prioridad, imagen_url, piso, departamento, created_at, updated_at,
  residente:usuarios!solicitudes_residente_id_fkey (
    id, nombre, apellido, email, telefono, piso, departamento
  )
`

export type ResidenteResumen = {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  piso: string | null
  departamento: string | null
}

export type SolicitudConResidente = Solicitud & {
  residente: ResidenteResumen | null
}

export type FiltrosAdmin = {
  estado: EstadoSolicitud | ''
  tipo: TipoSolicitud | ''
}

// Hook que usa el panel admin: trae solicitudes con datos del residente
// embebidos vía la FK existente (`solicitudes_residente_id_fkey`). PostgREST
// resuelve el embed en una sola query — más barato que listar usuarios aparte.
export function useSolicitudesAdmin(filtros: FiltrosAdmin) {
  const { estado, tipo } = filtros
  const [solicitudes, setSolicitudes] = useState<SolicitudConResidente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const controllerRef = useRef<AbortController | null>(null)

  const fetchSolicitudes = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('solicitudes')
        .select(SOLICITUDES_ADMIN_SELECT)
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal)

      if (estado) query = query.eq('estado', estado)
      if (tipo) query = query.eq('tipo', tipo)

      const { data, error: fetchError } = await query

      if (controller.signal.aborted) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        // PostgREST puede devolver `residente` como objeto o como array según
        // detecte la cardinalidad del embed; normalizamos a objeto único.
        const normalizadas: SolicitudConResidente[] = (data ?? []).map(row => {
          const r = (row as { residente: unknown }).residente
          const residente = Array.isArray(r) ? (r[0] as ResidenteResumen | undefined) : (r as ResidenteResumen | null)
          return {
            ...(row as unknown as Solicitud),
            residente: residente ?? null,
          }
        })
        setSolicitudes(normalizadas)
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError((err as Error).message || 'Error al cargar solicitudes')
      }
    } finally {
      clearTimeout(timeoutId)
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setLoading(false)
      }
    }
  }, [estado, tipo])

  useEffect(() => {
    fetchSolicitudes()
    return () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [fetchSolicitudes])

  return { solicitudes, loading, error, refetch: fetchSolicitudes }
}

// Historial de estados de una solicitud, para el panel lateral. Se carga sólo
// cuando el admin abre el detalle (lazy via useEffect dentro del componente).
export function useHistorialSolicitud(solicitudId: string | null) {
  const [historial, setHistorial] = useState<HistorialEstado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const fetchHistorial = useCallback(async (id: string) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setHistorial([])
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('historial_estados')
        .select('id, solicitud_id, estado_anterior, estado_nuevo, cambiado_por, nota, created_at')
        .eq('solicitud_id', id)
        .order('created_at', { ascending: true })
        .abortSignal(controller.signal)

      if (controller.signal.aborted) return
      if (fetchError) setError(fetchError.message)
      else setHistorial((data ?? []) as HistorialEstado[])
    } catch (err) {
      if (!controller.signal.aborted) setError((err as Error).message)
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!solicitudId) return
    fetchHistorial(solicitudId)
    return () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [solicitudId, fetchHistorial])

  const refetch = useCallback(() => {
    if (solicitudId) fetchHistorial(solicitudId)
  }, [solicitudId, fetchHistorial])

  return { historial, loading, error, refetch }
}
