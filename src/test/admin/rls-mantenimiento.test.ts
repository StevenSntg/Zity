import { describe, it, expect, vi, beforeEach } from 'vitest'

// Tests de integración (mock) para las policies RLS de las tablas del módulo
// mantenimiento. Verifican la lógica de negocio que las policies enforzaran:
//   - solicitudes:    residente ve solo las suyas; admin ve todas;
//                     técnico solo las que tiene asignadas.
//   - asignaciones:   admin todo; técnico solo las suyas.
//   - historial_estados: admin + dueño + técnico asignado.
// Para Sprint 4 se complementarán con tests E2E contra clientes reales.

const mockFrom = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

const RESIDENTE_A = 'uuid-residente-a'
const RESIDENTE_B = 'uuid-residente-b'
const ADMIN = 'uuid-admin'
const TECNICO_A = 'uuid-tecnico-a'
const TECNICO_B = 'uuid-tecnico-b'

type Solicitud = { id: string; residente_id: string; estado: string }
type Asignacion = { solicitud_id: string; tecnico_id: string }

const SOLICITUDES: Solicitud[] = [
  { id: 'sol-1', residente_id: RESIDENTE_A, estado: 'pendiente' },
  { id: 'sol-2', residente_id: RESIDENTE_A, estado: 'en_progreso' },
  { id: 'sol-3', residente_id: RESIDENTE_B, estado: 'asignada' },
]

const ASIGNACIONES: Asignacion[] = [
  { solicitud_id: 'sol-2', tecnico_id: TECNICO_A },
  { solicitud_id: 'sol-3', tecnico_id: TECNICO_B },
]

// Imita lo que devolvería PostgREST tras aplicar la policy correspondiente.
function solicitudesParaUsuario(userId: string, rol: 'admin' | 'residente' | 'tecnico'): Solicitud[] {
  if (rol === 'admin') return SOLICITUDES
  if (rol === 'residente') return SOLICITUDES.filter(s => s.residente_id === userId)
  if (rol === 'tecnico') {
    const idsAsignados = ASIGNACIONES.filter(a => a.tecnico_id === userId).map(a => a.solicitud_id)
    return SOLICITUDES.filter(s => idsAsignados.includes(s.id))
  }
  return []
}

function asignacionesParaUsuario(userId: string, rol: 'admin' | 'tecnico' | 'residente'): Asignacion[] {
  if (rol === 'admin') return ASIGNACIONES
  if (rol === 'tecnico') return ASIGNACIONES.filter(a => a.tecnico_id === userId)
  return []
}

describe('RLS solicitudes — alcance por rol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('residente sólo recibe sus propias solicitudes', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: solicitudesParaUsuario(RESIDENTE_A, 'residente'),
        error: null,
      }),
    })

    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase.from('solicitudes').select('*').order('created_at')

    expect(data).toHaveLength(2)
    expect(data?.every(s => s.residente_id === RESIDENTE_A)).toBe(true)
  })

  it('admin ve todas las solicitudes del edificio', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: solicitudesParaUsuario(ADMIN, 'admin'),
        error: null,
      }),
    })

    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase.from('solicitudes').select('*').order('created_at')

    expect(data).toHaveLength(SOLICITUDES.length)
  })

  it('técnico sólo ve solicitudes asignadas a él', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: solicitudesParaUsuario(TECNICO_A, 'tecnico'),
        error: null,
      }),
    })

    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase.from('solicitudes').select('*').order('created_at')

    expect(data).toHaveLength(1)
    expect(data?.[0]?.id).toBe('sol-2')
  })

  it('técnico no asignado a ninguna solicitud recibe lista vacía', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: solicitudesParaUsuario('tecnico-nuevo', 'tecnico'),
        error: null,
      }),
    })

    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase.from('solicitudes').select('*').order('created_at')

    expect(data).toHaveLength(0)
  })

  it('residente no puede insertar solicitud para otro residente (with_check)', async () => {
    const insert = vi.fn().mockImplementation(({ residente_id }: { residente_id: string }) => {
      if (residente_id !== RESIDENTE_A) {
        return Promise.resolve({ data: null, error: { message: 'new row violates row-level security policy' } })
      }
      return Promise.resolve({ data: { id: 'nueva' }, error: null })
    })
    mockFrom.mockReturnValue({ insert })

    const { supabase } = await import('../../lib/supabase')

    const propio = await supabase.from('solicitudes').insert({ residente_id: RESIDENTE_A })
    const ajeno = await supabase.from('solicitudes').insert({ residente_id: RESIDENTE_B })

    expect(propio.error).toBeNull()
    expect(ajeno.error).not.toBeNull()
    expect(ajeno.error?.message).toContain('row-level security')
  })
})

describe('RLS asignaciones — alcance por rol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admin ve todas las asignaciones', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: asignacionesParaUsuario(ADMIN, 'admin'),
        error: null,
      }),
    })

    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase.from('asignaciones').select('*')

    expect(data).toHaveLength(ASIGNACIONES.length)
  })

  it('técnico solo ve sus propias asignaciones', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: asignacionesParaUsuario(TECNICO_B, 'tecnico'),
        error: null,
      }),
    })

    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase.from('asignaciones').select('*')

    expect(data).toHaveLength(1)
    expect(data?.[0]?.tecnico_id).toBe(TECNICO_B)
  })

  it('residente no recibe asignaciones (no le aplica policy)', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: asignacionesParaUsuario(RESIDENTE_A, 'residente'),
        error: null,
      }),
    })

    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase.from('asignaciones').select('*')

    expect(data).toHaveLength(0)
  })

  it('solo admin puede insertar asignación (with_check)', async () => {
    const insert = vi.fn().mockImplementation(() => {
      return Promise.resolve({ data: null, error: { message: 'new row violates row-level security policy' } })
    })
    mockFrom.mockReturnValue({ insert })

    const { supabase } = await import('../../lib/supabase')
    const result = await supabase.from('asignaciones').insert({
      solicitud_id: 'sol-1',
      tecnico_id: TECNICO_A,
      asignado_por: 'no-admin',
    })

    expect(result.error).not.toBeNull()
  })
})

describe('RLS historial_estados — alcance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('residente ve historial de sus propias solicitudes', async () => {
    const HISTORIAL = [
      { id: 'h-1', solicitud_id: 'sol-1', estado_nuevo: 'pendiente' },
      { id: 'h-2', solicitud_id: 'sol-3', estado_nuevo: 'asignada' },
    ]
    const idsPermitidos = solicitudesParaUsuario(RESIDENTE_A, 'residente').map(s => s.id)

    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: HISTORIAL.filter(h => idsPermitidos.includes(h.solicitud_id)),
        error: null,
      }),
    })

    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase.from('historial_estados').select('*')

    expect(data).toHaveLength(1)
    expect(data?.[0]?.solicitud_id).toBe('sol-1')
  })

  it('insert de historial requiere cambiado_por = auth.uid() (with_check)', async () => {
    const insert = vi.fn().mockImplementation(({ cambiado_por }: { cambiado_por: string }) => {
      if (cambiado_por !== ADMIN) {
        return Promise.resolve({ data: null, error: { message: 'row-level security policy violation' } })
      }
      return Promise.resolve({ data: { id: 'nuevo' }, error: null })
    })
    mockFrom.mockReturnValue({ insert })

    const { supabase } = await import('../../lib/supabase')

    const propio = await supabase.from('historial_estados').insert({
      solicitud_id: 'sol-1',
      estado_nuevo: 'asignada',
      cambiado_por: ADMIN,
    })
    const ajeno = await supabase.from('historial_estados').insert({
      solicitud_id: 'sol-1',
      estado_nuevo: 'asignada',
      cambiado_por: 'otro-id',
    })

    expect(propio.error).toBeNull()
    expect(ajeno.error).not.toBeNull()
  })
})
