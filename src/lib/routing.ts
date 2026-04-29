import type { Rol } from '../types/database'

export const ROLE_ROUTES: Record<Rol, string> = {
  admin: '/admin',
  residente: '/residente',
  tecnico: '/tecnico',
}

export function rutaPorRol(rol: Rol | undefined | null): string {
  return ROLE_ROUTES[rol ?? 'residente']
}
