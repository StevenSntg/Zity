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

    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser } } = await supabaseAdmin.auth.getUser(token)

    if (!callerUser) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('usuarios')
      .select('rol')
      .eq('id', callerUser.id)
      .single()

    if (callerProfile?.rol !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admins pueden invitar usuarios' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const { email, rol, nombre, piso, departamento, empresa_tercero } = await req.json() as {
      email: string
      rol: 'residente' | 'tecnico' | 'admin'
      nombre?: string
      piso?: string
      departamento?: string
      empresa_tercero?: string
    }

    if (!email || !rol) {
      return new Response(JSON.stringify({ error: 'email y rol son requeridos' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // SITE_URL tiene prioridad (configurado vía `supabase secrets set SITE_URL=https://zity.site`).
    // Así las invitaciones siempre apuntan al dominio de producción, sin importar desde dónde
    // el admin dispare la acción.
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://zity.site'
    const redirectOrigin = siteUrl.replace(/\/$/, '')

    // Supabase Auth crea el usuario pre-invitado y manda el email vía su SMTP integrado.
    // El link del email lleva al usuario a /activar donde establece su contraseña.
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

    // Registro en tabla invitaciones para tracking en panel admin.
    const token_invitacion = crypto.randomUUID()
    const { error: insertError } = await supabaseAdmin.from('invitaciones').insert({
      email,
      rol,
      nombre: nombre ?? null,
      piso: piso ?? null,
      departamento: departamento ?? null,
      token: token_invitacion,
      creada_por: callerUser.id,
    })

    if (insertError) throw new Error(insertError.message)

    await supabaseAdmin.from('audit_log').insert({
      usuario_id: callerUser.id,
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
