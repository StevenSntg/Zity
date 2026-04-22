import type { EstadoCuenta } from '../../types/database'

type BadgeConfig = {
  label: string
  // Texto con contraste AA sobre el bg
  text: string
  // Background con saturación suficiente para leerse
  bg: string
  // Borde sutil del mismo matiz
  border: string
  // Color sólido del dot indicador
  dot: string
  // Estado animado (solo pendiente: pulse)
  pulse?: boolean
}

const config: Record<EstadoCuenta, BadgeConfig> = {
  activo: {
    label: 'Activo',
    text: 'text-[#2d5f3f]',
    bg: 'bg-[#4a7c59]/15',
    border: 'border-[#4a7c59]/25',
    dot: 'bg-success',
  },
  pendiente: {
    label: 'Pendiente',
    text: 'text-accent-700',
    bg: 'bg-accent-100/80',
    border: 'border-accent-300/60',
    dot: 'bg-accent-500',
    pulse: true,
  },
  bloqueado: {
    label: 'Bloqueado',
    text: 'text-[#9a3a24]',
    bg: 'bg-error/12',
    border: 'border-error/30',
    dot: 'bg-error',
  },
}

type Props = { estado: EstadoCuenta }

export default function BadgeEstado({ estado }: Props) {
  const { label, text, bg, border, dot, pulse } = config[estado]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}
    >
      <span className="relative flex items-center justify-center">
        {pulse && <span className={`absolute w-2 h-2 rounded-full ${dot} opacity-60 animate-ping`} />}
        <span className={`relative w-1.5 h-1.5 rounded-full ${dot}`} />
      </span>
      {label}
    </span>
  )
}
