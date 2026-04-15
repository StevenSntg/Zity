import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import zityLogo from '../assets/zity_logo.png'

export default function TecnicoDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="bg-white border-b border-warm-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={zityLogo} alt="Zity" className="h-9 w-auto" />
            <span className="text-xs font-semibold bg-success text-white px-2.5 py-1 rounded-full tracking-wider uppercase">
              Técnico
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-primary-700">
              {profile?.nombre} {profile?.apellido}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-warm-400 hover:text-error transition-colors font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="animate-fade-in">
          <h2 className="font-display text-2xl font-semibold text-primary-900">
            Mis tareas asignadas
          </h2>
          <p className="mt-2 text-warm-400">
            Bienvenido, {profile?.nombre}. Aquí verás las solicitudes que te han sido asignadas.
          </p>
        </div>

        <div className="mt-8 bg-white rounded-xl border border-warm-200 p-8 text-center animate-fade-in delay-2">
          <div className="w-16 h-16 mx-auto bg-warm-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.25 3.09a.75.75 0 01-1.08-.87l1.36-5.78L1.72 7.46a.75.75 0 01.43-1.32l5.93-.49 2.28-5.46a.75.75 0 011.28 0l2.28 5.46 5.93.49a.75.75 0 01.43 1.32l-4.73 4.15 1.36 5.78a.75.75 0 01-1.08.87l-5.25-3.09z" />
            </svg>
          </div>
          <p className="text-warm-400">
            No tienes solicitudes asignadas por el momento.
          </p>
          <p className="mt-2 text-warm-300 text-sm">
            El módulo de tareas se habilitará en los próximos sprints.
          </p>
        </div>
      </main>
    </div>
  )
}
