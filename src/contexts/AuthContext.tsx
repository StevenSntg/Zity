import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, SignUpMetadata } from '../types/database'

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

// Base URL para los enlaces que Supabase incluye en correos (verificación, reset).
// En producción se define VITE_SITE_URL=https://zity.site en las variables del hosting.
// En desarrollo cae a window.location.origin (ej. http://localhost:5173).
function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '')
  return window.location.origin
}

async function fetchProfileSafe(userId: string): Promise<Profile | null> {
  try {
    const queryPromise = supabase
      .from('usuarios')
      .select('*')
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
      console.warn('[Auth] fetchProfile error:', error.message)
      return null
    }
    return data as Profile
  } catch (err) {
    console.warn('[Auth] fetchProfile failed:', (err as Error).message)
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

  useEffect(() => {
    mountedRef.current = true
    console.log('[Auth] Provider mounted, subscribing to auth changes')

    // Safety timeout: si en 10s no llegó ningún evento, forzar loading:false para evitar cuelgue
    const safetyTimeout = setTimeout(() => {
      if (!mountedRef.current) return
      console.warn('[Auth] Safety timeout: no auth event received in 10s, forcing loading=false')
      setState(prev => (prev.loading ? { ...prev, loading: false } : prev))
    }, 10000)

    // onAuthStateChange dispara INITIAL_SESSION al suscribirse (con session actual o null),
    // eliminando la necesidad de un getSession + fetchProfile paralelo que podía quedarse colgado.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] event:', event, 'session:', session?.user?.email ?? 'null')
        if (!mountedRef.current) return
        // NO cancelamos safetyTimeout aquí — es la garantía final de que loading pase a false
        // incluso si algo raro pasa después de este punto.

        if (event === 'PASSWORD_RECOVERY') {
          setState(prev => ({
            ...prev,
            isRecovery: true,
            loading: false,
            session,
            user: session?.user ?? null,
          }))
          return
        }

        if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            isRecovery: false,
          })
          return
        }

        // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED
        if (session?.user) {
          console.log('[Auth] fetching profile for', session.user.id)
          const profile = await fetchProfileSafe(session.user.id)
          console.log('[Auth] profile fetched:', profile ? 'OK' : 'NULL')
          if (!mountedRef.current) return
          setState({
            user: session.user,
            profile,
            session,
            loading: false,
            isRecovery: false,
          })
        } else {
          // Sin sesión (ej. INITIAL_SESSION de usuario guest)
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            isRecovery: false,
          })
        }
      }
    )

    return () => {
      console.log('[Auth] Provider unmounting')
      mountedRef.current = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Debes verificar tu correo electrónico antes de iniciar sesión.' }
      }
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Credenciales incorrectas.' }
      }
      return { error: error.message }
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

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
