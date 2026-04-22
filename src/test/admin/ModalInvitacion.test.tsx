import { render, screen, fireEvent } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import ModalInvitacion from '../../components/admin/ModalInvitacion'

const mockEnviarInvitacion = vi.fn().mockResolvedValue(true)

vi.mock('../../hooks/useInvitacion', () => ({
  useInvitacion: () => ({
    enviarInvitacion: mockEnviarInvitacion,
    cargando: false,
    error: null,
  }),
}))

describe('ModalInvitacion', () => {
  const onEnviado = vi.fn()
  const onCerrar = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra los campos requeridos', () => {
    render(<ModalInvitacion onEnviado={onEnviado} onCerrar={onCerrar} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rol/i)).toBeInTheDocument()
  })

  it('muestra campo empresa_tercero solo cuando rol es técnico', () => {
    render(<ModalInvitacion onEnviado={onEnviado} onCerrar={onCerrar} />)
    expect(screen.queryByLabelText(/empresa/i)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/rol/i), { target: { value: 'tecnico' } })
    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument()
  })

  it('muestra error de validación si email está vacío', async () => {
    render(<ModalInvitacion onEnviado={onEnviado} onCerrar={onCerrar} />)
    fireEvent.click(screen.getByRole('button', { name: /enviar invitación/i }))
    expect(await screen.findByText(/email.*requerido/i)).toBeInTheDocument()
  })

  it('muestra error si email tiene formato inválido', () => {
    render(<ModalInvitacion onEnviado={onEnviado} onCerrar={onCerrar} />)

    // Establecer nombre válido y email inválido
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid' } })
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Test' } })

    // Click en submit
    fireEvent.click(screen.getByRole('button', { name: /enviar invitación/i }))

    // Verificar que NO se llamó a enviarInvitacion por errores de validación
    expect(mockEnviarInvitacion).not.toHaveBeenCalled()
  })
})
