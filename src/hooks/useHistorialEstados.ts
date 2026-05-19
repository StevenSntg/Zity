// HU-MANT-05 SPRINT-4
// Hook para cargar el historial de estados de una solicitud con datos del autor.
// Soporta paginación (10 entradas iniciales, "Ver más" bajo demanda).
// Usa embed PostgREST para traer nombre, apellido y rol del autor via la FK
// `cambiado_por → usuarios.id`.

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Rol } from '../types/database'

// HU-MANT-05 SPRINT-4 — Tamaño de página para la paginación
const PAGE_SIZE = 10

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type AutorHistorial = {
  nombre: string
  apellido: string
  rol: Rol
} | null

export type EntradaHistorial = {
  id: string
  solicitud_id: string
  estado_anterior: string | null
  estado_nuevo: string
  cambiado_por: string | null
  nota: string | null
  created_at: string
  // HU-MANT-05 SPRINT-4 — Datos del autor embebidos
  autor: AutorHistorial
}

// ─── useHistorialEstados ────────────────────────────────────────────────────

/**
 * HU-MANT-05 SPRINT-4
 * Carga el historial de estados de una solicitud con datos del autor.
 * - Paginación: carga `PAGE_SIZE` entradas inicialmente, botón "Ver más"
 *   carga las siguientes concatenándolas.
 * - El embed `autor:usuarios!historial_estados_cambiado_por_fkey` trae
 *   nombre, apellido y rol; si la FK no existe en Supabase, `autor` será null.
 */
export function useHistorialEstados(solicitudId: string | null) {
  const [entradas, setEntradas] = useState<EntradaHistorial[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hayMas, setHayMas] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)

  // HU-MANT-05 SPRINT-4 — Fetch con offset para paginación
  const fetchPage = useCallback(
    async (id: string, offset: number, append: boolean) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      if (append) setLoadingMore(true)
      else {
        setLoading(true)
        setEntradas([])
      }
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('historial_estados')
          .select(`
            id, solicitud_id, estado_anterior, estado_nuevo,
            cambiado_por, nota, created_at,
            autor:usuarios!historial_estados_cambiado_por_fkey (
              nombre, apellido, rol
            )
          `)
          .eq('solicitud_id', id)
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)
          .abortSignal(controller.signal)

        if (controller.signal.aborted) return

        if (fetchError) {
          // HU-MANT-05 SPRINT-4 — Si el embed falla (FK no existe), fallback
          // sin autor. Reintenta sin el embed.
          if (fetchError.message.includes('relationship')) {
            const { data: fallback, error: fallbackError } = await supabase
              .from('historial_estados')
              .select('id, solicitud_id, estado_anterior, estado_nuevo, cambiado_por, nota, created_at')
              .eq('solicitud_id', id)
              .order('created_at', { ascending: false })
              .range(offset, offset + PAGE_SIZE - 1)
              .abortSignal(controller.signal)

            if (controller.signal.aborted) return
            if (fallbackError) {
              setError(fallbackError.message)
              return
            }

            const normalized = (fallback ?? []).map(row => ({
              ...row,
              autor: null,
            })) as EntradaHistorial[]

            if (append) setEntradas(prev => [...prev, ...normalized])
            else setEntradas(normalized)
            setHayMas(normalized.length === PAGE_SIZE)
            return
          }

          setError(fetchError.message)
          return
        }

        // Normalizar el embed de autor (PostgREST puede devolver array u objeto)
        const normalized: EntradaHistorial[] = (data ?? []).map(row => {
          const raw = row.autor as unknown
          const autor: AutorHistorial = Array.isArray(raw)
            ? (raw[0] as AutorHistorial) ?? null
            : (raw as AutorHistorial) ?? null
          return {
            id: row.id,
            solicitud_id: row.solicitud_id,
            estado_anterior: row.estado_anterior,
            estado_nuevo: row.estado_nuevo,
            cambiado_por: row.cambiado_por,
            nota: row.nota,
            created_at: row.created_at,
            autor,
          }
        })

        if (append) setEntradas(prev => [...prev, ...normalized])
        else setEntradas(normalized)
        setHayMas(normalized.length === PAGE_SIZE)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError((err as Error).message || 'Error al cargar historial')
        }
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [],
  )

  // Carga inicial al montar o cambiar solicitudId
  useEffect(() => {
    if (!solicitudId) return
    fetchPage(solicitudId, 0, false)
    return () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [solicitudId, fetchPage])

  // HU-MANT-05 SPRINT-4 — "Ver más" carga la siguiente página
  const cargarMas = useCallback(() => {
    if (solicitudId && hayMas && !loadingMore) {
      fetchPage(solicitudId, entradas.length, true)
    }
  }, [solicitudId, hayMas, loadingMore, entradas.length, fetchPage])

  const refetch = useCallback(() => {
    if (solicitudId) fetchPage(solicitudId, 0, false)
  }, [solicitudId, fetchPage])

  return { entradas, loading, loadingMore, error, hayMas, cargarMas, refetch }
}
