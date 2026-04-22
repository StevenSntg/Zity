import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthShell } from './components/AuthLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsuarios from './pages/admin/Usuarios'
import ResidenteDashboard from './pages/ResidenteDashboard'
import TecnicoDashboard from './pages/TecnicoDashboard'
import type { Rol } from './types/database'

function RootRedirect() {
  const { user, profile, loading, isRecovery } = useAuth()

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

  if (isRecovery) {
    return <Navigate to="/reset-password" replace />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const rol: Rol = profile?.rol ?? 'residente'
  const redirectMap: Record<Rol, string> = {
    admin: '/admin',
    residente: '/residente',
    tecnico: '/tecnico',
  }

  return <Navigate to={redirectMap[rol]} replace />
}

function GuestRoute({ children }: { children: React.ReactNode }) {
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

  if (user && profile?.estado_cuenta === 'activo') {
    const rol: Rol = profile.rol
    const redirectMap: Record<Rol, string> = {
      admin: '/admin',
      residente: '/residente',
      tecnico: '/tecnico',
    }
    return <Navigate to={redirectMap[rol]} replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth routes — AuthShell se mantiene montado entre páginas; solo cambia el Outlet */}
          <Route element={<AuthShell />}>
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>

          {/* Protected dashboard routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/usuarios" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsuarios />
            </ProtectedRoute>
          } />
          <Route path="/residente" element={
            <ProtectedRoute allowedRoles={['residente']}>
              <ResidenteDashboard />
            </ProtectedRoute>
          } />
          <Route path="/tecnico" element={
            <ProtectedRoute allowedRoles={['tecnico']}>
              <TecnicoDashboard />
            </ProtectedRoute>
          } />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
