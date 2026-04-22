type Props = {
  pasoActual: number
  totalPasos: number
}

export default function BarraProgreso({ pasoActual, totalPasos }: Props) {
  const porcentaje = Math.round((pasoActual / totalPasos) * 100)

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-primary-600 tracking-wide uppercase">
          Paso {pasoActual} de {totalPasos}
        </span>
        <span className="text-xs text-warm-400">{porcentaje}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pasoActual}
        aria-valuemin={1}
        aria-valuemax={totalPasos}
        className="h-1.5 bg-warm-200 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}
