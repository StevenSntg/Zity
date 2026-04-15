import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Rol } from '../types/database'

type ProtectedRouteProps = {
  children: React.ReactNode
  allowedRoles?: Rol[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-warm-400 text-sm font-body">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.estado_cuenta === 'pendiente') {
    return <Navigate to="/login" replace />
  }

  if (profile?.estado_cuenta === 'bloqueado') {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.rol)) {
    const redirectMap: Record<Rol, string> = {
      admin: '/admin',
      residente: '/residente',
      tecnico: '/tecnico',
    }
    return <Navigate to={redirectMap[profile.rol]} replace />
  }

  return <>{children}</>
}
