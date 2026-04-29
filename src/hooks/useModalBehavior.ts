import { useEffect } from 'react'

// Comportamiento estándar de modales: bloquear scroll del body y cerrar con Escape.
// Centralizado para evitar que múltiples modales pisen el `body.style.overflow`
// de forma descoordinada al cerrarse en distinto orden.
export function useModalBehavior(onClose: () => void, disabled = false) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !disabled) onClose()
    }
    window.addEventListener('keydown', onKey)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflowAnterior
    }
  }, [onClose, disabled])
}
