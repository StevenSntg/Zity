// HU-MANT-02 SPRINT-4
// Hook para obtener técnicos activos y ejecutar la asignación de una
// solicitud a un técnico. Gestiona insert en `asignaciones`, cambio de
// estado a "asignada" (via helper centralizado que también escribe
// historial_estados y audit_log). Si el cambio de estado falla, revierte
// la asignación para dejar la BD consistente.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { cambiarEstadoSolicitud } from '../lib/solicitudes'
import type { Profile } from '../types/database'

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type TecnicoActivo = Pick<
  Profile,
  'id' | 'nombre' | 'apellido' | 'email' | 'empresa_tercero'
>

/** Técnicos agrupados: clave = nombre de empresa o "Internos" si es null */
export type GrupoTecnicos = {
  empresa: string
  tecnicos: TecnicoActivo[]
}

export type PayloadAsignacion = {
  solicitudId: string
  tecnicoId: string
  asignadoPor: string           // admin_id (auth.uid())
  nota: string                  // puede ser cadena vacía
  empresaTercero: string | null // empresa del técnico seleccionado
  estadoActual: 'pendiente' | 'asignada' | 'en_progreso' | 'resuelta' | 'cerrada'
}

export type ResultadoAsignacion = {
  ok: boolean
  error?: string
}

// ─── useTecnicosActivos ──────────────────────────────────────────────────────

/**
 * HU-MANT-02 SPRINT-4
 * Retorna los técnicos con rol='tecnico' y estado_cuenta='activo',
 * agrupados por empresa_tercero. Los técnicos sin empresa se muestran
 * bajo el grupo "Internos", tal como especifica la HU.
 */
export function useTecnicosActivos() {
  const [grupos, setGrupos] = useState<GrupoTecnicos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // El hook se monta una sola vez y carga los técnicos. Todo el setState
  // ocurre dentro de la callback async (después del primer await) para no
  // disparar render en cascada — regla react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelado = false

    void (async () => {
      const { data, error: fetchError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, email, empresa_tercero')
        .eq('rol', 'tecnico')
        .eq('estado_cuenta', 'activo')
        .order('nombre', { ascending: true })

      if (cancelado) return

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      // Agrupar por empresa_tercero; null → "Internos"
      const mapaEmpresas = new Map<string, TecnicoActivo[]>()
      for (const t of (data ?? []) as TecnicoActivo[]) {
        const empresa = t.empresa_tercero ?? 'Internos'
        if (!mapaEmpresas.has(empresa)) mapaEmpresas.set(empresa, [])
        mapaEmpresas.get(empresa)!.push(t)
      }

      // "Internos" siempre primero, luego el resto en orden de inserción
      const resultado: GrupoTecnicos[] = []
      const internos = mapaEmpresas.get('Internos')
      if (internos) resultado.push({ empresa: 'Internos', tecnicos: internos })
      for (const [empresa, tecnicos] of mapaEmpresas) {
        if (empresa !== 'Internos') resultado.push({ empresa, tecnicos })
      }

      setGrupos(resultado)
      setLoading(false)
    })()

    return () => {
      cancelado = true
    }
  }, [])

  return { grupos, loading, error }
}

// ─── asignarTecnico ──────────────────────────────────────────────────────────

/**
 * HU-MANT-02 SPRINT-4
 * Ejecuta la asignación de un técnico a una solicitud:
 *   1. Insert en `asignaciones`
 *   2. Cambio de estado a 'asignada' via helper centralizado, que también
 *      inserta historial_estados y audit_log en una sola unidad lógica.
 *
 * Si el paso 2 falla, elimina la fila de `asignaciones` para que la BD
 * quede consistente (rollback manual, ya que Supabase JS no expone
 * transacciones explícitas en el cliente).
 */
export async function asignarTecnico(
  payload: PayloadAsignacion,
): Promise<ResultadoAsignacion> {
  const {
    solicitudId,
    tecnicoId,
    asignadoPor,
    nota,
    empresaTercero,
    estadoActual,
  } = payload

  // 1. Insertar asignación
  const notaTrim = nota.trim()
  const { data: asignacion, error: insertError } = await supabase
    .from('asignaciones')
    .insert({
      solicitud_id: solicitudId,
      tecnico_id: tecnicoId,
      asignado_por: asignadoPor,
      notas: notaTrim || null,
      empresa_tercero: empresaTercero,
    })
    .select('id')
    .single()

  if (insertError || !asignacion) {
    return {
      ok: false,
      error: insertError?.message ?? 'No se pudo crear la asignación.',
    }
  }

  // 2. Cambio de estado + historial + audit via helper
  // HU-MANT-02 SPRINT-4 — la nota del admin entra al historial (visible en
  // los 3 dashboards) y empresa_tercero queda registrado en audit_log.detalles.
  const cambio = await cambiarEstadoSolicitud({
    solicitudId,
    estadoAnterior: estadoActual,
    estadoNuevo: 'asignada',
    nota: notaTrim
      ? `Asignación a técnico: ${notaTrim}`
      : 'Solicitud asignada a técnico.',
    usuarioId: asignadoPor,
    accionAudit: 'asignar_solicitud',
    detallesAudit: {
      tecnico_id: tecnicoId,
      empresa_tercero: empresaTercero,
      es_reasignacion: estadoActual !== 'pendiente',
    },
  })

  if (!cambio.ok) {
    // Rollback: eliminar la asignación recién creada
    await supabase.from('asignaciones').delete().eq('id', asignacion.id)
    return {
      ok: false,
      error: `Asignación revertida: ${cambio.error}`,
    }
  }

  return { ok: true }
}
