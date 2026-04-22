import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock del cliente Supabase
const mockFrom = vi.fn()
const mockFunctions = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    functions: {
      invoke: mockFunctions,
    },
  },
}))

describe('bloquear usuario — integración', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('actualiza estado_cuenta a bloqueado tras llamar a la edge function', async () => {
    mockFunctions.mockResolvedValueOnce({
      data: { success: true, estado: 'bloqueado' },
      error: null,
    })

    const { supabase } = await import('../../lib/supabase')
    const result = await supabase.functions.invoke('bloquear-cuenta', {
      body: { usuario_id: 'uuid-123', accion: 'bloquear' },
    })

    expect(result.error).toBeNull()
    expect(result.data.estado).toBe('bloqueado')
    expect(mockFunctions).toHaveBeenCalledWith('bloquear-cuenta', {
      body: { usuario_id: 'uuid-123', accion: 'bloquear' },
    })
  })

  it('actualiza estado_cuenta a activo al desbloquear', async () => {
    mockFunctions.mockResolvedValueOnce({
      data: { success: true, estado: 'activo' },
      error: null,
    })

    const { supabase } = await import('../../lib/supabase')
    const result = await supabase.functions.invoke('bloquear-cuenta', {
      body: { usuario_id: 'uuid-123', accion: 'desbloquear' },
    })

    expect(result.error).toBeNull()
    expect(result.data.estado).toBe('activo')
  })

  it('retorna error si la edge function falla', async () => {
    mockFunctions.mockResolvedValueOnce({
      data: null,
      error: { message: 'Error interno del servidor' },
    })

    const { supabase } = await import('../../lib/supabase')
    const result = await supabase.functions.invoke('bloquear-cuenta', {
      body: { usuario_id: 'uuid-invalido', accion: 'bloquear' },
    })

    expect(result.error).not.toBeNull()
    expect(result.error.message).toBe('Error interno del servidor')
  })
})
