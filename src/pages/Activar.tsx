import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'
import PasswordInput from '../components/PasswordInput'
import FieldError from '../components/FieldError'
import { PASSWORD_REGEX } from '../lib/validators'

type EstadoInvite = 'verificando' | 'listo' | 'invalido'

const VERIFY_TIMEOUT_MS = 5000

// Detecta antes del primer render si el hash de la URL ya viene con error,
// para no entrar al estado 'verificando' inútilmente y evitar setState
// síncrono dentro de useEffect (regla react-hooks/set-state-in-effect).
function estadoInicialDesdeHash(): EstadoInvite {
  if (typeof window === 'undefined') return 'verificando'
  const hash = window.location.hash
  return hash.includes('error') || hash.includes('error_description')
    ? 'invalido'
    : 'verificando'
}

export default function Activar() {
  const navigate = useNavigate()

  const [estado, setEstado] = useState<EstadoInvite>(estadoInicialDesdeHash)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (estado === 'invalido') return

    let cancelado = false

    // Supabase procesa el token del invite y dispara INITIAL_SESSION/SIGNED_IN
    // automáticamente. Suscribirse al evento es instantáneo en cuanto el SDK
    // canjea el token; mucho más rápido que el polling activo de getSession.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelado) return
      if (session?.user) {
        setEmail(session.user.email ?? '')
        setEstado('listo')
      }
    })

    // Si el SDK no canjea el token en VERIFY_TIMEOUT_MS, asumimos link inválido.
    const timeout = setTimeout(() => {
      if (!cancelado) {
        setEstado(prev => (prev === 'verificando' ? 'invalido' : prev))
      }
    }, VERIFY_TIMEOUT_MS)

    return () => {
      cancelado = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [estado])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!PASSWORD_REGEX.test(password)) {
      setError('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    // updateUser puede quedar colgado en el cliente aunque el servidor ya aplicó
    // el cambio. Timeout de 4s + redirect — el usuario confirma con login.
    const TIMEOUT_MS = 4000
    const result = await Promise.race([
      supabase.auth.updateUser({ password }),
      new Promise<{ error: null }>(resolve =>
        setTimeout(() => resolve({ error: null }), TIMEOUT_MS),
      ),
    ])

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    // El usuario invitado ya fue pre-aprobado por el admin: marcamos la cuenta
    // como activa con la edge function (la RLS y el trigger guard impiden que
    // el propio usuario lo haga). Si esto falla, mostramos error pero seguimos
    // permitiendo que reintente desde login (la edge function es idempotente).
    const { error: aceptarError } = await supabase.functions.invoke('aceptar-invitacion', {
      body: {},
    })

    if (aceptarError) {
      setError('Tu contraseña fue actualizada, pero no pudimos activar la cuenta. Intenta iniciar sesión.')
    }

    // Cierre local de sesión (limpia localStorage sin tocar servidor) — evita
    // el race donde GuestRoute ve la sesión activa y salta al dashboard.
    await supabase.auth.signOut({ scope: 'local' })

    setLoading(false)
    navigate('/login', {
      state: { message: 'Cuenta activada exitosamente. Inicia sesión con tu nueva contraseña.' },
      replace: true,
    })
  }

  if (estado === 'verificando') {
    return (
      <AuthLayout title="Activando cuenta..." subtitle="Validando tu invitación">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="text-warm-400 text-sm">Un momento por favor...</p>
        </div>
      </AuthLayout>
    )
  }

  if (estado === 'invalido') {
    return (
      <AuthLayout
        title="Invitación inválida"
        subtitle="No pudimos validar tu enlace de activación"
      >
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative w-20 h-20 mx-auto animate-scale-in">
            <div className="absolute inset-0 bg-error/10 rounded-full" />
            <div className="relative w-full h-full bg-error/15 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-primary-800 text-[0.9375rem] leading-relaxed">
              El enlace ha expirado o ya fue utilizado. Pide a tu administrador una nueva
              invitación para activar tu cuenta.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/login" className="btn-secondary inline-flex w-auto! px-8 cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Activar cuenta"
      subtitle={email ? `Establece una contraseña para ${email}` : 'Establece una contraseña para activar tu cuenta'}
    >
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm animate-scale-in flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="animate-fade-in delay-1">
          <PasswordInput
            label="Nueva contraseña"
            value={password}
            onChange={setPassword}
            placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
            autoComplete="new-password"
            disabled={loading}
            showStrength
            required
          />
        </div>

        <div className="animate-fade-in delay-2">
          <PasswordInput
            label="Confirmar contraseña"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            disabled={loading}
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <FieldError message="Las contraseñas no coinciden" />
          )}
        </div>

        <div className="bg-warm-100/60 rounded-lg p-3.5 text-xs text-primary-700 animate-fade-in delay-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            Al activar tu cuenta se cerrará esta sesión temporal y podrás iniciar sesión con
            tu nueva contraseña.
          </p>
        </div>

        <div className="animate-fade-in delay-4 pt-1">
          <button type="submit" disabled={loading} className="btn-primary cursor-pointer">
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Activando...' : 'Activar cuenta'}
            {!loading && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}
