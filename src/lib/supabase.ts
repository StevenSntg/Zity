import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// flowType:'implicit' — los links generados server-side por inviteUserByEmail,
// resetPasswordForEmail y similares vienen con los tokens en el hash de la URL.
// El default actual de supabase-js es 'pkce', que requiere un code_verifier
// generado del lado del cliente al iniciar el flujo; como estos links se generan
// desde edge functions, el verifier no existe y el canje fallaría.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})
