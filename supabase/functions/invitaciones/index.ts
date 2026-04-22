import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // verify_jwt:false en el deploy: validamos manualmente acá.
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')

    let callerUserId: string | null = null
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const pad = payloadB64.length % 4
        const padded = pad ? payloadB64 + '='.repeat(4 - pad) : payloadB64
        const payload = JSON.parse(atob(padded)) as { sub?: string; role?: string }
        if (payload.role === 'authenticated' && payload.sub) {
          callerUserId = payload.sub
        }
      }
    } catch {
      callerUserId = null
    }

    if (!callerUserId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: callerProfile } = await supabaseAdmin
      .from('usuarios')
      .select('rol')
      .eq('id', callerUserId)
      .single()

    if (callerProfile?.rol !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admins pueden invitar usuarios' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const body = await req.json() as {
      accion?: 'crear' | 'reenviar'
      email: string
      rol?: 'residente' | 'tecnico' | 'admin'
      nombre?: string
      piso?: string
      departamento?: string
      empresa_tercero?: string
    }

    const { email, rol, nombre, piso, departamento, empresa_tercero } = body
    const accion = body.accion ?? 'crear'

    // El link del correo siempre apunta al dominio de producción para que el
    // invitado pueda abrirlo desde cualquier dispositivo. Configurable vía
    // `supabase secrets set SITE_URL=https://zity.site`.
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://zity.site'
    const redirectOrigin = siteUrl.replace(/\/$/, '')

    if (!email) {
      return new Response(JSON.stringify({ error: 'email es requerido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (accion === 'crear' && !rol) {
      return new Response(JSON.stringify({ error: 'rol es requerido para crear invitación' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (accion === 'reenviar') {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: { redirectTo: `${redirectOrigin}/activar` },
      })

      if (linkError) {
        return new Response(JSON.stringify({ error: linkError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      await supabaseAdmin
        .from('invitaciones')
        .update({
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          estado: 'pendiente',
        })
        .eq('email', email)

      await supabaseAdmin.from('audit_log').insert({
        usuario_id: callerUserId,
        accion: 'reenviar_invitacion',
        entidad: 'invitaciones',
        resultado: 'exitoso',
      })

      return new Response(JSON.stringify({ success: true, action_link: linkData?.properties?.action_link }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        nombre: nombre ?? '',
        rol,
        piso: piso ?? '',
        departamento: departamento ?? '',
        empresa_tercero: empresa_tercero ?? null,
      },
      redirectTo: `${redirectOrigin}/activar`,
    })

    if (inviteError) {
      if (inviteError.message.includes('already been registered') || inviteError.message.includes('already exists')) {
        return new Response(JSON.stringify({ error: 'Este correo ya está registrado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        })
      }
      throw new Error(inviteError.message)
    }

    const token_invitacion = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const { error: insertError } = await supabaseAdmin.from('invitaciones').insert({
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

    await supabaseAdmin.from('audit_log').insert({
      usuario_id: callerUserId,
      accion: 'crear_invitacion',
      entidad: 'invitaciones',
      resultado: 'exitoso',
    })

    return new Response(JSON.stringify({ success: true, token: token_invitacion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
