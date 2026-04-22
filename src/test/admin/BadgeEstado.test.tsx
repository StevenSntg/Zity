import { render, screen } from '@testing-library/react'
import BadgeEstado from '../../components/admin/BadgeEstado'

describe('BadgeEstado', () => {
  it('muestra badge para estado activo', () => {
    render(<BadgeEstado estado="activo" />)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('muestra badge para estado pendiente', () => {
    render(<BadgeEstado estado="pendiente" />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('muestra badge para estado bloqueado', () => {
    render(<BadgeEstado estado="bloqueado" />)
    expect(screen.getByText('Bloqueado')).toBeInTheDocument()
  })
})
