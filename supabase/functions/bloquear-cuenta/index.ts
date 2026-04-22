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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Obtener admin_id del JWT de la request
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser } } = await supabaseAdmin.auth.getUser(token)

    if (!callerUser) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Verificar que quien llama es admin
    const { data: callerProfile } = await supabaseAdmin
      .from('usuarios')
      .select('rol')
      .eq('id', callerUser.id)
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

    const nuevoEstado = accion === 'bloquear' ? 'bloqueado' : 'activo'

    // 1. Actualizar estado_cuenta en tabla usuarios
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ estado_cuenta: nuevoEstado })
      .eq('id', usuario_id)

    if (updateError) throw new Error(updateError.message)

    // 2. Si bloquea: invalidar sesión activa vía ban_duration (reversible)
    if (accion === 'bloquear') {
      await supabaseAdmin.auth.admin.updateUserById(usuario_id, {
        ban_duration: '87600h',
      })
    } else {
      await supabaseAdmin.auth.admin.updateUserById(usuario_id, {
        ban_duration: 'none',
      })
    }

    // 3. Registrar en audit_log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: callerUser.id,
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
