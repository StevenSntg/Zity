// HU-MANT-02 SPRINT-4
// Hook para obtener técnicos activos y ejecutar la asignación de una
// solicitud a un técnico. Gestiona insert en `asignaciones`, cambio de
// estado a "asignada" y registro en audit_log. Si algún paso falla,
// intenta revertir los cambios para dejar la BD consistente.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
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

  const fetchTecnicos = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, email, empresa_tercero')
      .eq('rol', 'tecnico')
      .eq('estado_cuenta', 'activo')
      .order('nombre', { ascending: true })

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

    // "Internos" siempre primero, luego el resto en orden alfabético
    const resultado: GrupoTecnicos[] = []
    const internos = mapaEmpresas.get('Internos')
    if (internos) resultado.push({ empresa: 'Internos', tecnicos: internos })
    for (const [empresa, tecnicos] of mapaEmpresas) {
      if (empresa !== 'Internos') resultado.push({ empresa, tecnicos })
    }

    setGrupos(resultado)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTecnicos()
  }, [fetchTecnicos])

  return { grupos, loading, error }
}

// ─── asignarTecnico ──────────────────────────────────────────────────────────

/**
 * HU-MANT-02 SPRINT-4
 * Ejecuta la asignación de un técnico a una solicitud:
 *   1. Insert en `asignaciones`
 *   2. Update de `solicitudes.estado` → 'asignada'
 *   3. Insert en `audit_log`
 *
 * Si el paso 2 falla, elimina la fila de `asignaciones` para que la BD
 * quede consistente (rollback manual, ya que Supabase JS no expone
 * transacciones explícitas en el cliente).
 *
 * La acción queda registrada como 'asignar_solicitud' con los campos
 * {admin_id, solicitud_id, tecnico_id, empresa_tercero} tal como
 * indica el criterio de aceptación de la HU.
 */
export async function asignarTecnico(
  payload: PayloadAsignacion,
): Promise<ResultadoAsignacion> {
  const { solicitudId, tecnicoId, asignadoPor, nota, empresaTercero } = payload

  // 1. Insertar asignación
  const { data: asignacion, error: insertError } = await supabase
    .from('asignaciones')
    .insert({
      solicitud_id: solicitudId,
      tecnico_id: tecnicoId,
      asignado_por: asignadoPor,
      notas: nota.trim() || null,
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

  // 2. Cambiar estado a 'asignada'
  const { error: updateError } = await supabase
    .from('solicitudes')
    .update({ estado: 'asignada' })
    .eq('id', solicitudId)

  if (updateError) {
    // Rollback: eliminar la asignación recién creada
    await supabase.from('asignaciones').delete().eq('id', asignacion.id)
    return {
      ok: false,
      error: `Asignación revertida: ${updateError.message}`,
    }
  }

  // 3. Registrar en audit_log
  await supabase.from('audit_log').insert({
    usuario_id: asignadoPor,
    accion: 'asignar_solicitud',
    entidad: 'solicitudes',
    entidad_id: solicitudId,
    resultado: JSON.stringify({
      tecnico_id: tecnicoId,
      empresa_tercero: empresaTercero,
    }),
  })
  // No bloqueamos el flujo si falla el audit_log

  return { ok: true }
}
