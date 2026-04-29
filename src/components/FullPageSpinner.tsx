type Props = {
  label?: string
}

export default function FullPageSpinner({ label = 'Cargando...' }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-warm-400 text-sm font-body">{label}</p>
      </div>
    </div>
  )
}
