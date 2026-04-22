import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'
import type { FiltrosState } from '../components/admin/FiltrosUsuarios'

const QUERY_TIMEOUT_MS = 8000

async function fetchUsuariosQuery(filtros: FiltrosState, signal: AbortSignal) {
  let query = supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false })
    .abortSignal(signal)

  if (filtros.rol) query = query.eq('rol', filtros.rol)
  if (filtros.estado) query = query.eq('estado_cuenta', filtros.estado)

  return query
}

export function useUsuarios(filtros: FiltrosState) {
  const { rol, estado } = filtros
  const [usuarios, setUsuarios] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const signal = AbortSignal.timeout(QUERY_TIMEOUT_MS)
      const { data, error: fetchError } = await fetchUsuariosQuery({ rol, estado }, signal)

      if (fetchError) setError(fetchError.message)
      else setUsuarios((data ?? []) as Profile[])
    } catch (err) {
      setError((err as Error).message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [rol, estado])

  useEffect(() => {
    let cancelado = false
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)

    ;(async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await fetchUsuariosQuery({ rol, estado }, controller.signal)
        if (cancelado) return

        if (fetchError) setError(fetchError.message)
        else setUsuarios((data ?? []) as Profile[])
      } catch (err) {
        if (!cancelado) setError((err as Error).message || 'Error al cargar usuarios')
      } finally {
        if (!cancelado) setLoading(false)
      }
    })()

    return () => {
      cancelado = true
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [rol, estado])

  return { usuarios, loading, error, refetch: fetchUsuarios }
}
