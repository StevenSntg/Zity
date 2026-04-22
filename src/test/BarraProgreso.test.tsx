import { render, screen } from '@testing-library/react'
import BarraProgreso from '../components/BarraProgreso'

describe('BarraProgreso', () => {
  it('muestra "Paso 1 de 2" y barra al 50%', () => {
    render(<BarraProgreso pasoActual={1} totalPasos={2} />)
    expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument()
    const barra = screen.getByRole('progressbar')
    expect(barra).toHaveAttribute('aria-valuenow', '1')
    expect(barra).toHaveAttribute('aria-valuemax', '2')
  })

  it('muestra "Paso 2 de 2" y barra al 100%', () => {
    render(<BarraProgreso pasoActual={2} totalPasos={2} />)
    expect(screen.getByText('Paso 2 de 2')).toBeInTheDocument()
  })
})
