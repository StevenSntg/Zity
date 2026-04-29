// Devuelve las iniciales de un nombre+apellido para avatares de fallback.
// Si no hay datos, retorna el fallback (default '??').
export function iniciales(nombre?: string, apellido?: string, fallback = '??'): string {
  const n = (nombre ?? '').trim()[0] ?? ''
  const a = (apellido ?? '').trim()[0] ?? ''
  return (n + a).toUpperCase() || fallback
}

// "hace 3 días", "hace 2 horas", etc. Usado en listados de usuarios y solicitudes.
export function tiempoTranscurrido(fechaISO: string): string {
  try {
    const diffMs = Date.now() - new Date(fechaISO).getTime()
    const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
    const diffDays = Math.floor(diffMs / 86_400_000)
    const diffHours = Math.floor(diffMs / 3_600_000)
    const diffMinutes = Math.floor(diffMs / 60_000)
    if (diffDays >= 1) return rtf.format(-diffDays, 'day')
    if (diffHours >= 1) return rtf.format(-diffHours, 'hour')
    return rtf.format(-diffMinutes, 'minute')
  } catch {
    return 'hace un momento'
  }
}
