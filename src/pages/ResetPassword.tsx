import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/AuthLayout'
import PasswordInput from '../components/PasswordInput'

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/

export default function ResetPassword() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError)
      setLoading(false)
      return
    }

    navigate('/login', {
      state: { message: 'Contraseña actualizada exitosamente. Inicia sesión con tu nueva contraseña.' },
      replace: true,
    })
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Establece una contraseña segura para tu cuenta"
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
            label="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repite tu nueva contraseña"
            autoComplete="new-password"
            disabled={loading}
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1.5 text-xs text-error flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Las contraseñas no coinciden
            </p>
          )}
        </div>

        <div className="bg-warm-100/60 rounded-lg p-3.5 text-xs text-primary-700 animate-fade-in delay-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          <p>
            Elige una contraseña que no uses en otros servicios. Combina mayúsculas,
            minúsculas, números y símbolos para mayor seguridad.
          </p>
        </div>

        <div className="animate-fade-in delay-4 pt-1">
          <button type="submit" disabled={loading} className="btn-primary cursor-pointer">
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
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
