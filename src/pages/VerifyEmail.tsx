import { Link, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

export default function VerifyEmail() {
  const location = useLocation()
  const email = (location.state as { email?: string })?.email

  return (
    <AuthLayout
      title="Verifica tu correo"
      subtitle="Hemos enviado un enlace de activación a tu correo electrónico"
    >
      <div className="text-center space-y-6 animate-fade-in">
        {/* Animated envelope with glow */}
        <div className="relative w-24 h-24 mx-auto animate-scale-in">
          <div className="absolute inset-0 bg-accent-500/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute inset-2 bg-accent-500/10 rounded-full" />
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          {email && (
            <p className="text-primary-800 text-[0.9375rem] leading-relaxed">
              Enviamos un enlace de verificación a
              <br />
              <strong className="font-semibold text-primary-900">{email}</strong>
            </p>
          )}

          <div className="bg-warm-100/70 rounded-xl p-5 text-left border border-warm-200/60">
            <p className="text-sm text-primary-700 font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary-600 text-white flex items-center justify-center text-xs font-bold">1</span>
              Para completar tu registro
            </p>
            <ol className="text-sm text-primary-600 space-y-2 ml-1">
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Abre tu bandeja de entrada
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Busca el correo de <strong className="font-semibold">Zity</strong>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Haz clic en el enlace de verificación
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Inicia sesión con tus credenciales
              </li>
            </ol>
          </div>

          <div className="flex items-center justify-center gap-2 text-warm-400 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>El enlace expira en 24 horas</span>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <Link to="/login" className="btn-primary inline-flex w-auto! px-10 cursor-pointer">
            Ir al inicio de sesión
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-xs text-warm-400">
            ¿No recibiste el correo? Revisa la carpeta de spam o promociones.
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
