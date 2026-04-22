import { useState } from 'react'
import { supabase } from '../lib/supabase'

export type InvitacionPayload = {
  email: string
  rol: 'residente' | 'tecnico' | 'admin'
  nombre: string
  piso: string
  departamento: string
  empresa_tercero?: string
}

export function useInvitacion() {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviarInvitacion(payload: InvitacionPayload): Promise<boolean> {
    setCargando(true)
    setError(null)

    const { data, error: fnError } = await supabase.functions.invoke('invitaciones', {
      body: payload,
    })

    setCargando(false)

    if (fnError || !data?.success) {
      setError(fnError?.message ?? data?.error ?? 'Error al enviar invitación')
      return false
    }

    return true
  }

  return { enviarInvitacion, cargando, error }
}
