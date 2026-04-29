import type { TipoSolicitud, CategoriaSolicitud } from '../types/database'

// Catálogo de tipos y categorías compartido entre formulario y filtros del admin.
// Si se cambia, actualizar los CHECK constraints en la BD para mantenerlos
// alineados con el dominio de valores aquí.

export const TIPOS_SOLICITUD: Array<{ value: TipoSolicitud; label: string }> = [
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'reparacion', label: 'Reparación' },
  { value: 'queja', label: 'Queja' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'otro', label: 'Otro' },
]

export const CATEGORIAS_SOLICITUD: Array<{ value: CategoriaSolicitud; label: string }> = [
  { value: 'plomeria', label: 'Plomería' },
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'areas_comunes', label: 'Áreas comunes' },
  { value: 'otro', label: 'Otro' },
]

// Categorías filtradas por tipo: el formulario rehúsa la lista al cambiar el
// tipo para que sólo se ofrezcan combinaciones razonables. La BD acepta
// cualquier (tipo, categoría) válida individualmente.
const CATEGORIAS_POR_TIPO: Record<TipoSolicitud, CategoriaSolicitud[]> = {
  mantenimiento: ['plomeria', 'electricidad', 'limpieza', 'seguridad', 'areas_comunes', 'otro'],
  reparacion: ['plomeria', 'electricidad', 'areas_comunes', 'otro'],
  queja: ['limpieza', 'seguridad', 'areas_comunes', 'otro'],
  sugerencia: ['areas_comunes', 'otro'],
  otro: ['otro'],
}

export function categoriasParaTipo(tipo: TipoSolicitud): Array<{ value: CategoriaSolicitud; label: string }> {
  const valoresPermitidos = CATEGORIAS_POR_TIPO[tipo]
  return CATEGORIAS_SOLICITUD.filter(c => valoresPermitidos.includes(c.value))
}

export function labelTipo(tipo: TipoSolicitud): string {
  return TIPOS_SOLICITUD.find(t => t.value === tipo)?.label ?? tipo
}

export function labelCategoria(categoria: CategoriaSolicitud): string {
  return CATEGORIAS_SOLICITUD.find(c => c.value === categoria)?.label ?? categoria
}

export const PRIORIDADES = ['normal', 'urgente'] as const
export type Prioridad = (typeof PRIORIDADES)[number]

export const ESTADOS = ['pendiente', 'asignada', 'en_progreso', 'resuelta', 'cerrada'] as const

export const DESCRIPCION_MAX = 300
export const IMAGEN_MAX_BYTES = 5 * 1024 * 1024
export const IMAGEN_MIME_PERMITIDOS = ['image/jpeg', 'image/png']
export const BUCKET_FOTOS = 'solicitudes-fotos'

export type ValidacionImagen = { ok: true } | { ok: false; mensaje: string }

export function validarImagen(file: File): ValidacionImagen {
  if (!IMAGEN_MIME_PERMITIDOS.includes(file.type)) {
    return { ok: false, mensaje: 'Formato no soportado. Usa JPEG o PNG.' }
  }
  if (file.size > IMAGEN_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    return { ok: false, mensaje: `La imagen pesa ${mb} MB. Máximo permitido: 5 MB.` }
  }
  return { ok: true }
}

// Construye el path de almacenamiento determinístico: residente/solicitud/timestamp_nombre.
// El primer segmento (residente) es lo que las storage policies validan contra
// auth.uid() para evitar que un residente suba a la carpeta de otro.
export function pathFotoSolicitud(residenteId: string, solicitudId: string, file: File): string {
  const timestamp = Date.now()
  const nombreSeguro = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'foto'
  return `${residenteId}/${solicitudId}/${timestamp}_${nombreSeguro}`
}
