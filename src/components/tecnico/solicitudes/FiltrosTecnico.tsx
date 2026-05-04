// HU-MANT-03 SPRINT-4
// Filtros de la vista del técnico: estado (asignada/en_progreso/resuelta)
// y prioridad (normal/urgente). Los estados disponibles NO incluyen
// "pendiente" ni "cerrada" ya que el técnico solo ve sus asignadas.

import type { FiltrosTecnico } from '../../../hooks/useSolicitudesTecnico'
import type { EstadoSolicitud } from '../../../types/database'

type Props = {
  filtros: FiltrosTecnico
  onChange: (f: FiltrosTecnico) => void
  total: number
}

// HU-MANT-03 SPRINT-4 — Solo los estados relevantes para el técnico
const ESTADOS_TECNICO: Array<{ value: EstadoSolicitud | ''; label: string }> = [
  { value: '', label: 'Todos los estados' },
  { value: 'asignada', label: 'Asignada' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'resuelta', label: 'Resuelta' },
]

const PRIORIDADES: Array<{ value: 'normal' | 'urgente' | ''; label: string }> = [
  { value: '', label: 'Toda prioridad' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'normal', label: 'Normal' },
]

export default function FiltrosTecnico({ filtros, onChange, total }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 animate-fade-in">
      {/* Estado */}
      <select
        id="filtro-tecnico-estado"
        value={filtros.estado}
        onChange={e =>
          onChange({ ...filtros, estado: e.target.value as FiltrosTecnico['estado'] })
        }
        className="h-9 px-3 pr-8 rounded-lg border border-warm-200 text-sm text-primary-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
      >
        {ESTADOS_TECNICO.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Prioridad */}
      <select
        id="filtro-tecnico-prioridad"
        value={filtros.prioridad}
        onChange={e =>
          onChange({ ...filtros, prioridad: e.target.value as FiltrosTecnico['prioridad'] })
        }
        className="h-9 px-3 pr-8 rounded-lg border border-warm-200 text-sm text-primary-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
      >
        {PRIORIDADES.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <span className="ml-auto text-xs text-warm-400">
        {total} solicitud{total !== 1 ? 'es' : ''}
      </span>
    </div>
  )
}
