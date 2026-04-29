import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import UploadFoto from '../../components/residente/UploadFoto'

beforeEach(() => {
  // jsdom no implementa createObjectURL; lo polificamos para evitar errores
  // al mostrar la preview.
  if (!URL.createObjectURL) {
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:mock'),
      writable: true,
    })
  }
  if (!URL.revokeObjectURL) {
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      writable: true,
    })
  }
})

describe('UploadFoto', () => {
  it('muestra el placeholder cuando no hay archivo', () => {
    render(<UploadFoto archivo={null} onCambio={vi.fn()} />)
    expect(screen.getByText(/Subir foto del problema/i)).toBeInTheDocument()
    expect(screen.getByText(/JPEG.*PNG.*5 MB/)).toBeInTheDocument()
  })

  it('rechaza un archivo PDF mostrando mensaje de validación', () => {
    const onCambio = vi.fn()
    render(<UploadFoto archivo={null} onCambio={onCambio} />)

    const input = screen.getByLabelText('Subir foto del problema') as HTMLInputElement
    const pdf = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [pdf] } })

    expect(onCambio).toHaveBeenCalledWith(null)
    const alerta = screen.getByRole('alert')
    expect(alerta.textContent).toMatch(/JPEG|PNG/)
  })

  it('rechaza archivos mayores a 5 MB con mensaje claro', () => {
    const onCambio = vi.fn()
    render(<UploadFoto archivo={null} onCambio={onCambio} />)

    const input = screen.getByLabelText('Subir foto del problema') as HTMLInputElement
    const pesado = new File([new Uint8Array(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [pesado] } })

    expect(onCambio).toHaveBeenCalledWith(null)
    expect(screen.getByRole('alert').textContent).toMatch(/5 MB/)
  })

  it('acepta JPEG válido y propaga el File al padre', () => {
    const onCambio = vi.fn()
    render(<UploadFoto archivo={null} onCambio={onCambio} />)

    const input = screen.getByLabelText('Subir foto del problema') as HTMLInputElement
    const ok = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [ok] } })

    expect(onCambio).toHaveBeenCalledTimes(1)
    expect(onCambio).toHaveBeenCalledWith(ok)
  })

  it('renderiza preview e info del archivo cuando se pasa archivo válido', () => {
    const archivo = new File(['x'], 'gotera.jpg', { type: 'image/jpeg' })
    render(<UploadFoto archivo={archivo} onCambio={vi.fn()} />)

    expect(screen.getByAltText(/Vista previa de la foto del problema/i)).toBeInTheDocument()
    expect(screen.getByText('gotera.jpg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quitar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cambiar/i })).toBeInTheDocument()
  })

  it('llama onCambio(null) al pulsar Quitar', () => {
    const onCambio = vi.fn()
    const archivo = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    render(<UploadFoto archivo={archivo} onCambio={onCambio} />)

    fireEvent.click(screen.getByRole('button', { name: /quitar/i }))
    expect(onCambio).toHaveBeenCalledWith(null)
  })

  it('disabled bloquea los botones de cambio/quitar', () => {
    const archivo = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    render(<UploadFoto archivo={archivo} onCambio={vi.fn()} disabled />)

    expect(screen.getByRole('button', { name: /quitar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cambiar/i })).toBeDisabled()
  })
})
