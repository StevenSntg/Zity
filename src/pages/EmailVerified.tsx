import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'

type EstadoCallback = 'procesando' | 'ok' | 'error'

export default function EmailVerified() {
  const [estado, setEstado] = useState<EstadoCallback>('procesando')

  useEffect(() => {
    let cancelado = false

    async function procesar() {
      const { data: { session } } = await supabase.auth.getSession()
      const hash = window.location.hash
      const hayError = hash.includes('error') || hash.includes('error_description')

      if (hayError) {
        if (!cancelado) setEstado('error')
        return
      }

      // Si Supabase abrió sesión automáticamente al procesar el token del correo,
      // la cerramos para forzar un inicio de sesión consciente del usuario.
      if (session) {
        await supabase.auth.signOut()
      }

      if (!cancelado) setEstado(session ? 'ok' : 'error')
    }

    procesar()
    return () => {
      cancelado = true
    }
  }, [])

  if (estado === 'procesando') {
    return (
      <AuthLayout title="Verificando..." subtitle="Confirmando tu correo electrónico">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="text-warm-400 text-sm">Un momento por favor...</p>
        </div>
      </AuthLayout>
    )
  }

  if (estado === 'error') {
    return (
      <AuthLayout
        title="Enlace inválido"
        subtitle="No pudimos verificar tu correo con este enlace"
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
              El enlace ha expirado o ya fue utilizado. Si tu cuenta aún no está verificada,
              vuelve a registrarte para recibir un nuevo enlace.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/login" className="btn-primary inline-flex w-auto! px-10 cursor-pointer">
              Ir al inicio de sesión
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Correo verificado"
      subtitle="Tu cuenta ha sido confirmada correctamente"
    >
      <div className="text-center space-y-6 animate-fade-in">
        <div className="relative w-24 h-24 mx-auto animate-scale-in">
          <div className="absolute inset-0 bg-success/15 rounded-full blur-xl animate-pulse" />
          <div className="absolute inset-2 bg-success/10 rounded-full" />
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-primary-800 text-[0.9375rem] leading-relaxed">
            ¡Listo! Ya puedes iniciar sesión con tus credenciales para acceder a tu panel.
          </p>

          <div className="bg-warm-100/70 rounded-xl p-4 text-left border border-warm-200/60">
            <p className="text-sm text-primary-700 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Recuerda que un administrador debe activar tu cuenta antes de que puedas
                usar el sistema.
              </span>
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Link to="/login" className="btn-primary inline-flex w-auto! px-10 cursor-pointer">
            Iniciar sesión
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
