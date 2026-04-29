import type { Profile } from '../../types/database'
import { iniciales, tiempoTranscurrido } from '../../lib/format'
import BadgeEstado from './BadgeEstado'

type Props = {
  usuarios: Profile[]
  loading: boolean
  currentUserId?: string
  reenviandoEmail?: string | null
  onBloquear: (usuario: Profile) => void
  onDesbloquear: (usuario: Profile) => void
  onActivar: (usuario: Profile) => void
  onReenviar: (usuario: Profile) => void
}

type AccionesProps = {
  usuario: Profile
  currentUserId?: string
  reenviandoEmail?: string | null
  onBloquear: (u: Profile) => void
  onDesbloquear: (u: Profile) => void
  onActivar: (u: Profile) => void
  onReenviar: (u: Profile) => void
}

function AccionesUsuario({ usuario, currentUserId, reenviandoEmail, onBloquear, onDesbloquear, onActivar, onReenviar }: AccionesProps) {
  const esPropio = usuario.id === currentUserId
  return (
    <div className="flex items-center gap-3">
      {usuario.estado_cuenta === 'pendiente' && (
        <>
          <button
            onClick={() => onActivar(usuario)}
            className="text-xs sm:text-sm text-success hover:text-success/80 font-medium transition-colors cursor-pointer py-1"
          >
            Activar
          </button>
          <button
            onClick={() => onReenviar(usuario)}
            disabled={reenviandoEmail === usuario.email}
            className="text-xs sm:text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer py-1"
          >
            {reenviandoEmail === usuario.email ? 'Reenviando…' : 'Reenviar'}
          </button>
        </>
      )}
      {usuario.estado_cuenta === 'bloqueado' ? (
        <button
          onClick={() => onDesbloquear(usuario)}
          className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer py-1"
        >
          Desbloquear
        </button>
      ) : (
        !esPropio && (
          <button
            onClick={() => onBloquear(usuario)}
            className="text-xs sm:text-sm text-error hover:text-error/80 font-medium transition-colors cursor-pointer py-1"
          >
            Bloquear
          </button>
        )
      )}
    </div>
  )
}

export default function TablaUsuarios({
  usuarios,
  loading,
  currentUserId,
  reenviandoEmail,
  onBloquear,
  onDesbloquear,
  onActivar,
  onReenviar,
}: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-16" data-testid="loading-spinner">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (usuarios.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-14 h-14 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-primary-800 font-medium">Sin resultados</p>
        <p className="text-sm text-warm-400 mt-1">No se encontraron usuarios con los filtros seleccionados.</p>
      </div>
    )
  }

  return (
    <>
      {/* ============== Mobile cards (<md) ============== */}
      <ul className="md:hidden divide-y divide-warm-100">
        {usuarios.map(usuario => (
          <li key={usuario.id} className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {iniciales(usuario.nombre, usuario.apellido)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-primary-900 truncate">
                  {usuario.nombre} {usuario.apellido}
                </p>
                <p className="text-xs text-warm-400 truncate">{usuario.email}</p>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <BadgeEstado estado={usuario.estado_cuenta} />
                  <span className="text-xs text-warm-400 capitalize">{usuario.rol}</span>
                  {usuario.piso && usuario.departamento && (
                    <span className="text-xs text-warm-400">· {usuario.piso}-{usuario.departamento}</span>
                  )}
                </div>
                {usuario.rol === 'tecnico' && usuario.empresa_tercero && (
                  <p className="mt-1 text-xs text-warm-400">{usuario.empresa_tercero}</p>
                )}
                <p className="mt-1.5 text-[0.6875rem] text-warm-400">
                  Registro {tiempoTranscurrido(usuario.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-warm-100 pt-3">
              <AccionesUsuario
                usuario={usuario}
                currentUserId={currentUserId}
                reenviandoEmail={reenviandoEmail}
                onBloquear={onBloquear}
                onDesbloquear={onDesbloquear}
                onActivar={onActivar}
                onReenviar={onReenviar}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* ============== Desktop table (md+) ============== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm-200 bg-warm-50/60">
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">Usuario</th>
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">Rol</th>
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">Piso / Depto</th>
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">Estado</th>
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">Registro</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {usuarios.map(usuario => (
              <tr key={usuario.id} className="hover:bg-warm-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                      {iniciales(usuario.nombre, usuario.apellido)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-primary-900 truncate">
                        {usuario.nombre} {usuario.apellido}
                      </p>
                      <p className="text-xs text-warm-400 truncate">{usuario.email}</p>
                    </div>
                  </div>
                </td>
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
                  <div className="flex items-center justify-end">
                    <AccionesUsuario
                      usuario={usuario}
                      currentUserId={currentUserId}
                      reenviandoEmail={reenviandoEmail}
                      onBloquear={onBloquear}
                      onDesbloquear={onDesbloquear}
                      onActivar={onActivar}
                      onReenviar={onReenviar}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
