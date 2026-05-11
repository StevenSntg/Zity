import { describe, it, expect } from 'vitest'
import {
  validarImagen,
  pathFotoSolicitud,
  categoriasParaTipo,
  labelTipo,
  labelCategoria,
  IMAGEN_MAX_BYTES,
  DESCRIPCION_MAX,
} from '../../lib/solicitudes'

describe('validarImagen', () => {
  it('acepta JPEG dentro del límite de 5 MB', () => {
    const file = new File(['x'.repeat(1024)], 'foto.jpg', { type: 'image/jpeg' })
    expect(validarImagen(file).ok).toBe(true)
  })

  it('acepta PNG dentro del límite de 5 MB', () => {
    const file = new File(['x'.repeat(1024)], 'foto.png', { type: 'image/png' })
    expect(validarImagen(file).ok).toBe(true)
  })

  it('rechaza PDF u otros MIME no permitidos', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    const v = validarImagen(file)
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.mensaje).toMatch(/JPEG|PNG/)
  })

  it('rechaza HEIC explicitamente (PBI emergente para Sprint 7)', () => {
    const file = new File(['x'], 'foto.heic', { type: 'image/heic' })
    const v = validarImagen(file)
    expect(v.ok).toBe(false)
  })

  it('rechaza archivos mayores a 5 MB', () => {
    const big = new File([new Uint8Array(IMAGEN_MAX_BYTES + 1)], 'big.jpg', { type: 'image/jpeg' })
    const v = validarImagen(big)
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.mensaje).toMatch(/5 MB/)
  })

  it('acepta exactamente en el límite (5 MB)', () => {
    const exact = new File([new Uint8Array(IMAGEN_MAX_BYTES)], 'exact.jpg', { type: 'image/jpeg' })
    expect(validarImagen(exact).ok).toBe(true)
  })
})

describe('pathFotoSolicitud', () => {
  it('genera path con formato {residente_id}/{solicitud_id}/{timestamp}_{nombre}', () => {
    const file = new File(['x'], 'gotera baño.jpg', { type: 'image/jpeg' })
    const path = pathFotoSolicitud('res-uuid', 'sol-uuid', file)

    const partes = path.split('/')
    expect(partes[0]).toBe('res-uuid')
    expect(partes[1]).toBe('sol-uuid')
    expect(partes[2]).toMatch(/^\d+_.+\.jpg$/)
  })

  it('limpia caracteres no seguros del nombre original', () => {
    const file = new File(['x'], 'Foto Año 2024 (final).png', { type: 'image/png' })
    const path = pathFotoSolicitud('res', 'sol', file)
    // No debe haber espacios, paréntesis ni mayúsculas en la parte limpia.
    const ultimo = path.split('/').pop() ?? ''
    expect(ultimo).not.toMatch(/\s/)
    expect(ultimo).not.toMatch(/[()]/)
    expect(ultimo).toBe(ultimo.toLowerCase())
  })

  it('residente_id va siempre primero (las storage policies dependen de esto)', () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    const path = pathFotoSolicitud('USR-X', 'SOL-Y', file)
    expect(path.startsWith('USR-X/')).toBe(true)
  })
})

describe('categoriasParaTipo', () => {
  it('mantenimiento ofrece todas las categorías', () => {
    const cats = categoriasParaTipo('mantenimiento').map(c => c.value)
    expect(cats).toContain('plomeria')
    expect(cats).toContain('seguridad')
    expect(cats).toContain('areas_comunes')
  })

  it('sugerencia limita las categorías razonables', () => {
    const cats = categoriasParaTipo('sugerencia').map(c => c.value)
    expect(cats).toEqual(expect.arrayContaining(['areas_comunes', 'otro']))
    expect(cats).not.toContain('plomeria')
  })

  it('"otro" como tipo siempre incluye al menos "otro" como categoría', () => {
    const cats = categoriasParaTipo('otro').map(c => c.value)
    expect(cats).toContain('otro')
  })
})

describe('DESCRIPCION_MAX', () => {
  it('expone el límite de 300 caracteres alineado con el criterio HU-MANT-01', () => {
    expect(DESCRIPCION_MAX).toBe(300)
  })
})

describe('labelTipo y labelCategoria', () => {
  it('labelTipo devuelve la etiqueta humana de un tipo válido', () => {
    expect(labelTipo('mantenimiento')).toBe('Mantenimiento')
    expect(labelTipo('reparacion')).toBe('Reparación')
    expect(labelTipo('queja')).toBe('Queja')
  })

  it('labelTipo devuelve el value tal cual si no está en el catálogo (fallback)', () => {
    // Caso defensivo: si la BD añade un valor que el frontend aún no conoce,
    // no rompemos la UI. Devolvemos el value crudo.
    expect(labelTipo('desconocido' as never)).toBe('desconocido')
  })

  it('labelCategoria devuelve la etiqueta humana de una categoría válida', () => {
    expect(labelCategoria('plomeria')).toBe('Plomería')
    expect(labelCategoria('areas_comunes')).toBe('Áreas comunes')
  })

  it('labelCategoria devuelve el value tal cual si no está en el catálogo', () => {
    expect(labelCategoria('inexistente' as never)).toBe('inexistente')
  })
})
