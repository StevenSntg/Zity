export type Rol = 'residente' | 'admin' | 'tecnico'
export type EstadoCuenta = 'pendiente' | 'activo' | 'bloqueado'
export type EstadoSolicitud = 'pendiente' | 'asignada' | 'en_progreso' | 'resuelta' | 'cerrada'
export type TipoSolicitud = 'mantenimiento' | 'reparacion' | 'queja' | 'sugerencia' | 'otro'
export type CategoriaSolicitud = 'plomeria' | 'electricidad' | 'limpieza' | 'seguridad' | 'areas_comunes' | 'otro'
export type TipoNotificacion = 'estado_cambio' | 'asignacion' | 'nueva_solicitud' | 'sistema'

export type Profile = {
  id: string
  email: string
  nombre: string
  apellido: string
  telefono: string
  rol: Rol
  piso: string
  departamento: string
  estado_cuenta: EstadoCuenta
  created_at: string
  updated_at: string
}

export type Edificio = {
  id: string
  nombre: string
  direccion: string
  pisos: number
  unidades_por_piso: number
  created_at: string
}

export type Unidad = {
  id: string
  edificio_id: string
  numero: string
  piso: number
  descripcion: string
  created_at: string
}

export type Solicitud = {
  id: string
  residente_id: string
  unidad_id: string | null
  tipo: TipoSolicitud
  categoria: CategoriaSolicitud
  descripcion: string
  estado: EstadoSolicitud
  created_at: string
  updated_at: string
}

export type Asignacion = {
  id: string
  solicitud_id: string
  tecnico_id: string
  asignado_por: string
  fecha_asignacion: string
  notas: string
}

export type HistorialEstado = {
  id: string
  solicitud_id: string
  estado_anterior: string
  estado_nuevo: string
  cambiado_por: string
  fecha: string
  nota: string
}

export type Notificacion = {
  id: string
  usuario_id: string
  solicitud_id: string | null
  tipo: TipoNotificacion
  mensaje: string
  leida: boolean
  created_at: string
}

export type AuditLog = {
  id: string
  usuario_id: string | null
  accion: string
  entidad: string
  entidad_id: string | null
  detalles: Record<string, unknown>
  resultado: 'exitoso' | 'fallido'
  created_at: string
}

export type SignUpMetadata = {
  nombre: string
  apellido: string
  telefono: string
  piso: string
  departamento: string
  rol: 'residente' | 'tecnico'
}
