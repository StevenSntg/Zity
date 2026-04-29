import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useUsuarios } from '../../hooks/useUsuarios'
import { useInvitacion } from '../../hooks/useInvitacion'
import FiltrosUsuarios, { type FiltrosState } from '../../components/admin/FiltrosUsuarios'
import TablaUsuarios from '../../components/admin/TablaUsuarios'
import ModalConfirmacion from '../../components/admin/ModalConfirmacion'
import ModalInvitacion from '../../components/admin/ModalInvitacion'
import AdminShell from '../../components/admin/AdminShell'
import { supabase } from '../../lib/supabase'
import { extractEdgeFunctionError } from '../../lib/errors'
import type { Profile } from '../../types/database'

export default function AdminUsuarios() {
  const { user } = useAuth()
  const { reenviarInvitacion } = useInvitacion()

  const [filtros, setFiltros] = useState<FiltrosState>({ rol: '', estado: '' })
  const { usuarios, loading, error, refetch } = useUsuarios(filtros)

  const [usuarioAccion, setUsuarioAccion] = useState<Profile | null>(null)
  const [tipoAccion, setTipoAccion] = useState<'bloquear' | 'desbloquear' | null>(null)
  const [cargandoAccion, setCargandoAccion] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const [mostrarInvitacion, setMostrarInvitacion] = useState(false)
  const [confirmacionInvitacion, setConfirmacionInvitacion] = useState<string | null>(null)
  const [reenviandoEmail, setReenviandoEmail] = useState<string | null>(null)
  const [mensajeReenvio, setMensajeReenvio] = useState<string | null>(null)

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
    // Cerramos el modal pase lo que pase para que el error (si lo hubo) sea
    // visible en el banner principal de la página.
    setUsuarioAccion(null)
    setTipoAccion(null)

    if (fnError || !data?.success) {
      setErrorAccion(await extractEdgeFunctionError(data, fnError, 'Error al realizar la acción'))
      return
    }

    refetch()
  }

  function handleInvitacionEnviada(email: string) {
    setMostrarInvitacion(false)
    setConfirmacionInvitacion(email)
    setTimeout(() => setConfirmacionInvitacion(null), 5000)
  }

  async function handleReenviar(usuario: Profile) {
    setReenviandoEmail(usuario.email)
    setErrorAccion(null)
    const { ok, error: reenvioError } = await reenviarInvitacion(usuario.email)
    setReenviandoEmail(null)

    if (!ok) {
      setErrorAccion(reenvioError ?? 'Error al reenviar invitación')
      return
    }

    setMensajeReenvio(`Invitación reenviada a ${usuario.email}`)
    setTimeout(() => setMensajeReenvio(null), 5000)
    refetch()
  }

  const accionesHeader = (
    <button
      onClick={() => setMostrarInvitacion(true)}
      className="btn-primary w-full sm:w-auto! px-5 cursor-pointer"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span>Invitar usuario</span>
    </button>
  )

  return (
    <AdminShell
      title="Gestión de usuarios"
      subtitle={`${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''} encontrado${usuarios.length !== 1 ? 's' : ''}`}
      actions={accionesHeader}
    >
      {confirmacionInvitacion && (
        <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg text-success text-sm animate-scale-in flex items-start gap-2">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Invitación enviada a <strong className="font-semibold">{confirmacionInvitacion}</strong></span>
        </div>
      )}

      {mensajeReenvio && (
        <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg text-success text-sm animate-scale-in flex items-start gap-2">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{mensajeReenvio}</span>
        </div>
      )}

      {(error || errorAccion) && (
        <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm flex items-start gap-2">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error ?? errorAccion}</span>
        </div>
      )}

      <div className="mb-4 sm:mb-6 animate-fade-in delay-1">
        <FiltrosUsuarios filtros={filtros} onChange={setFiltros} />
      </div>

      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden animate-fade-in delay-2">
        <TablaUsuarios
          usuarios={usuarios}
          loading={loading}
          currentUserId={user?.id}
          reenviandoEmail={reenviandoEmail}
          onBloquear={abrirModalBloquear}
          onDesbloquear={abrirModalDesbloquear}
          onReenviar={handleReenviar}
        />
      </div>

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
    </AdminShell>
  )
}
