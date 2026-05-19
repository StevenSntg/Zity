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

    const body = (await req.json()) as {
      accion?: "crear" | "reenviar"
      email: string
      rol?: "residente" | "tecnico" | "admin"
      nombre?: string
      piso?: string
      departamento?: string
      empresa_tercero?: string
    }

    const { email, rol, nombre, piso, departamento, empresa_tercero } = body
    const accion = body.accion ?? "crear"

    // El link del correo siempre apunta al dominio de producción para que el
    // invitado pueda abrirlo desde cualquier dispositivo. Configurable vía
    // `supabase secrets set SITE_URL=https://zity.site`.
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://zity.site"
    const redirectOrigin = siteUrl.replace(/\/$/, "")

    if (!email) {
      return jsonResponse(req, { error: "email es requerido" }, 400)
    }

    if (accion === "crear" && !rol) {
      return jsonResponse(req, { error: "rol es requerido para crear invitación" }, 400)
    }

    if (accion === "reenviar") {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo: `${redirectOrigin}/activar` },
      })

      if (linkError) {
        return jsonResponse(req, { error: linkError.message }, 400)
      }

      await supabaseAdmin
        .from("invitaciones")
        .update({
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          estado: "pendiente",
        })
        .eq("email", email)

      await supabaseAdmin.from("audit_log").insert({
        usuario_id: callerUserId,
        accion: "reenviar_invitacion",
        entidad: "invitaciones",
        resultado: "exitoso",
      })

      return jsonResponse(req, {
        success: true,
        action_link: linkData?.properties?.action_link,
      })
    }

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        nombre: nombre ?? "",
        rol,
        piso: piso ?? "",
        departamento: departamento ?? "",
        empresa_tercero: empresa_tercero ?? null,
      },
      redirectTo: `${redirectOrigin}/activar`,
    })

    if (inviteError) {
      if (
        inviteError.message.includes("already been registered") ||
        inviteError.message.includes("already exists")
      ) {
        return jsonResponse(req, { error: "Este correo ya está registrado" }, 409)
      }
      throw new Error(inviteError.message)
    }

    const token_invitacion = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const { error: insertError } = await supabaseAdmin.from("invitaciones").insert({
      email,
      rol,
      nombre: nombre ?? null,
      piso: piso ?? null,
      departamento: departamento ?? null,
      token: token_invitacion,
      creada_por: callerUserId,
      expires_at: expiresAt,
    })

    if (insertError) throw new Error(insertError.message)

    await supabaseAdmin.from("audit_log").insert({
      usuario_id: callerUserId,
      accion: "crear_invitacion",
      entidad: "invitaciones",
      resultado: "exitoso",
    })

    return jsonResponse(req, { success: true, token: token_invitacion })
  } catch (error) {
    return jsonResponse(req, { error: (error as Error).message }, 500)
  }
})
