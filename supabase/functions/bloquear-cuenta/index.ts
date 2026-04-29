import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, jsonResponse, requireAdmin } from "../_shared/auth.ts"

// Edge function de gestión de estado de cuenta operada por el admin.
// Soporta tres acciones sobre `usuarios.estado_cuenta`:
//   - "bloquear":    activo|pendiente -> bloqueado (+ ban_duration en auth.users)
//   - "desbloquear": bloqueado        -> activo    (- ban_duration)
//   - "activar":     pendiente        -> activo    (no toca ban_duration)
// El nombre histórico se mantuvo para evitar churn de despliegue, pero
// internamente cubre todas las transiciones de estado.

type Accion = "bloquear" | "desbloquear" | "activar"

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
      accion: Accion
    }

    if (!usuario_id || !["bloquear", "desbloquear", "activar"].includes(accion)) {
      return jsonResponse(req, { error: "Parámetros inválidos" }, 400)
    }

    if (accion === "bloquear" && callerUserId === usuario_id) {
      return jsonResponse(req, { error: "No puedes bloquear tu propia cuenta" }, 400)
    }

    // Validamos transición permitida leyendo el estado actual.
    const { data: target, error: targetError } = await supabaseAdmin
      .from("usuarios")
      .select("estado_cuenta")
      .eq("id", usuario_id)
      .single()

    if (targetError || !target) {
      return jsonResponse(req, { error: "Usuario no encontrado" }, 404)
    }

    const transicionesValidas: Record<Accion, string[]> = {
      bloquear: ["activo", "pendiente"],
      desbloquear: ["bloqueado"],
      activar: ["pendiente"],
    }

    if (!transicionesValidas[accion].includes(target.estado_cuenta)) {
      return jsonResponse(
        req,
        { error: `No se puede ${accion} una cuenta en estado '${target.estado_cuenta}'` },
        409,
      )
    }

    const nuevoEstado =
      accion === "bloquear" ? "bloqueado" : "activo"

    const { error: updateError } = await supabaseAdmin
      .from("usuarios")
      .update({ estado_cuenta: nuevoEstado })
      .eq("id", usuario_id)

    if (updateError) throw new Error(updateError.message)

    if (accion === "bloquear") {
      await supabaseAdmin.auth.admin.updateUserById(usuario_id, { ban_duration: "87600h" })
    } else if (accion === "desbloquear") {
      await supabaseAdmin.auth.admin.updateUserById(usuario_id, { ban_duration: "none" })
    }
    // 'activar': no se toca ban_duration porque la cuenta nunca estuvo banneada.

    const accionAudit =
      accion === "bloquear"
        ? "bloquear_cuenta"
        : accion === "desbloquear"
          ? "desbloquear_cuenta"
          : "activar_cuenta"

    await supabaseAdmin.from("audit_log").insert({
      usuario_id: callerUserId,
      accion: accionAudit,
      entidad: "usuarios",
      entidad_id: usuario_id,
      resultado: "exitoso",
    })

    return jsonResponse(req, { success: true, estado: nuevoEstado })
  } catch (error) {
    return jsonResponse(req, { error: (error as Error).message }, 500)
  }
})
