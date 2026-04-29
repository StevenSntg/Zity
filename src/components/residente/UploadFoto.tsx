import { useEffect, useMemo, useRef, useState } from 'react'
import { validarImagen, IMAGEN_MIME_PERMITIDOS } from '../../lib/solicitudes'

type Props = {
  archivo: File | null
  onCambio: (archivo: File | null) => void
  disabled?: boolean
}

// Componente de selección + preview + validación de imagen.
// El criterio de aceptación de UX (Sprint 3 Retro · Acción 3) exige indicar
// claramente qué pasa durante la espera y si falla. Aquí: error de validación
// inmediato debajo del componente, preview claro con botón para cambiar foto.
export default function UploadFoto({ archivo, onCambio, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  // La URL es deriva del archivo, no estado independiente. useMemo la calcula
  // una vez por archivo y un useEffect aparte revoca la anterior cuando cambia.
  const preview = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo])

  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite re-seleccionar el mismo archivo

    if (!file) return

    const validacion = validarImagen(file)
    if (!validacion.ok) {
      setErrorLocal(validacion.mensaje)
      onCambio(null)
      return
    }

    setErrorLocal(null)
    onCambio(file)
  }

  function handleQuitar() {
    setErrorLocal(null)
    onCambio(null)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGEN_MIME_PERMITIDOS.join(',')}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        aria-label="Subir foto del problema"
      />

      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-warm-200 bg-warm-50">
          <img
            src={preview}
            alt="Vista previa de la foto del problema"
            className="w-full h-48 sm:h-56 object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3 flex items-center justify-between gap-2">
            <span className="text-xs text-white/90 truncate max-w-[60%]">
              {archivo?.name}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cambiar
              </button>
              <button
                type="button"
                onClick={handleQuitar}
                disabled={disabled}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-error/80 hover:bg-error text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="w-full border-2 border-dashed border-warm-300 rounded-lg px-4 py-6 sm:py-8 flex flex-col items-center gap-2 hover:border-primary-400 hover:bg-warm-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-8 h-8 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-primary-800">Subir foto del problema</p>
          <p className="text-xs text-warm-400 text-center">
            JPEG o PNG · máx. 5 MB
          </p>
        </button>
      )}

      {errorLocal && (
        <p className="mt-2 text-xs text-error" role="alert">{errorLocal}</p>
      )}
    </div>
  )
}
