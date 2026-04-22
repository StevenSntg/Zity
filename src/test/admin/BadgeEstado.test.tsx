import { render, screen } from '@testing-library/react'
import BadgeEstado from '../../components/admin/BadgeEstado'

describe('BadgeEstado', () => {
  it('muestra badge verde para activo', () => {
    render(<BadgeEstado estado="activo" />)
    const badge = screen.getByText('activo')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('text-success')
  })

  it('muestra badge amarillo para pendiente', () => {
    render(<BadgeEstado estado="pendiente" />)
    const badge = screen.getByText('pendiente')
    expect(badge.className).toContain('text-warning')
  })

  it('muestra badge rojo para bloqueado', () => {
    render(<BadgeEstado estado="bloqueado" />)
    const badge = screen.getByText('bloqueado')
    expect(badge.className).toContain('text-error')
  })
})
