import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import zityLogo from '../assets/zity_logo.png'

export default function ResidenteDashboard() {
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
            <span className="text-xs font-semibold bg-accent-500 text-white px-2.5 py-1 rounded-full tracking-wider uppercase">
              Residente
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
            Hola, {profile?.nombre}
          </h2>
          <p className="mt-2 text-warm-400">
            Piso {profile?.piso}, Depto. {profile?.departamento}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in delay-2">
          <div className="bg-white rounded-xl border border-warm-200 p-6">
            <h3 className="font-display text-lg font-semibold text-primary-800">Mis solicitudes</h3>
            <p className="mt-2 text-warm-400 text-sm">
              Aquí verás el historial de tus solicitudes de mantenimiento.
            </p>
            <div className="mt-4 bg-warm-50 rounded-lg p-6 text-center">
              <p className="text-warm-400 text-sm">Aún no tienes solicitudes.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-warm-200 p-6">
            <h3 className="font-display text-lg font-semibold text-primary-800">Crear solicitud</h3>
            <p className="mt-2 text-warm-400 text-sm">
              Reporta un problema o solicita mantenimiento para tu unidad.
            </p>
            <div className="mt-4">
              <button disabled className="btn-primary opacity-50 cursor-not-allowed">
                Próximamente
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
