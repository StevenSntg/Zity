// HU-MANT-06 SPRINT-4
// Agrega captura directa desde cámara del dispositivo móvil.
// En viewport <= 640px: muestra "Tomar foto" como CTA principal + "Elegir archivo" secundario.
// En desktop: solo muestra "Elegir archivo" (el atributo capture es ignorado por el navegador).
// La foto capturada pasa por la misma validación (JPEG/PNG, máx. 5 MB).

import { useEffect, useMemo, useRef, useState } from 'react'
import { validarImagen, IMAGEN_MIME_PERMITIDOS } from '../../lib/solicitudes'

type Props = {
  archivo: File | null
  onCambio: (archivo: File | null) => void
  disabled?: boolean
}

// HU-MANT-06 SPRINT-4 — Hook para detectar viewport móvil (<= 640px).
// Guard typeof matchMedia evita crash en jsdom (tests): en ese entorno isMobile = false.
function useMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 640px)').matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(max-width: 640px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}

// Componente de selección + preview + validación de imagen.
// HU-MANT-06 SPRINT-4: agrega segundo input con capture="environment" para cámara móvil.
export default function UploadFoto({ archivo, onCambio, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)     // galería
  const cameraRef = useRef<HTMLInputElement>(null)    // HU-MANT-06 SPRINT-4: cámara
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  // HU-MANT-06 SPRINT-4 — Detección de móvil para mostrar/ocultar botón cámara
  const isMobile = useMobileViewport()

  const preview = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo])

  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  // Handler compartido: galería y cámara usan la misma validación
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
      {/* Input galería — sin capture (comportamiento original) */}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGEN_MIME_PERMITIDOS.join(',')}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        aria-label="Subir foto del problema"
      />

      {/* HU-MANT-06 SPRINT-4 — Input cámara con capture="environment".
          En desktop el atributo es ignorado por el navegador → abre selector
          de archivos normal (degradación elegante sin error). */}
      <input
        ref={cameraRef}
        type="file"
        accept={IMAGEN_MIME_PERMITIDOS.join(',')}
        capture="environment"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        aria-label="Tomar foto con cámara"
      />

      {preview ? (
        // ── Vista previa ─────────────────────────────────────────────────────
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
        // ── Estado vacío — zona de carga ─────────────────────────────────────
        <div className="border-2 border-dashed border-warm-300 rounded-lg px-4 py-6 sm:py-8 flex flex-col items-center gap-2 hover:border-primary-400 hover:bg-warm-50 transition-colors">
          <svg className="w-8 h-8 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-primary-800">Subir foto del problema</p>
          <p className="text-xs text-warm-400 text-center">
            JPEG o PNG · máx. 5 MB
          </p>

          {/* HU-MANT-06 SPRINT-4 — Botones de acción según viewport */}
          <div className={`mt-2 flex gap-2 ${isMobile ? 'flex-col w-full' : 'flex-row'}`}>

            {/* Botón Tomar foto: solo visible en móvil — CTA principal */}
            {isMobile && (
              <button
                type="button"
                id="btn-tomar-foto-camara"
                onClick={() => cameraRef.current?.click()}
                disabled={disabled}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Tomar foto
              </button>
            )}

            {/* Botón Elegir archivo: siempre visible — secundario en móvil, único en desktop */}
            <button
              type="button"
              id="btn-elegir-archivo"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-warm-300 text-primary-700 bg-white hover:bg-warm-50 hover:border-primary-300 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Elegir archivo
            </button>
          </div>
        </div>
      )}

      {errorLocal && (
        <p className="mt-2 text-xs text-error" role="alert">{errorLocal}</p>
      )}
    </div>
  )
}
