import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

// Edge function que invoca el invitado al completar /activar:
// — Valida que el caller tenga sesión (vino del enlace de invitación) y que su cuenta esté pendiente.
// — Marca usuarios.estado_cuenta = 'activo' con service_role (RLS no permite al propio usuario
//   cambiar este campo gracias al trigger guard_usuario_estado_y_rol).
// — Marca la fila correspondiente en `invitaciones` como 'aceptada' si existe.
// — Inserta en audit_log.

const ORIGENES_PERMITIDOS = new Set([
  "https://zity.site",
  "https://www.zity.site",
  "http://localhost:5173",
  "http://localhost:4173",
])

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? ""
  const allowOrigin = ORIGENES_PERMITIDOS.has(origin) ? origin : "https://zity.site"
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }
}

function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    status,
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get("authorization") ?? ""
    const token = authHeader.replace(/^Bearer\s+/i, "")
    if (!token) {
      return jsonResponse(req, { error: "No autorizado" }, 401)
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData?.user) {
      return jsonResponse(req, { error: "Token inválido" }, 401)
    }

    const userId = userData.user.id
    const userEmail = userData.user.email ?? ""

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("usuarios")
      .select("estado_cuenta")
      .eq("id", userId)
      .single()

    if (perfilError || !perfil) {
      return jsonResponse(req, { error: "Perfil no encontrado" }, 404)
    }

    // Idempotente: si ya está activa, no es error — el cliente puede reintentar.
    if (perfil.estado_cuenta === "activo") {
      return jsonResponse(req, { success: true, estado: "activo", changed: false })
    }

    if (perfil.estado_cuenta !== "pendiente") {
      return jsonResponse(
        req,
        { error: `No se puede activar una cuenta en estado '${perfil.estado_cuenta}'` },
        409,
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from("usuarios")
      .update({ estado_cuenta: "activo" })
      .eq("id", userId)

    if (updateError) throw new Error(updateError.message)

    if (userEmail) {
      await supabaseAdmin
        .from("invitaciones")
        .update({ estado: "aceptada" })
        .eq("email", userEmail)
        .eq("estado", "pendiente")
    }

    await supabaseAdmin.from("audit_log").insert({
      usuario_id: userId,
      accion: "aceptar_invitacion",
      entidad: "usuarios",
      entidad_id: userId,
      resultado: "exitoso",
    })

    return jsonResponse(req, { success: true, estado: "activo", changed: true })
  } catch (error) {
    return jsonResponse(req, { error: (error as Error).message }, 500)
  }
})
