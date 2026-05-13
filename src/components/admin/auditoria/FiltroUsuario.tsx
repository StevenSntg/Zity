// Sprint 5 · HU-AUDIT-01
// Filtro de usuario con autocomplete por email/nombre. Debounce de 300ms para
// no saturar la BD con un request por keystroke.

import { useState, useEffect, useRef } from 'react'
import { useUsuariosBusqueda } from '../../../hooks/useAuditLog'

const DEBOUNCE_MS = 300

type Props = {
  usuarioIdActual: string
  onSeleccion: (usuarioId: string) => void
}

export default function FiltroUsuario({ usuarioIdActual, onSeleccion }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [labelSeleccionado, setLabelSeleccionado] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Debounce sobre la búsqueda
  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [busqueda])

  const { resultados, loading } = useUsuariosBusqueda(busquedaDebounced, abierto)

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!abierto) return
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [abierto])

  function handleSeleccionar(id: string, label: string) {
    setLabelSeleccionado(label)
    setBusqueda('')
    setAbierto(false)
    onSeleccion(id)
  }

  function handleLimpiar() {
    setLabelSeleccionado(null)
    setBusqueda('')
    onSeleccion('')
  }

  // Si hay un usuario seleccionado, mostramos su label y un botón para limpiar.
  if (usuarioIdActual && labelSeleccionado) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-primary-300 bg-primary-50 text-sm">
        <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="flex-1 text-primary-900 truncate">{labelSeleccionado}</span>
        <button
          type="button"
          onClick={handleLimpiar}
          aria-label="Limpiar filtro de usuario"
          className="text-warm-400 hover:text-error transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  // Si hay un usuario_id en URL pero no label (link compartido), mostramos un
  // placeholder con el id raw + opción de limpiar.
  if (usuarioIdActual && !labelSeleccionado) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-primary-300 bg-primary-50 text-sm">
        <span className="flex-1 text-primary-900 font-mono text-xs truncate">{usuarioIdActual}</span>
        <button
          type="button"
          onClick={handleLimpiar}
          aria-label="Limpiar filtro de usuario"
          className="text-warm-400 hover:text-error transition-colors cursor-pointer text-xs"
        >
          Limpiar
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={busqueda}
        onChange={e => {
          setBusqueda(e.target.value)
          setAbierto(true)
        }}
        onFocus={() => setAbierto(true)}
        placeholder="Buscar por email, nombre o apellido…"
        className="w-full h-10 px-3 rounded-lg border border-warm-300 text-sm text-primary-900 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-primary-400"
      />

      {abierto && busqueda.trim().length >= 2 && (
        <div className="absolute z-20 top-full mt-1 inset-x-0 bg-white border border-warm-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-3 text-xs text-warm-400 flex items-center gap-2">
              <div className="w-3 h-3 border border-warm-300 border-t-primary-500 rounded-full animate-spin" />
              Buscando…
            </div>
          ) : resultados.length === 0 ? (
            <div className="px-3 py-3 text-xs text-warm-400">Sin coincidencias.</div>
          ) : (
            <ul>
              {resultados.map(u => {
                const label = `${u.nombre} ${u.apellido} · ${u.email}`
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => handleSeleccionar(u.id, label)}
                      className="w-full text-left px-3 py-2.5 hover:bg-warm-50 cursor-pointer border-b border-warm-100 last:border-b-0"
                    >
                      <p className="text-sm text-primary-900 truncate">
                        {u.nombre} {u.apellido}
                      </p>
                      <p className="text-[0.6875rem] text-warm-400 truncate">
                        {u.email} · <span className="capitalize">{u.rol}</span>
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {abierto && busqueda.trim().length > 0 && busqueda.trim().length < 2 && (
        <p className="absolute z-20 top-full mt-1 inset-x-0 bg-white border border-warm-200 rounded-lg shadow-lg px-3 py-2.5 text-xs text-warm-400">
          Escribe al menos 2 caracteres…
        </p>
      )}
    </div>
  )
}
