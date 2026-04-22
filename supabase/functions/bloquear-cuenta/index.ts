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
      return new Response(JSON.stringify({ error: 'Solo admins pueden realizar esta acción' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const { usuario_id, accion } = await req.json() as {
      usuario_id: string
      accion: 'bloquear' | 'desbloquear'
    }

    if (!usuario_id || !['bloquear', 'desbloquear'].includes(accion)) {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Un admin no puede bloquearse a sí mismo (quedaría sin acceso al panel).
    if (accion === 'bloquear' && callerUserId === usuario_id) {
      return new Response(JSON.stringify({ error: 'No puedes bloquear tu propia cuenta' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const nuevoEstado = accion === 'bloquear' ? 'bloqueado' : 'activo'

    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ estado_cuenta: nuevoEstado })
      .eq('id', usuario_id)

    if (updateError) throw new Error(updateError.message)

    if (accion === 'bloquear') {
      await supabaseAdmin.auth.admin.updateUserById(usuario_id, {
        ban_duration: '87600h',
      })
    } else {
      await supabaseAdmin.auth.admin.updateUserById(usuario_id, {
        ban_duration: 'none',
      })
    }

    await supabaseAdmin.from('audit_log').insert({
      usuario_id: callerUserId,
      accion: accion === 'bloquear' ? 'bloquear_cuenta' : 'desbloquear_cuenta',
      entidad: 'usuarios',
      entidad_id: usuario_id,
      resultado: 'exitoso',
    })

    return new Response(JSON.stringify({ success: true, estado: nuevoEstado }), {
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
