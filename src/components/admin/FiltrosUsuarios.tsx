import type { Rol, EstadoCuenta } from '../../types/database'

export type FiltrosState = {
  rol: Rol | ''
  estado: EstadoCuenta | ''
}

type Props = {
  filtros: FiltrosState
  onChange: (filtros: FiltrosState) => void
}

export default function FiltrosUsuarios({ filtros, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <div>
        <label htmlFor="filtro-rol" className="sr-only">Filtrar por rol</label>
        <select
          id="filtro-rol"
          value={filtros.rol}
          onChange={e => onChange({ ...filtros, rol: e.target.value as Rol | '' })}
          className="input-field py-2 pr-8 text-sm"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="residente">Residente</option>
          <option value="tecnico">Técnico</option>
        </select>
      </div>

      <div>
        <label htmlFor="filtro-estado" className="sr-only">Filtrar por estado</label>
        <select
          id="filtro-estado"
          value={filtros.estado}
          onChange={e => onChange({ ...filtros, estado: e.target.value as EstadoCuenta | '' })}
          className="input-field py-2 pr-8 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="pendiente">Pendiente</option>
          <option value="bloqueado">Bloqueado</option>
        </select>
      </div>

      {(filtros.rol || filtros.estado) && (
        <button
          onClick={() => onChange({ rol: '', estado: '' })}
          className="text-sm text-warm-400 hover:text-error transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
