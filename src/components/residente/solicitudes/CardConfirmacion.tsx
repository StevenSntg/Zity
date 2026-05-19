// HU-MANT-07 SPRINT-4
// Card de solicitud pendiente de confirmación por el residente.
// Muestra: badge "PENDIENTE TU CONFIRMACIÓN" (o "ESCALADA AL ADMIN"),
// ID, tipo, foto, fecha resolución, nota del técnico, botones Confirmar/Rechazar.

import { useState } from 'react'
import { labelCategoria, labelTipo } from '../../../lib/solicitudes'
import { tiempoTranscurrido } from '../../../lib/format'
import ModalConfirmarSolucion from './ModalConfirmarSolucion'
import ModalRechazarSolucion from './ModalRechazarSolucion'
import type { Solicitud } from '../../../types/database'
import { MAX_INTENTOS_RESOLUCION } from '../../../hooks/useConfirmarSolicitud'

type Props = {
  solicitud: Solicitud
  fotoUrl: string | undefined
  notaTecnico: string | null    // nota del último cambio a 'resuelta' (del historial)
  tecnicoNombre?: string
  onActualizada: () => void
}

export default function CardConfirmacion({
  solicitud,
  fotoUrl,
  notaTecnico,
  tecnicoNombre,
  onActualizada,
}: Props) {
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [modalRechazar, setModalRechazar] = useState(false)
  // HU-MANT-07 SPRINT-4 — Estado local post-acción para feedback inmediato
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const esEscalada = (solicitud.intentos_resolucion ?? 0) >= MAX_INTENTOS_RESOLUCION

  function handleConfirmado() {
    setModalConfirmar(false)
    setMensajeExito('✅ Solicitud cerrada. ¡Gracias por tu confirmación!')
    setTimeout(onActualizada, 1800)
  }

  function handleRechazado(escalada: boolean) {
    setModalRechazar(false)
    // HU-MANT-07 SPRINT-4 — Mensaje post-rechazo según si hubo escalada
    setMensajeExito(
      escalada
        ? '⚠️ Tu rechazo fue registrado. La solicitud fue escalada al administrador.'
        : `Tu rechazo fue registrado. ${tecnicoNombre ?? 'El técnico'} será notificado y volverá a revisar.`,
    )
    setTimeout(onActualizada, 2500)
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden hover:shadow-md transition-shadow animate-fade-in">

        {/* Badge de estado */}
        {/* HU-MANT-07 SPRINT-4 — Badge rojo pendiente / naranja escalada */}
        <div className={`px-4 py-2 flex items-center gap-2 ${esEscalada ? 'bg-warning/10' : 'bg-error/10'}`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${esEscalada ? 'bg-warning' : 'bg-error'}`} />
          <span className={`text-[0.6875rem] font-bold tracking-wider uppercase ${esEscalada ? 'text-amber-700' : 'text-error'}`}>
            {esEscalada ? 'Escalada al admin' : 'Pendiente tu confirmación'}
          </span>
          <span className="ml-auto font-mono text-[0.6875rem] text-warm-400">{solicitud.codigo}</span>
        </div>

        <div className="flex gap-4 p-4">
          {/* Miniatura */}
          {solicitud.imagen_url && (
            <div className="shrink-0">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt=""
                  loading="lazy"
                  className="w-20 h-20 rounded-lg object-cover border border-warm-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-warm-100 border border-warm-200 flex items-center justify-center text-warm-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-primary-900 text-sm">
              {labelTipo(solicitud.tipo)} · {labelCategoria(solicitud.categoria)}
            </p>
            <p className="text-xs text-warm-400 mt-0.5">
              Resuelta {tiempoTranscurrido(solicitud.updated_at)}
            </p>

            {/* Nota del técnico */}
            {/* HU-MANT-07 SPRINT-4 — Nota del técnico visible para el residente */}
            {notaTecnico && (
              <div className="mt-2 bg-primary-50 border border-primary-100 rounded-md px-2.5 py-2">
                <p className="text-[0.6875rem] text-primary-500 font-medium mb-0.5 uppercase tracking-wider">
                  Nota del técnico
                </p>
                <p className="text-xs text-primary-800 leading-relaxed">{notaTecnico}</p>
              </div>
            )}

            {/* Contador de intentos */}
            {(solicitud.intentos_resolucion ?? 0) > 0 && (
              <p className="text-[0.6875rem] text-warm-400 mt-1.5">
                Intento #{(solicitud.intentos_resolucion ?? 0) + 1}
              </p>
            )}
          </div>
        </div>

        {/* Mensaje de éxito post-acción */}
        {mensajeExito ? (
          <div className="px-4 pb-4">
            <p className="text-sm text-center text-primary-700 py-2 px-3 bg-warm-50 rounded-lg border border-warm-200">
              {mensajeExito}
            </p>
          </div>
        ) : (
          /* Botones confirmar / rechazar */
          /* HU-MANT-07 SPRINT-4 — Dos botones de acción del residente */
          <div className="px-4 pb-4 flex gap-2">
            <button
              id={`btn-rechazar-${solicitud.id}`}
              type="button"
              onClick={() => setModalRechazar(true)}
              className="flex-1 py-2 rounded-lg border border-error/30 text-error text-sm font-medium hover:bg-error/5 transition-colors cursor-pointer"
            >
              Rechazar
            </button>
            <button
              id={`btn-confirmar-${solicitud.id}`}
              type="button"
              onClick={() => setModalConfirmar(true)}
              className="flex-1 py-2 rounded-lg bg-success text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Confirmar solución ✓
            </button>
          </div>
        )}
      </div>

      {modalConfirmar && (
        <ModalConfirmarSolucion
          solicitudId={solicitud.id}
          onConfirmado={handleConfirmado}
          onCerrar={() => setModalConfirmar(false)}
        />
      )}
      {modalRechazar && (
        <ModalRechazarSolucion
          solicitudId={solicitud.id}
          intentosActuales={solicitud.intentos_resolucion ?? 0}
          tecnicoNombre={tecnicoNombre}
          onRechazado={handleRechazado}
          onCerrar={() => setModalRechazar(false)}
        />
      )}
    </>
  )
}
