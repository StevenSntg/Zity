import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
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

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in delay-3">
          <Link
            to="/admin/usuarios"
            className="bg-white rounded-xl border border-warm-200 p-6 hover:border-primary-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-primary-900">Gestión de usuarios</h3>
            </div>
            <p className="text-sm text-warm-400">
              Ver, filtrar, bloquear e invitar usuarios al edificio.
            </p>
          </Link>

          <div className="bg-white rounded-xl border border-warm-200 p-6 opacity-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-medium text-primary-900">Solicitudes</h3>
            </div>
            <p className="text-sm text-warm-400">Disponible en Sprint 3.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
