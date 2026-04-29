import type { EstadoSolicitud, TipoSolicitud } from '../../../types/database'
import { TIPOS_SOLICITUD } from '../../../lib/solicitudes'
import type { FiltrosAdmin } from '../../../hooks/useSolicitudesAdmin'

type Props = {
  filtros: FiltrosAdmin
  onChange: (filtros: FiltrosAdmin) => void
}

const ESTADO_OPTIONS: { value: EstadoSolicitud | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'asignada', label: 'Asignada' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'resuelta', label: 'Resuelta' },
  { value: 'cerrada', label: 'Cerrada' },
]

const TIPO_OPTIONS: { value: TipoSolicitud | ''; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  ...TIPOS_SOLICITUD,
]

function IconoEstado() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function IconoTipo() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function IconoChevron() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

type SelectFiltroProps<T extends string> = {
  id: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  icono: React.ReactNode
  ariaLabel: string
}

function SelectFiltro<T extends string>({ id, value, onChange, options, icono, ariaLabel }: SelectFiltroProps<T>) {
  const activo = value !== ''
  return (
    <div className="relative w-full sm:w-auto">
      <span
        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${activo ? 'text-primary-600' : 'text-warm-400'}`}
        aria-hidden="true"
      >
        {icono}
      </span>
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className={`appearance-none w-full sm:w-auto sm:min-w-[12rem] pl-10 pr-9 py-2.5 min-h-11 text-sm font-medium rounded-lg bg-white border-[1.5px] transition-all cursor-pointer outline-none focus:ring-[3px] focus:ring-primary-500/12 ${
          activo
            ? 'border-primary-500 text-primary-700'
            : 'border-warm-200 text-warm-400 hover:border-primary-300 hover:text-primary-700'
        }`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="text-primary-900">
            {opt.label}
          </option>
        ))}
      </select>
      <span
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${activo ? 'text-primary-600' : 'text-warm-400'}`}
        aria-hidden="true"
      >
        <IconoChevron />
      </span>
    </div>
  )
}

export default function FiltrosSolicitudes({ filtros, onChange }: Props) {
  const hayFiltros = filtros.estado !== '' || filtros.tipo !== ''

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
      <div className="grid grid-cols-1 sm:flex sm:items-center gap-2.5 sm:gap-3 sm:flex-wrap">
        <SelectFiltro
          id="filtro-sol-estado"
          value={filtros.estado}
          onChange={v => onChange({ ...filtros, estado: v as EstadoSolicitud | '' })}
          options={ESTADO_OPTIONS}
          icono={<IconoEstado />}
          ariaLabel="Filtrar por estado"
        />
        <SelectFiltro
          id="filtro-sol-tipo"
          value={filtros.tipo}
          onChange={v => onChange({ ...filtros, tipo: v as TipoSolicitud | '' })}
          options={TIPO_OPTIONS}
          icono={<IconoTipo />}
          ariaLabel="Filtrar por tipo"
        />
      </div>

      {hayFiltros && (
        <button
          onClick={() => onChange({ estado: '', tipo: '' })}
          className="text-sm text-warm-400 hover:text-error transition-colors cursor-pointer min-h-11 self-start sm:self-auto px-2 -ml-2 sm:ml-0 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
