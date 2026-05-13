// Sprint 5 · HU-AUDIT-01 · Modal con el detalle JSON de una entrada de audit_log.

import { useModalBehavior } from '../../../hooks/useModalBehavior'
import { labelAccion } from '../../../lib/audit'
import Portal from '../../Portal'
import type { EntradaAuditLog } from '../../../hooks/useAuditLog'

type Props = {
  entrada: EntradaAuditLog
  onCerrar: () => void
}

export default function ModalDetalleAudit({ entrada, onCerrar }: Props) {
  useModalBehavior(onCerrar, false)

  const detallesJson = JSON.stringify(entrada.detalles ?? {}, null, 2)

  return (
    // Portal + z-[60] — desacopla del stacking context del padre.
    <Portal>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onCerrar} />

      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col animate-fade-in max-h-[90vh] overflow-hidden">

        <div className="shrink-0 px-6 py-4 border-b border-warm-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.6875rem] uppercase tracking-wider text-warm-400 font-medium">
              Entrada de auditoría
            </p>
            <h2 className="font-display text-lg font-semibold text-primary-900 leading-tight">
              {labelAccion(entrada.accion)}
            </h2>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar modal"
            className="min-w-10 min-h-10 -mr-1 flex items-center justify-center text-warm-400 hover:text-primary-700 rounded-md cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Resumen */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Resumen label="Cuando" value={new Date(entrada.created_at).toLocaleString('es')} />
            <Resumen label="Resultado" value={entrada.resultado ?? 'exitoso'} />
            {entrada.autor ? (
              <>
                <Resumen label="Usuario" value={`${entrada.autor.nombre} ${entrada.autor.apellido}`} />
                <Resumen label="Email" value={entrada.autor.email} />
                <Resumen label="Rol" value={entrada.autor.rol} />
              </>
            ) : (
              <Resumen label="Usuario" value="(sistema)" />
            )}
            <Resumen label="Entidad" value={entrada.entidad ?? '—'} />
            {entrada.entidad_id && (
              <Resumen
                label="ID de entidad"
                value={entrada.entidad_id}
                mono
              />
            )}
          </dl>

          {/* Detalles JSON */}
          <div>
            <p className="text-[0.6875rem] uppercase tracking-wider text-warm-400 font-medium mb-2">
              Detalles
            </p>
            <pre className="text-xs font-mono bg-warm-50 border border-warm-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words text-primary-800">
              {detallesJson}
            </pre>
            <p className="text-[0.6875rem] text-warm-400 mt-2">
              Política no-PII: los detalles contienen solo IDs, flags o valores de estado.
              Ver <code className="font-mono">/docs/audit.md</code> para el formato por acción.
            </p>
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-warm-200 flex justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="h-10 px-5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
    </Portal>
  )
}

function Resumen({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[0.6875rem] uppercase tracking-wider text-warm-400 mb-0.5">{label}</dt>
      <dd className={`text-sm text-primary-900 ${mono ? 'font-mono text-xs break-all' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
