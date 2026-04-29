import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, jsonResponse, requireAdmin } from "../_shared/auth.ts"

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) })
  }

  try {
    const auth = await requireAdmin(req)
    if (auth instanceof Response) return auth
    const { callerUserId, supabaseAdmin } = auth

    const { usuario_id, accion } = (await req.json()) as {
      usuario_id: string
      accion: "bloquear" | "desbloquear"
    }

    if (!usuario_id || !["bloquear", "desbloquear"].includes(accion)) {
      return jsonResponse(req, { error: "Parámetros inválidos" }, 400)
    }

    // Un admin no puede bloquearse a sí mismo (quedaría sin acceso al panel).
    if (accion === "bloquear" && callerUserId === usuario_id) {
      return jsonResponse(req, { error: "No puedes bloquear tu propia cuenta" }, 400)
    }

    const nuevoEstado = accion === "bloquear" ? "bloqueado" : "activo"

    const { error: updateError } = await supabaseAdmin
      .from("usuarios")
      .update({ estado_cuenta: nuevoEstado })
      .eq("id", usuario_id)

    if (updateError) throw new Error(updateError.message)

    if (accion === "bloquear") {
      await supabaseAdmin.auth.admin.updateUserById(usuario_id, { ban_duration: "87600h" })
    } else {
      await supabaseAdmin.auth.admin.updateUserById(usuario_id, { ban_duration: "none" })
    }

    await supabaseAdmin.from("audit_log").insert({
      usuario_id: callerUserId,
      accion: accion === "bloquear" ? "bloquear_cuenta" : "desbloquear_cuenta",
      entidad: "usuarios",
      entidad_id: usuario_id,
      resultado: "exitoso",
    })

    return jsonResponse(req, { success: true, estado: nuevoEstado })
  } catch (error) {
    return jsonResponse(req, { error: (error as Error).message }, 500)
  }
})
