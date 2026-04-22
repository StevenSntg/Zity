import { useState } from 'react'
import { useInvitacion } from '../../hooks/useInvitacion'
import type { Rol } from '../../types/database'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errores = Partial<Record<'email' | 'nombre' | 'rol', string>>

type Props = {
  onEnviado: (email: string) => void
  onCerrar: () => void
}

export default function ModalInvitacion({ onEnviado, onCerrar }: Props) {
  const { enviarInvitacion, cargando, error: hookError } = useInvitacion()

  const [form, setForm] = useState({
    email: '',
    nombre: '',
    rol: 'residente' as Rol,
    piso: '',
    departamento: '',
    empresa_tercero: '',
  })
  const [errores, setErrores] = useState<Errores>({})

  function validar(): Errores {
    const e: Errores = {}
    if (!form.email) e.email = 'El email es requerido'
    else if (!EMAIL_REGEX.test(form.email)) e.email = 'El email es inválido'
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validar()
    if (Object.keys(errs).length > 0) {
      setErrores(errs)
      return
    }
    setErrores({})

    const ok = await enviarInvitacion({
      email: form.email,
      rol: form.rol,
      nombre: form.nombre,
      piso: form.piso,
      departamento: form.departamento,
      empresa_tercero: form.rol === 'tecnico' ? form.empresa_tercero : undefined,
    })

    if (ok) onEnviado(form.email)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg font-semibold text-primary-900">Invitar usuario</h3>
          <button onClick={onCerrar} className="text-warm-400 hover:text-primary-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {hookError && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {hookError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inv-email" className="block text-sm font-medium text-primary-800 mb-1.5">
              Email <span className="text-error">*</span>
            </label>
            <input
              id="inv-email"
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
              className={`input-field ${errores.email ? 'error' : ''}`}
              aria-label="email"
            />
            {errores.email && (
              <p className="mt-1 text-xs text-error">{errores.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="inv-nombre" className="block text-sm font-medium text-primary-800 mb-1.5">
              Nombre <span className="text-error">*</span>
            </label>
            <input
              id="inv-nombre"
              type="text"
              value={form.nombre}
              onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Laura"
              className={`input-field ${errores.nombre ? 'error' : ''}`}
              aria-label="nombre"
            />
            {errores.nombre && (
              <p className="mt-1 text-xs text-error">{errores.nombre}</p>
            )}
          </div>

          <div>
            <label htmlFor="inv-rol" className="block text-sm font-medium text-primary-800 mb-1.5">
              Rol <span className="text-error">*</span>
            </label>
            <select
              id="inv-rol"
              value={form.rol}
              onChange={e => setForm(prev => ({ ...prev, rol: e.target.value as Rol }))}
              className="input-field"
              aria-label="rol"
            >
              <option value="residente">Residente</option>
              <option value="tecnico">Técnico</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {form.rol === 'tecnico' && (
            <div>
              <label htmlFor="inv-empresa" className="block text-sm font-medium text-primary-800 mb-1.5">
                Empresa tercero
              </label>
              <input
                id="inv-empresa"
                type="text"
                value={form.empresa_tercero}
                onChange={e => setForm(prev => ({ ...prev, empresa_tercero: e.target.value }))}
                placeholder="TecnoEdif SAC"
                className="input-field"
                aria-label="empresa"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="inv-piso" className="block text-sm font-medium text-primary-800 mb-1.5">
                Piso
              </label>
              <input
                id="inv-piso"
                type="text"
                value={form.piso}
                onChange={e => setForm(prev => ({ ...prev, piso: e.target.value }))}
                placeholder="4"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="inv-depto" className="block text-sm font-medium text-primary-800 mb-1.5">
                Departamento
              </label>
              <input
                id="inv-depto"
                type="text"
                value={form.departamento}
                onChange={e => setForm(prev => ({ ...prev, departamento: e.target.value }))}
                placeholder="4B"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary w-auto! px-5 text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={cargando} className="btn-primary text-sm">
              {cargando ? <span className="spinner" /> : 'Enviar invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
