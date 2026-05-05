// HU-MANT-07 SPRINT-4
// Modal de confirmación simple: "¿Estás seguro? Esta acción cierra la solicitud."
// Dos botones: Cancelar y Confirmar (con spinner).

import { useState } from 'react'
import { useModalBehavior } from '../../../hooks/useModalBehavior'
import { confirmarSolicitud } from '../../../hooks/useConfirmarSolicitud'
import { useAuth } from '../../../contexts/AuthContext'

type Props = {
  solicitudId: string
  onConfirmado: () => void
  onCerrar: () => void
}

export default function ModalConfirmarSolucion({ solicitudId, onConfirmado, onCerrar }: Props) {
  // HU-MANT-07 SPRINT-4
  const { user } = useAuth()
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useModalBehavior(onCerrar, true)

  async function handleConfirmar() {
    if (!user || guardando) return
    setGuardando(true)
    setError(null)

    const resultado = await confirmarSolicitud(solicitudId, user.id)
    setGuardando(false)

    if (!resultado.ok) {
      setError(resultado.error ?? 'Error al confirmar.')
      return
    }
    onConfirmado()
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onCerrar} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">

        {/* Icono */}
        <div className="w-14 h-14 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="font-display text-xl font-semibold text-primary-900 text-center">
          ¿Confirmar solución?
        </h2>
        <p className="text-sm text-warm-400 text-center mt-2">
          Esta acción cierra la solicitud definitivamente. El técnico recibirá la confirmación de tu aprobación.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="flex-1 py-2.5 rounded-lg border border-warm-300 text-primary-700 text-sm font-medium hover:bg-warm-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            id="btn-confirmar-solucion"
            type="button"
            onClick={handleConfirmar}
            disabled={guardando}
            className="flex-1 py-2.5 rounded-lg bg-success text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {guardando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Sí, confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
