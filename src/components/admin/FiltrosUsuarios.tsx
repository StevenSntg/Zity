import type { Rol, EstadoCuenta } from '../../types/database'

export type FiltrosState = {
  rol: Rol | ''
  estado: EstadoCuenta | ''
}

type Props = {
  filtros: FiltrosState
  onChange: (filtros: FiltrosState) => void
}

const ROL_OPTIONS: { value: Rol | ''; label: string }[] = [
  { value: '', label: 'Todos los roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'residente', label: 'Residente' },
  { value: 'tecnico', label: 'Técnico' },
]

const ESTADO_OPTIONS: { value: EstadoCuenta | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'activo', label: 'Activo' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'bloqueado', label: 'Bloqueado' },
]

function IconoUsuarios() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function IconoBadge() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

function SelectFiltro<T extends string>({
  id,
  value,
  onChange,
  options,
  icono,
  ariaLabel,
}: SelectFiltroProps<T>) {
  const activo = value !== ''
  return (
    <div className="relative w-full sm:w-auto">
      <span
        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
          activo ? 'text-primary-600' : 'text-warm-400'
        }`}
        aria-hidden="true"
      >
        {icono}
      </span>
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className={`appearance-none w-full sm:w-auto sm:min-w-[11rem] pl-10 pr-9 py-2.5 min-h-11 text-sm font-medium rounded-lg bg-white border-[1.5px] transition-all cursor-pointer outline-none focus:ring-[3px] focus:ring-primary-500/12 ${
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
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
          activo ? 'text-primary-600' : 'text-warm-400'
        }`}
        aria-hidden="true"
      >
        <IconoChevron />
      </span>
    </div>
  )
}

export default function FiltrosUsuarios({ filtros, onChange }: Props) {
  const hayFiltros = filtros.rol !== '' || filtros.estado !== ''

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
      <div className="grid grid-cols-1 sm:flex sm:items-center gap-2.5 sm:gap-3 sm:flex-wrap">
        <SelectFiltro
          id="filtro-rol"
          value={filtros.rol}
          onChange={v => onChange({ ...filtros, rol: v as Rol | '' })}
          options={ROL_OPTIONS}
          icono={<IconoUsuarios />}
          ariaLabel="Filtrar por rol"
        />
        <SelectFiltro
          id="filtro-estado"
          value={filtros.estado}
          onChange={v => onChange({ ...filtros, estado: v as EstadoCuenta | '' })}
          options={ESTADO_OPTIONS}
          icono={<IconoBadge />}
          ariaLabel="Filtrar por estado"
        />
      </div>

      {hayFiltros && (
        <button
          onClick={() => onChange({ rol: '', estado: '' })}
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
