type Props = {
  titulo: string
  mensaje: string
  labelConfirmar: string
  variante: 'peligro' | 'primario'
  cargando: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ModalConfirmacion({
  titulo,
  mensaje,
  labelConfirmar,
  variante,
  cargando,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onCancelar}
      />
      <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-scale-in">
        <h3 className="font-display text-lg font-semibold text-primary-900 mb-2">
          {titulo}
        </h3>
        <p className="text-sm text-warm-400 mb-6">{mensaje}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancelar}
            disabled={cargando}
            className="btn-secondary w-auto! px-5 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className={`w-auto! px-5 text-sm font-medium rounded-lg py-2.5 transition-all ${
              variante === 'peligro'
                ? 'bg-error text-white hover:bg-error/90'
                : 'btn-primary'
            }`}
          >
            {cargando ? <span className="spinner" /> : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
