// Portal — Renderiza children directamente bajo `document.body` para
// desacoplarlos del stacking context del componente padre.
//
// Necesario para modales/diálogos cuando hay ancestros con `transform`,
// `filter`, `will-change` u otras propiedades que crean un nuevo stacking
// context (ej. nuestras secciones con `.animate-fade-in` que dejan el
// `transform: translateY(0)` final aplicado).
//
// Sin esto, un modal `fixed inset-0 z-[60]` puede quedar visualmente por
// debajo de hermanos del padre que tienen sus propios stacking contexts.
//
// El proyecto es Vite SPA (no SSR), así que `document.body` siempre existe
// cuando este componente se monta — accedemos directo sin guard.

import { createPortal } from 'react-dom'

type Props = {
  children: React.ReactNode
}

export default function Portal({ children }: Props) {
  return createPortal(children, document.body)
}
