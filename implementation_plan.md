# HU-MANT-02 · Admin asigna técnico a solicitud — SPRINT-4

El admin debe poder asignar (o reasignar) un técnico a una solicitud **pendiente**, indicando una nota de instrucción opcional. Al confirmar:
- Se inserta una fila en `asignaciones`
- El estado cambia a `asignada`
- Se registra en `historial_estados` y `audit_log`

---

## User Review Required

> [!IMPORTANT]
> La tabla `asignaciones` ya existe en `database.ts`. Se asume que en Supabase existe dicha tabla con las columnas: `solicitud_id`, `tecnico_id`, `asignado_por`, `notas`, `empresa_tercero`. Si aún no existe en la BD, el admin verá error al confirmar.

> [!WARNING]
> La lógica de cambio de estado (`pendiente` → `asignada`) puede manejarse via trigger en BD o desde el cliente. Este plan lo hace desde el cliente con una transacción secuencial (insert asignacion → update estado) para mayor control de errores y rollback.

---

## Proposed Changes

### 1. Hook de asignación

#### [NEW] `src/hooks/useAsignarTecnico.ts`
- Expone `useTecnicosActivos()`: consulta `usuarios` filtrando `rol=tecnico` y `estado_cuenta=activo`, agrupa por `empresa_tercero`
- Expone `asignarTecnico(payload)`: inserta en `asignaciones`, actualiza estado a `asignada`, escribe en `audit_log`; hace rollback si falla

---

### 2. Componente modal de asignación

#### [NEW] `src/components/admin/solicitudes/ModalAsignarTecnico.tsx`
- Dropdown agrupado de técnicos (por `empresa_tercero`; sin empresa → grupo "Internos")
- Textarea nota de asignación (máx. 300 chars, contador visible)
- Información de solicitud en solo lectura: ID, tipo, categoría, prioridad, descripción, foto
- Botón **Asignar** / **Reasignar** (según `solicitud.estado`)
- Manejo de errores con mensaje claro y rollback

---

### 3. Integración en DrawerSolicitud

#### [MODIFY] `src/components/admin/solicitudes/DrawerSolicitud.tsx`
- Añadir botón "Asignar técnico" / "Reasignar técnico" en la sección de acciones
- Al hacer clic, abre `ModalAsignarTecnico`
- Tras asignación exitosa, llama `onAsignacionRealizada()` para refetch en el padre

---

### 4. Propagación de callback en la página

#### [MODIFY] `src/pages/admin/Solicitudes.tsx`
- Pasar `onAsignacionRealizada={refetch}` al `DrawerSolicitud`

---

### 5. Tipos (sin cambio de BD)

#### [MODIFY] `src/types/database.ts`
- Verificar que el tipo `Asignacion` ya cubre los campos requeridos ✅ (ya existe)

---

## Verification Plan

### Automated
- `npm run build` — sin errores TypeScript

### Manual
- Abrir una solicitud en estado `pendiente` → debe mostrar botón "Asignar técnico"
- Abrir una solicitud ya `asignada` → debe mostrar "Reasignar técnico"
- Confirmar asignación → estado cambia, historial se actualiza, modal cierra
- Técnico bloqueado o sin técnicos → mensaje de error claro
