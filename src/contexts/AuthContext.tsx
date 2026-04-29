import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, SignUpMetadata, EstadoCuenta } from '../types/database'

type AuthState = {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isRecovery: boolean
}

type AuthActions = {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
}

type AuthContextType = AuthState & AuthActions

const AuthContext = createContext<AuthContextType | null>(null)

const PROFILE_FETCH_TIMEOUT_MS = 6000
const SIGN_IN_TIMEOUT_MS = 8000
const PROFILE_COLUMNS = 'id, email, nombre, apellido, telefono, rol, piso, departamento, estado_cuenta, empresa_tercero, created_at, updated_at'

const isDev = import.meta.env.DEV

// Base URL para los enlaces que Supabase incluye en correos (verificación, reset).
function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '')
  return window.location.origin
}

const ESTADO_CUENTA_MENSAJES: Record<Exclude<EstadoCuenta, 'activo'>, string> = {
  pendiente: 'Tu cuenta está pendiente de aprobación. Un administrador debe activarla antes de que puedas ingresar.',
  bloqueado: 'Tu cuenta está bloqueada. Contacta al administrador para más información.',
}

async function fetchProfileSafe(userId: string): Promise<Profile | null> {
  try {
    const queryPromise = supabase
      .from('usuarios')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .single()

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>(resolve =>
      setTimeout(
        () => resolve({ data: null, error: { message: 'Profile fetch timeout' } }),
        PROFILE_FETCH_TIMEOUT_MS,
      ),
    )

    const { data, error } = await Promise.race([queryPromise, timeoutPromise])

    if (error) {
      if (isDev) console.warn('[Auth] fetchProfile error:', error.message)
      return null
    }
    return data as Profile
  } catch (err) {
    if (isDev) console.warn('[Auth] fetchProfile failed:', (err as Error).message)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isRecovery: false,
  })

  const mountedRef = useRef(true)
  // Guarda el último userId para el que ya tenemos profile cargado. Evita refetch
  // redundante en cada TOKEN_REFRESHED (cada hora) y en cada pestaña abierta.
  const profileUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    mountedRef.current = true

    // Safety timeout: si en 10s no llegó ningún evento, forzar loading:false.
    const safetyTimeout = setTimeout(() => {
      if (!mountedRef.current) return
      if (isDev) console.warn('[Auth] Safety timeout: no auth event received in 10s, forcing loading=false')
      setState(prev => (prev.loading ? { ...prev, loading: false } : prev))
    }, 10000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return

        if (event === 'PASSWORD_RECOVERY') {
          profileUserIdRef.current = null
          setState(prev => ({
            ...prev,
            isRecovery: true,
            loading: false,
            session,
            user: session?.user ?? null,
            profile: null,
          }))
          return
        }

        if (event === 'SIGNED_OUT') {
          profileUserIdRef.current = null
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            isRecovery: false,
          })
          return
        }

        if (!session?.user) {
          profileUserIdRef.current = null
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            isRecovery: false,
          })
          return
        }

        // TOKEN_REFRESHED con el mismo usuario: solo actualizamos session/user
        // sin volver a tocar la red para el profile. Es el camino crítico para
        // no kickear al login si la query del profile coincide con un timeout.
        if (event === 'TOKEN_REFRESHED' && profileUserIdRef.current === session.user.id) {
          setState(prev => ({
            ...prev,
            user: session.user,
            session,
            loading: false,
          }))
          return
        }

        // INITIAL_SESSION, SIGNED_IN, USER_UPDATED, o TOKEN_REFRESHED de otro usuario.
        const profile = await fetchProfileSafe(session.user.id)
        if (!mountedRef.current) return
        profileUserIdRef.current = session.user.id
        setState({
          user: session.user,
          profile,
          session,
          loading: false,
          isRecovery: false,
        })
      }
    )

    return () => {
      mountedRef.current = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // signIn devuelve error si:
  // 1. Las credenciales son inválidas (Supabase responde con error)
  // 2. La cuenta está pendiente o bloqueada (validamos antes de dejar sesión activa)
  // En ambos casos el cliente queda sin sesión, por lo que el botón del Login
  // puede resetear su estado de carga sin depender de GuestRoute para redirigir.
  //
  // Multi-tab: si el cliente está abierto en dos pestañas, supabase-js usa un
  // lock compartido (localStorage + navigator.locks) para serializar las ops
  // de auth. Si la otra pestaña tomó el lock primero o lo está reteniendo, el
  // signInWithPassword puede no resolver. En ese caso confiamos en el evento
  // SIGNED_IN que dispara onAuthStateChange (vía storage sync) para que
  // GuestRoute redirija — devolvemos sin error tras el timeout.
  const signIn = useCallback(async (email: string, password: string) => {
    type SignInResult = Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>

    const timeoutResult: { timedOut: true } = { timedOut: true }
    const race = await Promise.race<SignInResult | { timedOut: true }>([
      supabase.auth.signInWithPassword({ email, password }),
      new Promise(resolve => setTimeout(() => resolve(timeoutResult), SIGN_IN_TIMEOUT_MS)),
    ])

    if ('timedOut' in race) {
      // Otra pestaña pudo haber resuelto la sesión por nosotros; el evento
      // SIGNED_IN dispará en cuanto se sincronice el storage. No mostramos
      // error: si en realidad falló, el usuario verá que sigue en /login y
      // podrá reintentar.
      return { error: null }
    }

    const { data, error } = race

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Debes verificar tu correo electrónico antes de iniciar sesión.' }
      }
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Credenciales incorrectas.' }
      }
      return { error: error.message }
    }

    if (!data.user) {
      return { error: 'No pudimos iniciar sesión. Intenta de nuevo.' }
    }

    const profile = await fetchProfileSafe(data.user.id)

    if (!profile) {
      await supabase.auth.signOut({ scope: 'local' })
      return { error: 'No pudimos cargar tu perfil. Contacta al administrador.' }
    }

    if (profile.estado_cuenta !== 'activo') {
      await supabase.auth.signOut({ scope: 'local' })
      return { error: ESTADO_CUENTA_MENSAJES[profile.estado_cuenta] }
    }

    return { error: null }
  }, [])

  const signUp = useCallback(async (email: string, password: string, metadata: SignUpMetadata) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${getSiteUrl()}/email-verified`,
      },
    })
    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'Este correo electrónico ya está registrado.' }
      }
      return { error: error.message }
    }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/reset-password`,
    })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }
    setState(prev => ({ ...prev, isRecovery: false }))
    return { error: null }
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({ ...state, signIn, signUp, signOut, resetPassword, updatePassword }),
    [state, signIn, signUp, signOut, resetPassword, updatePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
