import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useUsuarios } from '../../hooks/useUsuarios'
import FiltrosUsuarios, { type FiltrosState } from '../../components/admin/FiltrosUsuarios'
import TablaUsuarios from '../../components/admin/TablaUsuarios'
import ModalConfirmacion from '../../components/admin/ModalConfirmacion'
import ModalInvitacion from '../../components/admin/ModalInvitacion'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'
import zityLogo from '../../assets/zity_logo.png'

export default function AdminUsuarios() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [filtros, setFiltros] = useState<FiltrosState>({ rol: '', estado: '' })
  const { usuarios, loading, error, refetch } = useUsuarios(filtros)

  const [usuarioAccion, setUsuarioAccion] = useState<Profile | null>(null)
  const [tipoAccion, setTipoAccion] = useState<'bloquear' | 'desbloquear' | null>(null)
  const [cargandoAccion, setCargandoAccion] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const [mostrarInvitacion, setMostrarInvitacion] = useState(false)
  const [confirmacionInvitacion, setConfirmacionInvitacion] = useState<string | null>(null)

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  function abrirModalBloquear(usuario: Profile) {
    setUsuarioAccion(usuario)
    setTipoAccion('bloquear')
    setErrorAccion(null)
  }

  function abrirModalDesbloquear(usuario: Profile) {
    setUsuarioAccion(usuario)
    setTipoAccion('desbloquear')
    setErrorAccion(null)
  }

  async function confirmarAccion() {
    if (!usuarioAccion || !tipoAccion) return
    setCargandoAccion(true)
    setErrorAccion(null)

    const { data, error: fnError } = await supabase.functions.invoke('bloquear-cuenta', {
      body: { usuario_id: usuarioAccion.id, accion: tipoAccion },
    })

    setCargandoAccion(false)

    if (fnError || !data?.success) {
      setErrorAccion(fnError?.message ?? data?.error ?? 'Error al realizar la acción')
      return
    }

    setUsuarioAccion(null)
    setTipoAccion(null)
    refetch()
  }

  function handleInvitacionEnviada(email: string) {
    setMostrarInvitacion(false)
    setConfirmacionInvitacion(email)
    setTimeout(() => setConfirmacionInvitacion(null), 5000)
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="bg-white border-b border-warm-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={zityLogo} alt="Zity" className="h-9 w-auto" />
            <span className="text-xs font-semibold bg-primary-600 text-white px-2.5 py-1 rounded-full tracking-wider uppercase">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-warm-400 hover:text-primary-700 transition-colors">
              Dashboard
            </Link>
            <span className="text-sm text-primary-700">{profile?.nombre} {profile?.apellido}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-warm-400 hover:text-error transition-colors font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h2 className="font-display text-2xl font-semibold text-primary-900">
              Gestión de usuarios
            </h2>
            <p className="mt-1 text-warm-400 text-sm">
              {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} encontrado{usuarios.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setMostrarInvitacion(true)}
            className="btn-primary w-auto!"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Invitar usuario
          </button>
        </div>

        {confirmacionInvitacion && (
          <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg text-success text-sm animate-scale-in flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Invitación enviada a {confirmacionInvitacion}
          </div>
        )}

        {(error || errorAccion) && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {error ?? errorAccion}
          </div>
        )}

        <div className="mb-6 animate-fade-in delay-1">
          <FiltrosUsuarios filtros={filtros} onChange={setFiltros} />
        </div>

        <div className="bg-white rounded-xl border border-warm-200 animate-fade-in delay-2">
          <TablaUsuarios
            usuarios={usuarios}
            loading={loading}
            onBloquear={abrirModalBloquear}
            onDesbloquear={abrirModalDesbloquear}
          />
        </div>
      </main>

      {tipoAccion && usuarioAccion && (
        <ModalConfirmacion
          titulo={tipoAccion === 'bloquear' ? 'Bloquear cuenta' : 'Desbloquear cuenta'}
          mensaje={
            tipoAccion === 'bloquear'
              ? `¿Estás seguro de bloquear la cuenta de ${usuarioAccion.nombre} ${usuarioAccion.apellido}? El usuario no podrá iniciar sesión.`
              : `¿Desbloquear la cuenta de ${usuarioAccion.nombre} ${usuarioAccion.apellido}? El usuario podrá volver a iniciar sesión.`
          }
          labelConfirmar={tipoAccion === 'bloquear' ? 'Bloquear' : 'Desbloquear'}
          variante={tipoAccion === 'bloquear' ? 'peligro' : 'primario'}
          cargando={cargandoAccion}
          onConfirmar={confirmarAccion}
          onCancelar={() => {
            setUsuarioAccion(null)
            setTipoAccion(null)
          }}
        />
      )}

      {mostrarInvitacion && (
        <ModalInvitacion
          onEnviado={handleInvitacionEnviada}
          onCerrar={() => setMostrarInvitacion(false)}
        />
      )}
    </div>
  )
}
