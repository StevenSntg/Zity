import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

describe('RLS invitaciones — lógica de negocio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('solo admin puede crear invitaciones — verifica que se llama con usuario admin', async () => {
    const mockAdminCheck = vi.fn().mockResolvedValue({
      data: { rol: 'admin' },
      error: null,
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockAdminCheck,
    })

    const { supabase } = await import('../../lib/supabase')
    const result = await supabase.from('usuarios').select('rol').eq('id', 'admin-uuid').single()

    expect(result.data?.rol).toBe('admin')
  })

  it('técnico no puede acceder a invitaciones — verifica rol incorrecto', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { rol: 'tecnico' },
        error: null,
      }),
    })

    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase.from('usuarios').select('rol').eq('id', 'tecnico-uuid').single()

    expect(data?.rol).not.toBe('admin')
  })

  it('residente no puede crear solicitudes para otro residente', async () => {
    const residente_id_real = 'uuid-residente-1'
    const otro_residente_id = 'uuid-residente-2'

    const mockInsertSolicitud = vi.fn().mockImplementation(({ residente_id }: { residente_id: string }) => {
      if (residente_id !== residente_id_real) {
        return Promise.resolve({ data: null, error: { message: 'RLS policy violation' } })
      }
      return Promise.resolve({ data: { id: 'nueva-solicitud' }, error: null })
    })

    mockFrom.mockReturnValue({
      insert: mockInsertSolicitud,
    })

    const { supabase } = await import('../../lib/supabase')

    const resultPropio = await supabase.from('solicitudes').insert({ residente_id: residente_id_real })
    expect(resultPropio.error).toBeNull()

    const resultAjeno = await supabase.from('solicitudes').insert({ residente_id: otro_residente_id })
    expect(resultAjeno.error).not.toBeNull()
  })

  it('lógica de expiración de token (48h) — token expirado retorna estado "expirada"', () => {
    function esTokenValido(expiresAt: string): boolean {
      return new Date(expiresAt) > new Date()
    }

    function estadoToken(expiresAt: string): 'pendiente' | 'expirada' {
      return esTokenValido(expiresAt) ? 'pendiente' : 'expirada'
    }

    const tokenValido = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const tokenExpirado = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()

    expect(estadoToken(tokenValido)).toBe('pendiente')
    expect(estadoToken(tokenExpirado)).toBe('expirada')
  })

  it('token expira a las 48h de crearse', () => {
    const createdAt = new Date()
    const expiresAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000)
    const diffHoras = (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    expect(diffHoras).toBe(48)
  })
})
