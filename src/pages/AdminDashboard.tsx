import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import zityLogo from '../assets/zity_logo.png'

export default function AdminDashboard() {
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
            <span className="text-xs font-semibold bg-primary-600 text-white px-2.5 py-1 rounded-full tracking-wider uppercase">
              Admin
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
            Panel de Administración
          </h2>
          <p className="mt-2 text-warm-400">
            Bienvenido, {profile?.nombre}. Aquí gestionarás las solicitudes del edificio.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in delay-2">
          {[
            { label: 'Solicitudes pendientes', value: '—', color: 'bg-accent-50 text-accent-700' },
            { label: 'En progreso', value: '—', color: 'bg-primary-50 text-primary-700' },
            { label: 'Resueltas este mes', value: '—', color: 'bg-green-50 text-success' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-warm-200 p-6">
              <p className="text-sm text-warm-400">{card.label}</p>
              <p className={`mt-2 text-3xl font-display font-semibold ${card.color.split(' ')[1]}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl border border-warm-200 p-8 text-center animate-fade-in delay-3">
          <p className="text-warm-400">
            El módulo de gestión de solicitudes se implementará en los próximos sprints.
          </p>
        </div>
      </main>
    </div>
  )
}
