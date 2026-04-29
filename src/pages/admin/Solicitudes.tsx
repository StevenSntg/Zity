import { useMemo, useState } from 'react'
import AdminShell from '../../components/admin/AdminShell'
import FiltrosSolicitudes from '../../components/admin/solicitudes/FiltrosSolicitudes'
import TablaSolicitudes from '../../components/admin/solicitudes/TablaSolicitudes'
import DrawerSolicitud from '../../components/admin/solicitudes/DrawerSolicitud'
import {
  useSolicitudesAdmin,
  type FiltrosAdmin,
} from '../../hooks/useSolicitudesAdmin'
import { useFotosFirmadas } from '../../hooks/useSolicitudes'

export default function AdminSolicitudes() {
  const [filtros, setFiltros] = useState<FiltrosAdmin>({ estado: '', tipo: '' })
  const { solicitudes, loading, error, refetch } = useSolicitudesAdmin(filtros)

  const paths = useMemo(() => solicitudes.map(s => s.imagen_url), [solicitudes])
  const fotosUrls = useFotosFirmadas(paths)

  // La selección la guardamos por id; los datos completos los derivamos del
  // array `solicitudes`. Así, tras un refetch la `seleccionada` queda
  // automáticamente sincronizada con los nuevos valores (prioridad, estado).
  const [idSeleccionada, setIdSeleccionada] = useState<string | null>(null)
  const seleccionada = useMemo(
    () => solicitudes.find(s => s.id === idSeleccionada) ?? null,
    [solicitudes, idSeleccionada],
  )

  const subtitulo = `${solicitudes.length} solicitud${solicitudes.length !== 1 ? 'es' : ''} ${solicitudes.length !== 1 ? 'encontradas' : 'encontrada'}`

  return (
    <AdminShell title="Solicitudes" subtitle={subtitulo}>
      {error && (
        <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          {error}
        </div>
      )}

      <div className="mb-4 sm:mb-6 animate-fade-in delay-1">
        <FiltrosSolicitudes filtros={filtros} onChange={setFiltros} />
      </div>

      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden animate-fade-in delay-2">
        <TablaSolicitudes
          solicitudes={solicitudes}
          loading={loading}
          fotosUrls={fotosUrls}
          onAbrir={s => setIdSeleccionada(s.id)}
        />
      </div>

      {seleccionada && (
        <DrawerSolicitud
          solicitud={seleccionada}
          fotoUrl={seleccionada.imagen_url ? fotosUrls.get(seleccionada.imagen_url) : undefined}
          onCerrar={() => setIdSeleccionada(null)}
          onPrioridadActualizada={refetch}
        />
      )}
    </AdminShell>
  )
}
