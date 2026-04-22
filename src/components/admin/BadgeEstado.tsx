import type { EstadoCuenta } from '../../types/database'

const config: Record<EstadoCuenta, { label: string; classes: string }> = {
  activo: {
    label: 'activo',
    classes: 'bg-success/10 text-success border border-success/20',
  },
  pendiente: {
    label: 'pendiente',
    classes: 'bg-warning/10 text-warning border border-warning/20',
  },
  bloqueado: {
    label: 'bloqueado',
    classes: 'bg-error/10 text-error border border-error/20',
  },
}

type Props = { estado: EstadoCuenta }

export default function BadgeEstado({ estado }: Props) {
  const { label, classes } = config[estado]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}`}>
      {label}
    </span>
  )
}
