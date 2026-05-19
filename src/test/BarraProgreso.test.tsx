import { render, screen } from '@testing-library/react'
import BarraProgreso from '../components/BarraProgreso'

describe('BarraProgreso', () => {
  it('muestra "Paso 1 de 2" y barra al 50%', () => {
    render(<BarraProgreso pasoActual={1} totalPasos={2} />)
    expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument()
    const barra = screen.getByRole('progressbar')
    expect(barra).toHaveAttribute('aria-valuenow', '50')
    expect(barra).toHaveAttribute('aria-valuemin', '0')
    expect(barra).toHaveAttribute('aria-valuemax', '100')
    expect(barra).toHaveAttribute('aria-valuetext', 'Paso 1 de 2')
  })

  it('muestra "Paso 2 de 2" y barra al 100%', () => {
    render(<BarraProgreso pasoActual={2} totalPasos={2} />)
    expect(screen.getByText('Paso 2 de 2')).toBeInTheDocument()
    const barra = screen.getByRole('progressbar')
    expect(barra).toHaveAttribute('aria-valuenow', '100')
  })
})
