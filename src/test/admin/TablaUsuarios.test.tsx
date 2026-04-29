import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import TablaUsuarios from '../../components/admin/TablaUsuarios'
import type { Profile } from '../../types/database'

const mockUsuarios: Profile[] = [
  {
    id: '1',
    email: 'carlos@test.com',
    nombre: 'Carlos',
    apellido: 'Fuentes',
    telefono: '',
    rol: 'admin',
    piso: '',
    departamento: '',
    estado_cuenta: 'activo',
    empresa_tercero: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'ana@test.com',
    nombre: 'Ana',
    apellido: 'Torres',
    telefono: '',
    rol: 'tecnico',
    piso: '',
    departamento: '',
    estado_cuenta: 'activo',
    empresa_tercero: 'TecnoEdif SAC',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// El componente renderiza ambas vistas (mobile cards y desktop table) en el DOM
// y usa clases de Tailwind para mostrar solo una según breakpoint. En jsdom
// ambas coexisten, por eso usamos getAllBy* para los tests.

describe('TablaUsuarios', () => {
  it('renderiza nombre y email de usuarios', () => {
    render(
      <TablaUsuarios
        usuarios={mockUsuarios}
        loading={false}
        onBloquear={vi.fn()}
        onDesbloquear={vi.fn()}
        onActivar={vi.fn()}
        onReenviar={vi.fn()}
      />
    )
    expect(screen.getAllByText('Carlos Fuentes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('carlos@test.com').length).toBeGreaterThan(0)
  })

  it('muestra empresa_tercero solo para técnicos', () => {
    render(
      <TablaUsuarios
        usuarios={mockUsuarios}
        loading={false}
        onBloquear={vi.fn()}
        onDesbloquear={vi.fn()}
        onActivar={vi.fn()}
        onReenviar={vi.fn()}
      />
    )
    expect(screen.getAllByText('TecnoEdif SAC').length).toBeGreaterThan(0)
  })

  it('muestra spinner cuando loading es true', () => {
    render(
      <TablaUsuarios
        usuarios={[]}
        loading={true}
        onBloquear={vi.fn()}
        onDesbloquear={vi.fn()}
        onActivar={vi.fn()}
        onReenviar={vi.fn()}
      />
    )
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('llama onBloquear al hacer click en Bloquear', () => {
    const onBloquear = vi.fn()
    const [admin] = mockUsuarios
    if (!admin) throw new Error('mockUsuarios vacío')
    render(
      <TablaUsuarios
        usuarios={[admin]}
        loading={false}
        onBloquear={onBloquear}
        onDesbloquear={vi.fn()}
        onActivar={vi.fn()}
        onReenviar={vi.fn()}
      />
    )
    const botones = screen.getAllByRole('button', { name: /bloquear/i })
    expect(botones.length).toBeGreaterThan(0)
    const primerBoton = botones[0]
    if (!primerBoton) throw new Error('No se encontró el botón')
    fireEvent.click(primerBoton)
    expect(onBloquear).toHaveBeenCalledWith(admin)
  })
})
