// Reglas de validación compartidas: una sola fuente de verdad para todo el frontend.
// Si cambia una regla, actualizar aquí evita inconsistencias entre páginas.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mín. 8 caracteres, al menos 1 mayúscula y 1 dígito.
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/

export const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]{2,50}$/

export const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]{1,10}$/

// Zity opera solo en Perú: el formulario fija el prefijo +51 y valida 9 dígitos.
export const PHONE_PREFIX = '+51 '
