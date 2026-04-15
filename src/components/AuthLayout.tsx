import { Link, Outlet } from 'react-router-dom'
import zityLogo from '../assets/zity_logo.png'

/**
 * AuthShell — layout route estático.
 * Renderiza el panel izquierdo (branding) una sola vez y expone
 * <Outlet> para que las rutas anidadas cambien solo el lado derecho.
 */
export function AuthShell() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-warm-50">
      {/* Panel izquierdo — Branding (nunca se desmonta al navegar entre páginas de auth) */}
      <div className="auth-panel relative hidden lg:flex lg:w-[45%] flex-col justify-between p-12 text-white overflow-hidden">
        {/* Logo */}
        <div className="relative z-10 animate-fade-in">
          <Link to="/login" className="inline-block group">
            <img
              src={zityLogo}
              alt="Zity"
              className="h-18 w-auto drop-shadow-[0_0_25px_rgba(212,160,67,0.25)] transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </Link>
        </div>

        {/* Middle content */}
        <div className="relative z-10 space-y-8 animate-fade-in delay-2">
          <div>
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="h-px w-8 bg-accent-500/60" />
              <span className="text-accent-400 text-xs uppercase tracking-[0.25em] font-semibold">
                Un espacio, tres roles
              </span>
            </div>
            <p className="font-display text-3xl leading-[1.2] text-primary-50 font-light">
              Simplifica la comunicación entre
              <span className="text-accent-400 italic font-normal"> residentes</span>,
              <span className="text-accent-400 italic font-normal"> administradores</span> y
              <span className="text-accent-400 italic font-normal"> técnicos</span>.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { icon: 'request', label: 'Solicitudes', desc: 'Crea y rastrea' },
              { icon: 'assign', label: 'Asignación', desc: 'Ágil y clara' },
              { icon: 'notify', label: 'Notificaciones', desc: 'En tiempo real' },
              { icon: 'audit', label: 'Trazabilidad', desc: '100% auditada' },
            ].map(item => (
              <div
                key={item.label}
                className="group relative p-3.5 rounded-lg border border-primary-400/15 bg-primary-900/30 backdrop-blur-sm hover:border-accent-500/40 transition-colors duration-300"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-md bg-accent-500/15 flex items-center justify-center text-accent-400 group-hover:bg-accent-500/25 transition-colors">
                    {item.icon === 'request' && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    )}
                    {item.icon === 'assign' && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                    {item.icon === 'notify' && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    )}
                    {item.icon === 'audit' && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-primary-50 text-[0.9125rem] font-medium leading-none">{item.label}</p>
                    <p className="text-primary-400 text-[0.8125rem] mt-1 leading-none">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between animate-fade-in delay-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-accent-400 to-accent-600 ring-2 ring-primary-900 flex items-center justify-center text-sm font-semibold">CF</div>
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-300 to-primary-500 ring-2 ring-primary-900 flex items-center justify-center text-sm font-semibold">LV</div>
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-success to-emerald-700 ring-2 ring-primary-900 flex items-center justify-center text-sm font-semibold">MP</div>
            </div>
            <p className="text-primary-300 text-xs">
              Confiado por residentes,<br/>admins y técnicos.
            </p>
          </div>

          <div className="text-primary-400/60 text-[0.6875rem] tracking-wider uppercase">
            &copy; {new Date().getFullYear()} Zity
          </div>
        </div>
      </div>

      {/* Panel derecho — las rutas anidadas se renderizan aquí */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:px-16 relative">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #1B3A4B 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />

        {/* Logo mobile */}
        <div className="lg:hidden mb-8 text-center relative z-10">
          <Link to="/login" className="inline-block">
            <img
              src={zityLogo}
              alt="Zity"
              className="h-14 w-auto mx-auto"
            />
          </Link>
          <p className="mt-2 text-warm-400 text-xs font-body uppercase tracking-wider">
            Gestión inteligente · Edificios
          </p>
        </div>

        <div className="w-full max-w-md mx-auto relative z-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

/**
 * AuthLayout — contenido del lado derecho (título + subtítulo + children).
 * Se usa dentro de cada página de autenticación.
 */
type AuthLayoutProps = {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <>
      <div className="animate-fade-in">
        <h2 className="font-display text-[1.75rem] lg:text-[2rem] font-semibold text-primary-900 tracking-tight leading-[1.15]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2.5 text-warm-400 text-[0.9375rem] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-8">
        {children}
      </div>
    </>
  )
}
