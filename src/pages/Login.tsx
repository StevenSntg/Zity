import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Rol } from '../types/database'
import AuthLayout from '../components/AuthLayout'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const successMessage = (location.state as { message?: string })?.message

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const rol = (user?.user_metadata?.rol as Rol) ?? 'residente'

    const redirectMap: Record<Rol, string> = {
      admin: '/admin',
      residente: '/residente',
      tecnico: '/tecnico',
    }
    navigate(redirectMap[rol], { replace: true })
  }

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Inicia sesión para acceder a tu panel"
    >
      {successMessage && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg text-success text-sm animate-fade-in flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

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
          <label htmlFor="email" className="block text-sm font-medium text-primary-800 mb-1.5">
            Correo electrónico
          </label>
          <div className="relative">
            
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="input-field pl-10"
              disabled={loading}
            />
          </div>
        </div>

        <div className="animate-fade-in delay-2">
          <PasswordInput
            label="Contraseña"
            value={password}
            onChange={setPassword}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            disabled={loading}
            required
          />
        </div>

        <div className="flex justify-end animate-fade-in delay-3">
          <Link
            to="/forgot-password"
            className="text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="animate-fade-in delay-4">
          <button type="submit" disabled={loading} className="btn-primary cursor-pointer">
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
            {!loading && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-warm-200 text-center animate-fade-in delay-5">
        <p className="text-sm text-warm-400">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
            Regístrate
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
