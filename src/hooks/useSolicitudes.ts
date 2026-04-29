import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  BUCKET_FOTOS,
  pathFotoSolicitud,
  validarImagen,
} from '../lib/solicitudes'
import type {
  Solicitud,
  TipoSolicitud,
  CategoriaSolicitud,
  EstadoSolicitud,
} from '../types/database'

const QUERY_TIMEOUT_MS = 8000
const SIGNED_URL_TTL_SEGUNDOS = 60 * 60

const SOLICITUDES_COLUMNS = `
  id, codigo, residente_id, unidad_id, tipo, categoria, descripcion,
  estado, prioridad, imagen_url, piso, departamento, created_at, updated_at
`

type CrearPayload = {
  residente_id: string
  tipo: TipoSolicitud
  categoria: CategoriaSolicitud
  descripcion: string
  prioridad: 'normal' | 'urgente'
  piso: string | null
  departamento: string | null
  imagen: File
}

export type ResultadoCreacion = {
  ok: boolean
  solicitud?: Solicitud
  error?: string
}

// useCrearSolicitud: encapsula el flujo subir foto → insertar fila → manejar
// errores parciales. Si la imagen sube pero el insert falla, intenta limpiar
// el archivo huérfano del bucket para que no queden objetos sin solicitud.
export function useCrearSolicitud() {
  const [enviando, setEnviando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const crear = useCallback(async (payload: CrearPayload): Promise<ResultadoCreacion> => {
    setEnviando(true)
    setError(null)
    setProgreso(0)

    const validacion = validarImagen(payload.imagen)
    if (!validacion.ok) {
      setEnviando(false)
      setError(validacion.mensaje)
      return { ok: false, error: validacion.mensaje }
    }

    const solicitudId = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)
    const path = pathFotoSolicitud(payload.residente_id, solicitudId, payload.imagen)

    setProgreso(10)

    const { error: uploadError } = await supabase
      .storage
      .from(BUCKET_FOTOS)
      .upload(path, payload.imagen, {
        contentType: payload.imagen.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      setEnviando(false)
      const mensaje = uploadError.message.includes('exceeds')
        ? 'La imagen excede el tamaño máximo de 5 MB.'
        : `Error al subir la foto. ${uploadError.message}`
      setError(mensaje)
      return { ok: false, error: mensaje }
    }

    setProgreso(70)

    const { data, error: insertError } = await supabase
      .from('solicitudes')
      .insert({
        id: solicitudId,
        residente_id: payload.residente_id,
        tipo: payload.tipo,
        categoria: payload.categoria,
        descripcion: payload.descripcion,
        prioridad: payload.prioridad,
        piso: payload.piso,
        departamento: payload.departamento,
        imagen_url: path,
      })
      .select(SOLICITUDES_COLUMNS)
      .single()

    if (insertError || !data) {
      // Limpieza del huérfano: si el insert falla, la foto queda apuntando a
      // una solicitud inexistente. Borramos el objeto para no dejar basura.
      await supabase.storage.from(BUCKET_FOTOS).remove([path])
      setEnviando(false)
      const mensaje = insertError?.message ?? 'No pudimos guardar la solicitud.'
      setError(mensaje)
      return { ok: false, error: mensaje }
    }

    setProgreso(100)
    setEnviando(false)
    return { ok: true, solicitud: data as Solicitud }
  }, [])

  return { crear, enviando, progreso, error }
}

// useSolicitudes: lista de solicitudes con filtros opcionales (uso admin y
// residente). El RLS del backend ya impone el alcance por rol; aquí solo
// añadimos filtros de UI.
export type FiltrosSolicitudes = {
  estado?: EstadoSolicitud | ''
  tipo?: TipoSolicitud | ''
  residente_id?: string
}

export function useSolicitudes(filtros: FiltrosSolicitudes = {}) {
  const { estado, tipo, residente_id } = filtros
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const controllerRef = useRef<AbortController | null>(null)

  const fetchSolicitudes = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('solicitudes')
        .select(SOLICITUDES_COLUMNS)
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal)

      if (estado) query = query.eq('estado', estado)
      if (tipo) query = query.eq('tipo', tipo)
      if (residente_id) query = query.eq('residente_id', residente_id)

      const { data, error: fetchError } = await query
      if (controller.signal.aborted) return

      if (fetchError) setError(fetchError.message)
      else setSolicitudes((data ?? []) as Solicitud[])
    } catch (err) {
      if (!controller.signal.aborted) {
        setError((err as Error).message || 'Error al cargar solicitudes')
      }
    } finally {
      clearTimeout(timeoutId)
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setLoading(false)
      }
    }
  }, [estado, tipo, residente_id])

  useEffect(() => {
    fetchSolicitudes()
    return () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [fetchSolicitudes])

  return { solicitudes, loading, error, refetch: fetchSolicitudes }
}

// Genera URLs firmadas para una lista de paths del bucket privado. Las URLs
// caducan a la hora — la UI las consume y reemplaza al refrescar.
// Si un valor ya es una URL absoluta (http(s)://… — caso del seed con
// picsum.photos), se devuelve tal cual sin firmar.
export async function firmarUrls(paths: Array<string | null>): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const limpios = paths.filter((p): p is string => Boolean(p))
  if (limpios.length === 0) return map

  const absolutas: string[] = []
  const relativas: string[] = []
  for (const p of limpios) {
    if (/^https?:\/\//i.test(p)) absolutas.push(p)
    else relativas.push(p)
  }

  for (const url of absolutas) {
    map.set(url, url)
  }

  if (relativas.length > 0) {
    const { data, error: signError } = await supabase
      .storage
      .from(BUCKET_FOTOS)
      .createSignedUrls(relativas, SIGNED_URL_TTL_SEGUNDOS)

    if (!signError && data) {
      for (const item of data) {
        if (item.path && item.signedUrl) {
          map.set(item.path, item.signedUrl)
        }
      }
    }
  }

  return map
}

// Hook utilitario que mantiene un mapa path → URL firmada al día. Cuando la
// lista de paths cambia, refirma todo (operación barata: 1 round-trip).
export function useFotosFirmadas(paths: Array<string | null>) {
  const [urls, setUrls] = useState<Map<string, string>>(new Map())
  // Serializamos la dependencia para que el hook se reanime sólo cuando
  // efectivamente cambie el conjunto de paths, no cada render.
  const key = paths.filter(Boolean).sort().join('|')

  useEffect(() => {
    let cancelado = false
    firmarUrls(paths).then(map => {
      if (!cancelado) setUrls(map)
    })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return urls
}

// Update de prioridad (sólo admin). El trigger BD se encarga de auditoría +
// historial.
export async function actualizarPrioridadSolicitud(
  solicitudId: string,
  prioridad: 'normal' | 'urgente',
): Promise<{ ok: boolean; error?: string }> {
  const { error: updateError } = await supabase
    .from('solicitudes')
    .update({ prioridad })
    .eq('id', solicitudId)
  if (updateError) return { ok: false, error: updateError.message }
  return { ok: true }
}
