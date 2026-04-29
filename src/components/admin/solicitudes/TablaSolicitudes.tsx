import type { SolicitudConResidente } from '../../../hooks/useSolicitudesAdmin'
import { BadgeEstadoSolicitud, BadgePrioridad } from './BadgeSolicitud'
import { tiempoTranscurrido, iniciales } from '../../../lib/format'
import { labelCategoria, labelTipo } from '../../../lib/solicitudes'

type Props = {
  solicitudes: SolicitudConResidente[]
  loading: boolean
  fotosUrls: Map<string, string>
  onAbrir: (s: SolicitudConResidente) => void
}

function Miniatura({ url }: { url: string | undefined }) {
  if (!url) {
    return (
      <div className="w-12 h-12 rounded-lg bg-warm-100 border border-warm-200 flex items-center justify-center text-warm-400 shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      className="w-12 h-12 rounded-lg object-cover border border-warm-200 shrink-0"
    />
  )
}

function NombreResidente({ s }: { s: SolicitudConResidente }) {
  if (!s.residente) return <span className="text-warm-400 text-xs">Residente desconocido</span>
  return (
    <div className="min-w-0">
      <p className="font-medium text-primary-900 truncate">
        {s.residente.nombre} {s.residente.apellido}
      </p>
      <p className="text-xs text-warm-400 truncate">
        {(s.piso ?? s.residente.piso) && (s.departamento ?? s.residente.departamento)
          ? `Piso ${s.piso ?? s.residente.piso} — ${s.departamento ?? s.residente.departamento}`
          : s.residente.email}
      </p>
    </div>
  )
}

export default function TablaSolicitudes({ solicitudes, loading, fotosUrls, onAbrir }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-16" data-testid="solicitudes-admin-loading">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (solicitudes.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-14 h-14 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-primary-800 font-medium">Sin solicitudes</p>
        <p className="text-sm text-warm-400 mt-1">
          Cuando un residente reporte un problema, aparecerá aquí.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ============== Mobile cards (<md) ============== */}
      <ul className="md:hidden divide-y divide-warm-100">
        {solicitudes.map(s => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onAbrir(s)}
              className="w-full text-left p-4 hover:bg-warm-50/60 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <Miniatura url={s.imagen_url ? fotosUrls.get(s.imagen_url) : undefined} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[0.6875rem] text-warm-400">{s.codigo}</span>
                    <BadgeEstadoSolicitud estado={s.estado} />
                  </div>
                  <p className="mt-0.5 font-medium text-primary-900 truncate">
                    {labelTipo(s.tipo)} · {labelCategoria(s.categoria)}
                  </p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <BadgePrioridad prioridad={s.prioridad} />
                    {s.residente && (
                      <span className="text-xs text-warm-400 truncate">
                        {s.residente.nombre} {s.residente.apellido}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[0.6875rem] text-warm-400">
                    {tiempoTranscurrido(s.created_at)}
                  </p>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* ============== Desktop table (md+) ============== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm-200 bg-warm-50/60">
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">ID</th>
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">Residente</th>
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">Tipo / Categoría</th>
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">Prioridad</th>
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">Estado</th>
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">Fecha</th>
              <th className="text-left py-3 px-4 font-medium text-warm-400 text-xs uppercase tracking-wider">Foto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {solicitudes.map(s => (
              <tr
                key={s.id}
                onClick={() => onAbrir(s)}
                className="hover:bg-warm-50/60 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4">
                  <span className="font-mono text-xs text-primary-700">{s.codigo}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {s.residente && (
                      <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                        {iniciales(s.residente.nombre, s.residente.apellido)}
                      </div>
                    )}
                    <NombreResidente s={s} />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="text-primary-900">{labelTipo(s.tipo)}</p>
                  <p className="text-xs text-warm-400">{labelCategoria(s.categoria)}</p>
                </td>
                <td className="py-3 px-4">
                  <BadgePrioridad prioridad={s.prioridad} />
                </td>
                <td className="py-3 px-4">
                  <BadgeEstadoSolicitud estado={s.estado} />
                </td>
                <td className="py-3 px-4 text-xs text-warm-400">
                  {tiempoTranscurrido(s.created_at)}
                </td>
                <td className="py-3 px-4">
                  <Miniatura url={s.imagen_url ? fotosUrls.get(s.imagen_url) : undefined} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
