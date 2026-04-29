import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'
import type { FiltrosState } from '../components/admin/FiltrosUsuarios'

const QUERY_TIMEOUT_MS = 8000
const USUARIOS_COLUMNS = 'id, email, nombre, apellido, telefono, rol, piso, departamento, estado_cuenta, empresa_tercero, created_at, updated_at'

// Vista admin del usuario: incluye la fecha de la invitación que lo originó.
// Se calcula uniendo `invitaciones.email` con `usuarios.email`. Si el usuario
// se registró sin invitación previa (auto-registro), `fecha_invitacion` queda
// null y la UI cae al `created_at` para el "hace X días" del listado.
export type UsuarioConInvitacion = Profile & { fecha_invitacion: string | null }

export function useUsuarios(filtros: FiltrosState) {
  const { rol, estado } = filtros
  const [usuarios, setUsuarios] = useState<UsuarioConInvitacion[]>([])
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

      // Las dos queries van en paralelo; el JOIN se hace cliente-side por email
      // para no acoplar la policy de `usuarios` con `invitaciones` (que sólo
      // lee admin) ni introducir un endpoint nuevo.
      const [{ data, error: fetchError }, { data: invitacionesData }] = await Promise.all([
        query,
        supabase
          .from('invitaciones')
          .select('email, created_at')
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal),
      ])

      if (controller.signal.aborted) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        // Map por email a la invitación más reciente. Si un email se reinvitó,
        // ya quedó actualizado el `created_at` desde la edge function de
        // reenvío; tomamos esa única fila.
        const invitacionPorEmail = new Map<string, string>()
        for (const inv of invitacionesData ?? []) {
          if (inv.email && inv.created_at && !invitacionPorEmail.has(inv.email)) {
            invitacionPorEmail.set(inv.email, inv.created_at)
          }
        }

        const enriquecidos: UsuarioConInvitacion[] = (data ?? []).map(u => ({
          ...(u as Profile),
          fecha_invitacion: invitacionPorEmail.get((u as Profile).email) ?? null,
        }))
        setUsuarios(enriquecidos)
      }
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
