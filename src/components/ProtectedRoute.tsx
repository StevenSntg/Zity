import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import FullPageSpinner from './FullPageSpinner'
import { ROLE_ROUTES } from '../lib/routing'
import type { Rol } from '../types/database'

type ProtectedRouteProps = {
  children: React.ReactNode
  allowedRoles?: Rol[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) return <FullPageSpinner />

  if (!user) return <Navigate to="/login" replace />

  // Sin profile cargado o cuenta no activa → al login (un usuario con sesión
  // pero sin perfil válido no puede operar contra RLS).
  if (!profile || profile.estado_cuenta !== 'activo') {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.rol)) {
    return <Navigate to={ROLE_ROUTES[profile.rol]} replace />
  }

  return <>{children}</>
}
