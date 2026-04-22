import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS = [
  {
    email: 'carlos@zity-demo.com',
    password: 'Admin1234!',
    metadata: { nombre: 'Carlos', apellido: 'Fuentes', rol: 'admin', piso: '', departamento: '', telefono: '' },
  },
  {
    email: 'laura@zity-demo.com',
    password: 'Residente1!',
    metadata: { nombre: 'Laura', apellido: 'Vega', rol: 'residente', piso: '4', departamento: 'B', telefono: '+51 999 000 001' },
  },
  {
    email: 'pedro@zity-demo.com',
    password: 'Residente2!',
    metadata: { nombre: 'Pedro', apellido: 'Ramos', rol: 'residente', piso: '2', departamento: 'A', telefono: '+51 999 000 002' },
  },
  {
    email: 'mario@zity-demo.com',
    password: 'Tecnico1234!',
    metadata: { nombre: 'Mario', apellido: 'Peña', rol: 'tecnico', piso: '', departamento: '', telefono: '+51 999 000 003' },
  },
  {
    email: 'ana@zity-demo.com',
    password: 'Tecnico5678!',
    metadata: { nombre: 'Ana', apellido: 'Torres', rol: 'tecnico', piso: '', departamento: '', telefono: '+51 999 000 004', empresa_tercero: 'TecnoEdif SAC' },
  },
  {
    email: 'julia@zity-demo.com',
    password: 'Residente3!',
    metadata: { nombre: 'Julia', apellido: 'Romero', rol: 'residente', piso: '5', departamento: 'C', telefono: '+51 999 000 005' },
  },
]

async function cleanDb() {
  console.log('Limpiando BD...')
  await supabase.from('audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('invitaciones').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('historial_estados').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('asignaciones').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('solicitudes').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { data: authUsers } = await supabase.auth.admin.listUsers()
  for (const u of authUsers?.users ?? []) {
    if (USERS.some(seed => seed.email === u.email)) {
      await supabase.auth.admin.deleteUser(u.id)
    }
  }

  const demoEmails = USERS.map(u => u.email)
  await supabase.from('usuarios').delete().in('email', demoEmails)
  console.log('BD limpia.')
}

async function seedUsers() {
  console.log('Insertando usuarios...')
  const createdIds = {}

  for (const user of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.metadata,
    })

    if (error) {
      console.error(`Error creando ${user.email}:`, error.message)
      continue
    }

    const userId = data.user.id
    createdIds[user.email] = userId

    const profileData = {
      id: userId,
      email: user.email,
      nombre: user.metadata.nombre,
      apellido: user.metadata.apellido,
      telefono: user.metadata.telefono,
      rol: user.metadata.rol,
      piso: user.metadata.piso,
      departamento: user.metadata.departamento,
      estado_cuenta: 'activo',
      empresa_tercero: user.metadata.empresa_tercero ?? null,
    }

    const { error: profileError } = await supabase.from('usuarios').upsert(profileData)
    if (profileError) {
      console.error(`Error insertando perfil ${user.email}:`, profileError.message)
    } else {
      console.log(`  ✓ ${user.email} (${user.metadata.rol})`)
    }
  }

  return createdIds
}

async function seedInvitacion(adminId) {
  console.log('Insertando invitación pendiente (hace 3 días)...')
  const tresDiasAtras = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const expiresAt = new Date(Date.now() + 45 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('invitaciones').insert({
    email: 'nuevo.residente@ejemplo.com',
    rol: 'residente',
    nombre: 'Nuevo Residente',
    piso: '3',
    departamento: 'C',
    token: randomUUID(),
    estado: 'pendiente',
    creada_por: adminId,
    expires_at: expiresAt,
    created_at: tresDiasAtras,
  })

  if (error) {
    console.error('Error insertando invitación:', error.message)
  } else {
    console.log('  ✓ Invitación pendiente (hace 3 días)')
  }
}

async function main() {
  // `--clean` borra los datos demo antes de insertar (uso recomendado en
  // staging después de pruebas manuales). Sin la bandera el seed es
  // idempotente gracias al upsert por id.
  if (process.argv.includes('--clean')) {
    await cleanDb()
  }
  const ids = await seedUsers()
  const adminId = ids['carlos@zity-demo.com']
  if (adminId) await seedInvitacion(adminId)
  console.log('\n✅ Seed completado.')
}

main().catch(console.error)
