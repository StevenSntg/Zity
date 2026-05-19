import type { EstadoSolicitud } from '../../../types/database'

type EstadoConfig = {
  label: string
  className: string
}

const ESTADO_CONFIG: Record<EstadoSolicitud, EstadoConfig> = {
  pendiente: {
    label: 'Pendiente',
    className: 'bg-accent-100 text-accent-700 border-accent-300/60',
  },
  asignada: {
    label: 'Asignada',
    className: 'bg-primary-100 text-primary-700 border-primary-200',
  },
  en_progreso: {
    label: 'En progreso',
    className: 'bg-primary-50 text-primary-600 border-primary-200',
  },
  resuelta: {
    label: 'Resuelta',
    className: 'bg-[#4a7c59]/15 text-[#2d5f3f] border-[#4a7c59]/25',
  },
  cerrada: {
    label: 'Cerrada',
    className: 'bg-warm-100 text-warm-400 border-warm-200',
  },
}

export function BadgeEstadoSolicitud({ estado }: { estado: EstadoSolicitud }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.pendiente
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold border ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export function BadgePrioridad({ prioridad }: { prioridad: string }) {
  const esUrgente = prioridad === 'urgente'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold border ${
        esUrgente
          ? 'bg-error/12 text-[#9a3a24] border-error/30'
          : 'bg-warm-100 text-warm-400 border-warm-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${esUrgente ? 'bg-error' : 'bg-warm-400'}`} />
      <span className="capitalize">{prioridad}</span>
    </span>
  )
}
