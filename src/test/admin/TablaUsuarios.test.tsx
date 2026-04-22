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

describe('TablaUsuarios', () => {
  it('renderiza nombre y email de usuarios', () => {
    render(
      <TablaUsuarios
        usuarios={mockUsuarios}
        loading={false}
        onBloquear={vi.fn()}
        onDesbloquear={vi.fn()}
      />
    )
    expect(screen.getByText('Carlos Fuentes')).toBeInTheDocument()
    expect(screen.getByText('carlos@test.com')).toBeInTheDocument()
  })

  it('muestra empresa_tercero solo para técnicos', () => {
    render(
      <TablaUsuarios
        usuarios={mockUsuarios}
        loading={false}
        onBloquear={vi.fn()}
        onDesbloquear={vi.fn()}
      />
    )
    expect(screen.getByText('TecnoEdif SAC')).toBeInTheDocument()
  })

  it('muestra spinner cuando loading es true', () => {
    render(
      <TablaUsuarios
        usuarios={[]}
        loading={true}
        onBloquear={vi.fn()}
        onDesbloquear={vi.fn()}
      />
    )
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('llama onBloquear al hacer click en Bloquear', () => {
    const onBloquear = vi.fn()
    render(
      <TablaUsuarios
        usuarios={[mockUsuarios[0]]}
        loading={false}
        onBloquear={onBloquear}
        onDesbloquear={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /bloquear/i }))
    expect(onBloquear).toHaveBeenCalledWith(mockUsuarios[0])
  })
})
