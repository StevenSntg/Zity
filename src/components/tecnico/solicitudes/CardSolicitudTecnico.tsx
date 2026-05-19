// HU-MANT-03 SPRINT-4
// Card de solicitud para la vista del técnico.
// Muestra: ID, tipo, categoría, prioridad (badge color), unidad (piso+depto),
// descripción truncada (primeros 80 chars), miniatura de foto y fecha de
// asignación. Responsiva: ocupa todo el ancho en mobile, es fila en desktop.

import type { SolicitudAsignadaTecnico } from '../../../hooks/useSolicitudesTecnico'
import { labelCategoria, labelTipo } from '../../../lib/solicitudes'
import { tiempoTranscurrido } from '../../../lib/format'

// ─── Badges inline ───────────────────────────────────────────────────────────

function BadgePrioridad({ prioridad }: { prioridad: string }) {
  // HU-MANT-03 SPRINT-4 — Color badge según prioridad
  const esUrgente = prioridad === 'urgente'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold ${
        esUrgente
          ? 'bg-error/10 text-error border border-error/20'
          : 'bg-primary-50 text-primary-600 border border-primary-200'
      }`}
    >
      {esUrgente && (
        <span className="w-1.5 h-1.5 rounded-full bg-error inline-block" />
      )}
      {esUrgente ? 'Urgente' : 'Normal'}
    </span>
  )
}

function BadgeEstado({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    asignada: 'bg-accent-100 text-accent-700 border-accent-200',
    en_progreso: 'bg-primary-100 text-primary-700 border-primary-200',
    resuelta: 'bg-success/10 text-success border-success/20',
  }
  const labels: Record<string, string> = {
    asignada: 'Asignada',
    en_progreso: 'En progreso',
    resuelta: 'Resuelta',
  }
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold border capitalize ${
        map[estado] ?? 'bg-warm-100 text-warm-400 border-warm-200'
      }`}
    >
      {labels[estado] ?? estado}
    </span>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

type Props = {
  solicitud: SolicitudAsignadaTecnico
  fotoUrl: string | undefined
  onClick: () => void
}

const DESC_MAX = 80

export default function CardSolicitudTecnico({ solicitud, fotoUrl, onClick }: Props) {
  const unidad =
    solicitud.piso && solicitud.departamento
      ? `Piso ${solicitud.piso} — ${solicitud.departamento}`
      : solicitud.residente?.piso && solicitud.residente?.departamento
      ? `Piso ${solicitud.residente.piso} — ${solicitud.residente.departamento}`
      : null

  const descripcionCorta =
    solicitud.descripcion.length > DESC_MAX
      ? `${solicitud.descripcion.slice(0, DESC_MAX).trimEnd()}…`
      : solicitud.descripcion

  return (
    <button
      type="button"
      onClick={onClick}
      id={`card-solicitud-${solicitud.id}`}
      className="w-full text-left bg-white border border-warm-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer group animate-fade-in"
    >
      <div className="flex items-start gap-4">
        {/* Miniatura de foto */}
        {/* HU-MANT-03 SPRINT-4 — Miniatura de foto de la solicitud */}
        <div className="shrink-0">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt=""
              loading="lazy"
              className="w-16 h-16 rounded-lg object-cover border border-warm-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-warm-100 border border-warm-200 flex items-center justify-center text-warm-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          {/* Fila superior: código + badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-[0.6875rem] text-warm-400">{solicitud.codigo}</span>
            <BadgeEstado estado={solicitud.estado} />
            <BadgePrioridad prioridad={solicitud.prioridad} />
          </div>

          {/* Tipo y categoría */}
          <p className="font-medium text-primary-900 text-sm leading-snug">
            {labelTipo(solicitud.tipo as never)} · {labelCategoria(solicitud.categoria as never)}
          </p>

          {/* Unidad */}
          {unidad && (
            <p className="text-xs text-warm-400 mt-0.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {unidad}
            </p>
          )}

          {/* Descripción truncada */}
          <p className="text-xs text-primary-700 mt-1.5 leading-relaxed">
            {descripcionCorta}
          </p>

          {/* Fecha de asignación */}
          <p className="text-[0.6875rem] text-warm-400 mt-2">
            Asignada {solicitud.fecha_asignacion
              ? tiempoTranscurrido(solicitud.fecha_asignacion)
              : tiempoTranscurrido(solicitud.created_at)}
          </p>
        </div>

        {/* Chevron */}
        <svg
          className="w-4 h-4 text-warm-300 group-hover:text-primary-400 transition-colors shrink-0 mt-1"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
