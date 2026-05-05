// HU-MANT-07 SPRINT-4
// Modal de rechazo: textarea obligatoria (mín. 20 chars), maneja escalada.
// Muestra mensaje diferenciado si intentos_resolucion >= MAX tras enviar.

import { useState } from 'react'
import { useModalBehavior } from '../../../hooks/useModalBehavior'
import {
  rechazarSolicitud,
  NOTA_RECHAZO_MIN,
  NOTA_RECHAZO_MAX,
  MAX_INTENTOS_RESOLUCION,
} from '../../../hooks/useConfirmarSolicitud'
import { useAuth } from '../../../contexts/AuthContext'

type Props = {
  solicitudId: string
  intentosActuales: number
  tecnicoNombre?: string   // para el mensaje post-rechazo
  onRechazado: (escalada: boolean) => void
  onCerrar: () => void
}

export default function ModalRechazarSolucion({
  solicitudId,
  intentosActuales,
  tecnicoNombre,
  onRechazado,
  onCerrar,
}: Props) {
  // HU-MANT-07 SPRINT-4
  const { user } = useAuth()
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useModalBehavior(onCerrar, true)

  const notaTrim = nota.trim()
  const botonDeshabilitado = guardando || notaTrim.length < NOTA_RECHAZO_MIN
  const proximosIntentos = intentosActuales + 1
  const seraEscalada = proximosIntentos >= MAX_INTENTOS_RESOLUCION

  async function handleRechazar() {
    if (!user || botonDeshabilitado) return
    setGuardando(true)
    setError(null)

    const resultado = await rechazarSolicitud(solicitudId, user.id, nota, intentosActuales)
    setGuardando(false)

    if (!resultado.ok) {
      setError(resultado.error ?? 'Error al registrar rechazo.')
      return
    }
    onRechazado(resultado.escalada ?? false)
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onCerrar} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">

        {/* Icono */}
        <div className="w-14 h-14 mx-auto rounded-full bg-error/10 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h2 className="font-display text-xl font-semibold text-primary-900 text-center">
          ¿Por qué rechazas la solución?
        </h2>

        {/* Aviso de escalada si ya va al tercer intento */}
        {seraEscalada && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-warning/10 border border-warning/30 text-xs text-amber-800 text-center">
            ⚠️ Este es el intento #{proximosIntentos}. Si rechazas, la solicitud será escalada al administrador.
          </div>
        )}

        {/* Textarea nota */}
        <div className="mt-4">
          <label htmlFor="nota-rechazo" className="block text-sm font-medium text-primary-900 mb-1.5">
            Describe el problema que persiste
            <span className="ml-1 text-error text-xs">* obligatorio (mín. {NOTA_RECHAZO_MIN} caracteres)</span>
          </label>
          <textarea
            id="nota-rechazo"
            value={nota}
            onChange={e => { if (e.target.value.length <= NOTA_RECHAZO_MAX) setNota(e.target.value) }}
            disabled={guardando}
            rows={4}
            placeholder="Explica qué sigue sin funcionar o qué no se resolvió correctamente…"
            className="w-full px-3 py-2 rounded-lg border border-warm-300 text-sm text-primary-900 placeholder:text-warm-300 resize-none focus:outline-none focus:ring-2 focus:ring-error/40 disabled:opacity-50"
          />
          <div className="flex items-center justify-between mt-1">
            {notaTrim.length > 0 && notaTrim.length < NOTA_RECHAZO_MIN ? (
              <p className="text-xs text-error">Faltan {NOTA_RECHAZO_MIN - notaTrim.length} caracteres</p>
            ) : <span />}
            <p className={`text-xs ml-auto ${nota.length >= NOTA_RECHAZO_MAX ? 'text-error' : 'text-warm-400'}`}>
              {nota.length}/{NOTA_RECHAZO_MAX}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="flex-1 py-2.5 rounded-lg border border-warm-300 text-primary-700 text-sm font-medium hover:bg-warm-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            id="btn-enviar-rechazo"
            type="button"
            onClick={handleRechazar}
            disabled={botonDeshabilitado}
            className="flex-1 py-2.5 rounded-lg bg-error text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {guardando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Enviar rechazo
          </button>
        </div>

        <p className="mt-3 text-[0.6875rem] text-warm-400 text-center">
          {tecnicoNombre
            ? `${tecnicoNombre} será notificado/a para revisar nuevamente.`
            : 'El técnico asignado será notificado para revisar nuevamente.'}
          {' '}(Notificaciones en Sprint 6)
        </p>
      </div>
    </div>
  )
}
