import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2"

// CORS restringido al dominio de producción y a localhost para desarrollo.
// El comodín `*` permite que cualquier origen invoque la función con la sesión
// del usuario; con service_role activo eso amplifica cualquier vulnerabilidad.
const ORIGENES_PERMITIDOS = new Set([
  "https://zity.site",
  "https://www.zity.site",
  "http://localhost:5173",
  "http://localhost:4173",
])

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? ""
  const allowOrigin = ORIGENES_PERMITIDOS.has(origin) ? origin : "https://zity.site"
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }
}

export function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    status,
  })
}

export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export type AdminContext = {
  callerUserId: string
  supabaseAdmin: SupabaseClient
}

// Verifica que el caller es un admin autenticado real.
// IMPORTANTE: usa supabase.auth.getUser(token) que valida la firma del JWT
// contra la clave secreta del proyecto. NO decodifica el JWT manualmente con
// atob (eso solo lee el payload sin verificar la firma — un atacante puede
// falsificar role:authenticated y sub:<admin-uuid>).
export async function requireAdmin(req: Request): Promise<AdminContext | Response> {
  const authHeader = req.headers.get("authorization") ?? ""
  const token = authHeader.replace(/^Bearer\s+/i, "")

  if (!token) {
    return jsonResponse(req, { error: "No autorizado" }, 401)
  }

  const supabaseAdmin = createServiceClient()

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData?.user) {
    return jsonResponse(req, { error: "Token inválido" }, 401)
  }

  const callerUserId = userData.user.id

  const { data: callerProfile, error: profileError } = await supabaseAdmin
    .from("usuarios")
    .select("rol")
    .eq("id", callerUserId)
    .single()

  if (profileError || callerProfile?.rol !== "admin") {
    return jsonResponse(req, { error: "Solo admins pueden realizar esta acción" }, 403)
  }

  return { callerUserId, supabaseAdmin }
}
