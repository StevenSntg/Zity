// HU-MANT-07 SPRINT-4 (+ Sprint 5 · PBI-S4-E04: foto opcional)
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
import UploadFoto from '../UploadFoto'
import Portal from '../../Portal'

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
  // HU-MANT-07 SPRINT-4 (+ Sprint 5 · PBI-S4-E04 foto opcional)
  const { user } = useAuth()
  const [nota, setNota] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
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

    // Sprint 5 · PBI-S4-E04 — foto opcional, viaja al hook si está presente.
    const resultado = await rechazarSolicitud(
      solicitudId,
      user.id,
      nota,
      intentosActuales,
      foto,
    )
    setGuardando(false)

    if (!resultado.ok) {
      setError(resultado.error ?? 'Error al registrar rechazo.')
      return
    }
    onRechazado(resultado.escalada ?? false)
  }

  return (
    // Portal: saca el modal del stacking context del padre (las secciones con
    // .animate-fade-in dejan un `transform: translateY(0)` aplicado y crean
    // un nuevo contexto que atrapa al modal). En document.body el modal
    // compite con todos los stacking contexts del mismo nivel.
    <Portal>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop a pantalla completa */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={guardando ? undefined : onCerrar}
      />

      {/* Panel: flex column con altura máxima y scroll interno. El footer con
          los botones queda siempre visible aunque la foto adjunta sea grande. */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-scale-in">

        {/* ── Header (sticky) ───────────────────────────────────────────── */}
        <div className="shrink-0 px-6 pt-5 pb-3 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-error/10 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-primary-900">
            ¿Por qué rechazas la solución?
          </h2>
          <p className="text-xs text-warm-400 mt-1">
            Tu nota ayudará al técnico a entender qué falta corregir.
          </p>
        </div>

        {/* ── Body (scrollable) ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {/* Aviso de escalada si ya va al tercer intento */}
          {seraEscalada && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-warning/10 border border-warning/30 text-xs text-amber-800 flex items-start gap-2">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>
                Este es el intento <strong>#{proximosIntentos}</strong>. Si rechazas, la solicitud será escalada al administrador.
              </span>
            </div>
          )}

          {/* Textarea nota */}
          <div>
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

          {/* Sprint 5 · PBI-S4-E04 — Foto opcional del problema persistente */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-primary-900 mb-1.5">
              Foto del problema persistente
              <span className="ml-1 font-normal text-warm-400">(opcional)</span>
            </label>
            <UploadFoto archivo={foto} onCambio={setFoto} disabled={guardando} />
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}
        </div>

        {/* ── Footer (sticky) ───────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-warm-200 bg-warm-50/40 px-6 py-4">
          <div className="flex gap-3">
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
          <p className="mt-2.5 text-[0.6875rem] text-warm-400 text-center">
            {tecnicoNombre
              ? `${tecnicoNombre} será notificado/a para revisar nuevamente.`
              : 'El técnico asignado será notificado para revisar nuevamente.'}
            {' '}<span className="italic">(Notificaciones en Sprint 6)</span>
          </p>
        </div>
      </div>
    </div>
    </Portal>
  )
}
