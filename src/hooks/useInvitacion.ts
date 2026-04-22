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

async function extractErrorMessage(
  data: { error?: string; success?: boolean } | null,
  fnError: Error | null,
  fallback: string,
): Promise<string> {
  let mensaje = data?.error ?? fnError?.message ?? fallback
  const response = (fnError as { context?: Response } | null)?.context
  if (response && typeof response.json === 'function') {
    try {
      const body = await response.json()
      if (body?.error) mensaje = body.error
    } catch {
      // ignore
    }
  }
  return mensaje
}

export function useInvitacion() {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviarInvitacion(payload: InvitacionPayload): Promise<boolean> {
    setCargando(true)
    setError(null)

    const { data, error: fnError } = await supabase.functions.invoke('invitaciones', {
      body: { ...payload, accion: 'crear' },
    })

    setCargando(false)

    if (fnError || !data?.success) {
      setError(await extractErrorMessage(data, fnError, 'Error al enviar invitación'))
      return false
    }

    return true
  }

  async function reenviarInvitacion(email: string): Promise<{ ok: boolean; error?: string }> {
    const { data, error: fnError } = await supabase.functions.invoke('invitaciones', {
      body: { accion: 'reenviar', email },
    })

    if (fnError || !data?.success) {
      return {
        ok: false,
        error: await extractErrorMessage(data, fnError, 'Error al reenviar invitación'),
      }
    }

    return { ok: true }
  }

  return { enviarInvitacion, reenviarInvitacion, cargando, error }
}
