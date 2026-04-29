import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'
import type { FiltrosState } from '../components/admin/FiltrosUsuarios'

const QUERY_TIMEOUT_MS = 8000
const USUARIOS_COLUMNS = 'id, email, nombre, apellido, telefono, rol, piso, departamento, estado_cuenta, empresa_tercero, created_at, updated_at'

export function useUsuarios(filtros: FiltrosState) {
  const { rol, estado } = filtros
  const [usuarios, setUsuarios] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // El controller activo se guarda en una ref para que `refetch` pueda cancelar
  // un fetch en vuelo del useEffect (o uno previo de refetch) antes de iniciar
  // el nuevo. Sin esto, dos fetchs concurrentes con resultados distintos podían
  // dejar datos stale (el más lento ganaba).
  const controllerRef = useRef<AbortController | null>(null)

  const fetchUsuarios = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('usuarios')
        .select(USUARIOS_COLUMNS)
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal)

      if (rol) query = query.eq('rol', rol)
      if (estado) query = query.eq('estado_cuenta', estado)

      const { data, error: fetchError } = await query

      if (controller.signal.aborted) return

      if (fetchError) setError(fetchError.message)
      else setUsuarios((data ?? []) as Profile[])
    } catch (err) {
      if (!controller.signal.aborted) {
        setError((err as Error).message || 'Error al cargar usuarios')
      }
    } finally {
      clearTimeout(timeoutId)
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setLoading(false)
      }
    }
  }, [rol, estado])

  useEffect(() => {
    fetchUsuarios()
    return () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [fetchUsuarios])

  return { usuarios, loading, error, refetch: fetchUsuarios }
}
