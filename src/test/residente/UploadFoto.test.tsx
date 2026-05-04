import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import UploadFoto from '../../components/residente/UploadFoto'

// ─── Helpers ─────────────────────────────────────────────────────────────────

// HU-MANT-06 SPRINT-4 — Mock de matchMedia para simular viewport
function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
}

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
  // Sin mock de matchMedia → isMobile = false (desktop, comportamiento original)
  // Los tests que necesitan móvil llaman mockMatchMedia(true) explícitamente.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
})

// ─── Tests originales (deben seguir pasando sin cambios) ─────────────────────

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

  // ─── Tests nuevos HU-MANT-06 ───────────────────────────────────────────────

  it('HU-MANT-06: en desktop (matchMedia=false) NO muestra el botón Tomar foto', () => {
    // matchMedia ya mockeado como matches:false en beforeEach
    render(<UploadFoto archivo={null} onCambio={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /tomar foto/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /elegir archivo/i })).toBeInTheDocument()
  })

  it('HU-MANT-06: en móvil (matchMedia=true) muestra el botón Tomar foto como CTA principal', () => {
    mockMatchMedia(true)
    render(<UploadFoto archivo={null} onCambio={vi.fn()} />)
    expect(screen.getByRole('button', { name: /tomar foto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /elegir archivo/i })).toBeInTheDocument()
  })

  it('HU-MANT-06: el input de cámara tiene atributo capture=environment', () => {
    render(<UploadFoto archivo={null} onCambio={vi.fn()} />)
    const inputCamara = screen.getByLabelText('Tomar foto con cámara') as HTMLInputElement
    expect(inputCamara).toHaveAttribute('capture', 'environment')
  })

  it('HU-MANT-06: foto tomada desde cámara pasa la misma validación (JPEG válido)', () => {
    const onCambio = vi.fn()
    render(<UploadFoto archivo={null} onCambio={onCambio} />)

    const inputCamara = screen.getByLabelText('Tomar foto con cámara') as HTMLInputElement
    const foto = new File(['x'], 'camara.jpg', { type: 'image/jpeg' })
    fireEvent.change(inputCamara, { target: { files: [foto] } })

    expect(onCambio).toHaveBeenCalledWith(foto)
  })

  it('HU-MANT-06: foto de cámara mayor a 5 MB es rechazada con mensaje claro', () => {
    const onCambio = vi.fn()
    render(<UploadFoto archivo={null} onCambio={onCambio} />)

    const inputCamara = screen.getByLabelText('Tomar foto con cámara') as HTMLInputElement
    const pesada = new File([new Uint8Array(6 * 1024 * 1024)], 'big-cam.jpg', { type: 'image/jpeg' })
    fireEvent.change(inputCamara, { target: { files: [pesada] } })

    expect(onCambio).toHaveBeenCalledWith(null)
    expect(screen.getByRole('alert').textContent).toMatch(/5 MB/)
  })

  it('HU-MANT-06: foto de cámara con formato inválido es rechazada', () => {
    const onCambio = vi.fn()
    render(<UploadFoto archivo={null} onCambio={onCambio} />)

    const inputCamara = screen.getByLabelText('Tomar foto con cámara') as HTMLInputElement
    const invalid = new File(['x'], 'video.mp4', { type: 'video/mp4' })
    fireEvent.change(inputCamara, { target: { files: [invalid] } })

    expect(onCambio).toHaveBeenCalledWith(null)
    expect(screen.getByRole('alert').textContent).toMatch(/JPEG|PNG/)
  })
})
