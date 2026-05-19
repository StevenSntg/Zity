// Sprint 5 · PBI-S2-E03 · Página de perfil editable.
// Accesible para los tres roles activos (residente, tecnico, admin). Permite
// editar nombre, apellido y teléfono. Los demás campos son de solo lectura
// porque están bajo control del admin o no son configurables por el usuario
// (email, rol, estado_cuenta, empresa_tercero, piso, departamento).

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_ROUTES } from '../lib/routing'
import zityLogo from '../assets/zity_logo.png'
import type { Rol } from '../types/database'

const NOMBRE_MIN = 2
const NOMBRE_MAX = 80
const TELEFONO_MAX = 20

const ROL_LABEL: Record<Rol, string> = {
  residente: 'Residente',
  tecnico: 'Técnico',
  admin: 'Administrador',
}

const ROL_BADGE_CLS: Record<Rol, string> = {
  residente: 'bg-accent-500',
  tecnico: 'bg-success',
  admin: 'bg-primary-600',
}

export default function Perfil() {
  const { profile, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()

  // Valores iniciales tomados del profile actual. Si el profile aún no cargó
  // (caso improbable porque ProtectedRoute exige profile), mostramos spinner.
  const [nombre, setNombre] = useState(profile?.nombre ?? '')
  const [apellido, setApellido] = useState(profile?.apellido ?? '')
  const [telefono, setTelefono] = useState(profile?.telefono ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Sprint 5 · PBI-S2-E03 — sólo habilitamos el botón si hay cambios y son válidos.
  const cambios = useMemo(() => {
    if (!profile) return null
    const nombreTrim = nombre.trim()
    const apellidoTrim = apellido.trim()
    const telefonoTrim = telefono.trim()

    const hayCambios =
      nombreTrim !== (profile.nombre ?? '').trim() ||
      apellidoTrim !== (profile.apellido ?? '').trim() ||
      telefonoTrim !== (profile.telefono ?? '').trim()

    const validos =
      nombreTrim.length >= NOMBRE_MIN &&
      nombreTrim.length <= NOMBRE_MAX &&
      apellidoTrim.length >= NOMBRE_MIN &&
      apellidoTrim.length <= NOMBRE_MAX &&
      telefonoTrim.length <= TELEFONO_MAX

    return { hayCambios, validos, nombreTrim, apellidoTrim, telefonoTrim }
  }, [nombre, apellido, telefono, profile])

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  const rolLabel = ROL_LABEL[profile.rol]
  const rolBadge = ROL_BADGE_CLS[profile.rol]
  const volverHref = ROLE_ROUTES[profile.rol]

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !cambios || !cambios.hayCambios || !cambios.validos) return

    setGuardando(true)
    setError(null)
    setToast(null)

    // RLS asegura que sólo se puede UPDATE el propio perfil (usuarios.id = auth.uid()).
    // No hace falta validarlo de nuevo en el cliente, pero filtramos por seguridad
    // por si la policy se relajara más adelante.
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        nombre: cambios.nombreTrim,
        apellido: cambios.apellidoTrim,
        telefono: cambios.telefonoTrim || null,
      })
      .eq('id', profile.id)

    if (updateError) {
      setError(updateError.message)
      setGuardando(false)
      return
    }

    // Refrescar el profile en el AuthContext para que el resto de la app vea
    // los nuevos valores (sidebar, headers, etc.).
    await refreshProfile()

    setGuardando(false)
    setToast('Datos actualizados correctamente.')
    // Limpiar el toast tras 3s
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header simple (la página es minimalista, accesible desde cualquier rol). */}
      <header className="bg-white border-b border-warm-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={zityLogo} alt="Zity" className="h-8 w-auto shrink-0" />
            <span
              className={`text-[0.65rem] font-semibold ${rolBadge} text-white px-2 py-0.5 rounded-full tracking-wider uppercase shrink-0`}
            >
              {rolLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate(volverHref)}
              className="text-sm text-primary-700 hover:text-primary-900 font-medium cursor-pointer hidden sm:inline"
            >
              ← Volver al panel
            </button>
            <button
              onClick={handleSignOut}
              className="text-sm text-warm-400 hover:text-error transition-colors font-medium whitespace-nowrap cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="animate-fade-in mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-primary-900 tracking-tight">
            Mi perfil
          </h1>
          <p className="mt-1 text-sm text-warm-400">
            Actualiza tu información personal. Los datos administrativos los gestiona el administrador.
          </p>
        </div>

        <form
          onSubmit={handleGuardar}
          className="bg-white rounded-2xl shadow-sm border border-warm-200 p-5 sm:p-6 animate-fade-in delay-1"
        >
          {/* Sección editable */}
          <fieldset disabled={guardando} className="space-y-4">
            <legend className="text-xs uppercase tracking-wider text-warm-400 font-medium mb-2">
              Datos personales
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-primary-900 mb-1.5">
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  maxLength={NOMBRE_MAX}
                  required
                  className="w-full h-11 px-3 rounded-lg border border-warm-300 text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-primary-900 mb-1.5">
                  Apellido
                </label>
                <input
                  id="apellido"
                  type="text"
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  maxLength={NOMBRE_MAX}
                  required
                  className="w-full h-11 px-3 rounded-lg border border-warm-300 text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-primary-900 mb-1.5">
                Teléfono
                <span className="ml-1 font-normal text-warm-400">(opcional)</span>
              </label>
              <input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                maxLength={TELEFONO_MAX}
                placeholder="+51 999 999 999"
                className="w-full h-11 px-3 rounded-lg border border-warm-300 text-sm text-primary-900 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"
              />
            </div>
          </fieldset>

          {/* Sección de solo lectura */}
          <fieldset className="mt-6 pt-5 border-t border-warm-200 space-y-3">
            <legend className="text-xs uppercase tracking-wider text-warm-400 font-medium mb-2">
              Datos administrativos (solo lectura)
            </legend>

            <ReadonlyRow label="Email" value={profile.email} />
            <ReadonlyRow label="Rol" value={rolLabel} />
            {profile.empresa_tercero && (
              <ReadonlyRow label="Empresa" value={profile.empresa_tercero} />
            )}
            {(profile.piso || profile.departamento) && (
              <ReadonlyRow
                label="Ubicación"
                value={`Piso ${profile.piso || '—'} · Depto. ${profile.departamento || '—'}`}
              />
            )}
            <ReadonlyRow
              label="Estado de cuenta"
              value={
                profile.estado_cuenta === 'activo'
                  ? 'Activa'
                  : profile.estado_cuenta === 'pendiente'
                    ? 'Pendiente de activación'
                    : 'Bloqueada'
              }
            />
          </fieldset>

          {error && (
            <div className="mt-5 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(volverHref)}
              disabled={guardando}
              className="h-11 px-5 rounded-lg border border-warm-300 text-primary-700 text-sm font-medium hover:bg-warm-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !cambios?.hayCambios || !cambios?.validos}
              className="h-11 px-6 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {guardando && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Guardar cambios
            </button>
          </div>
        </form>

        {toast && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-success text-white px-5 py-3 rounded-full shadow-lg text-sm font-medium animate-fade-in"
            role="status"
          >
            ✓ {toast}
          </div>
        )}
      </main>
    </div>
  )
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-1">
      <span className="text-xs sm:text-sm text-warm-400">{label}</span>
      <span className="text-sm font-medium text-primary-900 sm:text-right truncate">{value}</span>
    </div>
  )
}
