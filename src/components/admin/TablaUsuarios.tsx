import type { Profile } from '../../types/database'
import BadgeEstado from './BadgeEstado'

type Props = {
  usuarios: Profile[]
  loading: boolean
  onBloquear: (usuario: Profile) => void
  onDesbloquear: (usuario: Profile) => void
}

function tiempoTranscurrido(fechaISO: string): string {
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

export default function TablaUsuarios({ usuarios, loading, onBloquear, onDesbloquear }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-12" data-testid="loading-spinner">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12 text-warm-400">
        No se encontraron usuarios con los filtros seleccionados.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-warm-200">
            <th className="text-left py-3 px-4 font-medium text-warm-400">Nombre</th>
            <th className="text-left py-3 px-4 font-medium text-warm-400">Email</th>
            <th className="text-left py-3 px-4 font-medium text-warm-400">Rol</th>
            <th className="text-left py-3 px-4 font-medium text-warm-400">Piso / Depto</th>
            <th className="text-left py-3 px-4 font-medium text-warm-400">Estado</th>
            <th className="text-left py-3 px-4 font-medium text-warm-400">Registro</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-warm-100">
          {usuarios.map(usuario => (
            <tr key={usuario.id} className="hover:bg-warm-50 transition-colors">
              <td className="py-3 px-4 font-medium text-primary-900">
                {usuario.nombre} {usuario.apellido}
              </td>
              <td className="py-3 px-4 text-warm-400">{usuario.email}</td>
              <td className="py-3 px-4">
                <span className="capitalize text-primary-700">{usuario.rol}</span>
                {usuario.rol === 'tecnico' && usuario.empresa_tercero && (
                  <span className="block text-xs text-warm-400 mt-0.5">{usuario.empresa_tercero}</span>
                )}
              </td>
              <td className="py-3 px-4 text-warm-400">
                {usuario.piso && usuario.departamento
                  ? `Piso ${usuario.piso} — ${usuario.departamento}`
                  : '—'}
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col gap-1">
                  <BadgeEstado estado={usuario.estado_cuenta} />
                  {usuario.estado_cuenta === 'pendiente' && (
                    <span className="text-xs text-warm-400">
                      {tiempoTranscurrido(usuario.created_at)}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-warm-400">
                {tiempoTranscurrido(usuario.created_at)}
              </td>
              <td className="py-3 px-4 text-right">
                {usuario.estado_cuenta === 'bloqueado' ? (
                  <button
                    onClick={() => onDesbloquear(usuario)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Desbloquear
                  </button>
                ) : (
                  <button
                    onClick={() => onBloquear(usuario)}
                    className="text-xs text-error hover:text-error/80 font-medium transition-colors"
                  >
                    Bloquear
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
