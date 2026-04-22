# Zity — Artefactos Scrum · Sprint 2
> Modelamiento de base de datos · Panel admin · Gestión de usuarios

| Campo | Detalle |
|---|---|
| **Producto** | Zity |
| **Sprint** | Sprint 2 — Semana 3 |
| **Stack** | React + Vite + TailwindCSS · Supabase · Vercel · GitHub Actions · Vitest + Playwright |
| **Product Owner** | Alvarez Rocca Jaqueline |
| **Scrum Master** | Meza Pelaez Carlos |
| **Developers** | Cortez Zamora Leonardo Fabian · Gonza Morales Yoel Ronaldo · Santiago Flores Carlos Steven |
| **Capacidad semanal** | 3 h/día × 5 integrantes = 15 horas/semana · 60 horas/mes |
| **Horas estimadas** | 14 horas (1 hora de buffer) |
| **DoD aplicable** | DoD v1 — baseline funcional y reproducible |

> 📝 Documento académico — Datos ficticios sin PII real. Documento vivo — se actualiza en cada Sprint Review.

---

## 1. Acta de Sprint Planning

| Campo | Detalle |
|---|---|
| **Sprint** | Sprint 2 — Semana 3 |
| **Fecha** | Lunes — inicio de semana 3 |
| **Duración del evento** | 75 minutos |
| **Facilitador** | Meza Pelaez Carlos (Scrum Master) |
| **Asistentes** | Alvarez Rocca Jaqueline (PO), Meza Pelaez Carlos (SM), Cortez Zamora Leonardo, Gonza Morales Yoel, Santiago Flores Carlos (Devs) |
| **Stakeholder invitado** | Carlos Fuentes — Administrador ficticio del condominio |
| **Capacidad** | 15 horas disponibles · se usarán 14 h (1 h de buffer para imprevistos) |
| **Entrada** | Product Backlog actualizado con PBIs emergentes de Sprint 1 Review + DoD v1 vigente + ADR-001 y ADR-002 aprobados |
| **Deuda del Sprint 1** | PBI-AUTH-01 requiere mejora de UX (registro en 2 pasos con barra de progreso) — entra como refinamiento en este Sprint |

### 🎯 Sprint Goal

> **"Completar el modelamiento de la base de datos, habilitar al administrador para crear y gestionar usuarios desde su panel, y mejorar el flujo de registro en 2 pasos, dejando el sistema de usuarios completamente operativo."**

> ⚠️ *Nota Scrum: el Sprint Goal es el único objetivo inamovible del Sprint. Si el backlog necesita ajustarse durante el Sprint, el Sprint Goal no cambia.*

---

### PBIs seleccionados — Sprint 2

| ID | Historia / Tarea | Tipo | Prioridad | Horas est. | Responsable |
|---|---|---|---|---|---|
| PBI-S2-01 | Modelamiento completo de BD: diagrama ER + migraciones + RLS por módulo | Spike | P1 | 3 h | Cortez Zamora Leonardo |
| PBI-AUTH-06 | Creación de usuarios por administrador (invitación por email) | Historia | P1 | 3 h | Gonza Morales Yoel |
| PBI-S2-02 | Panel admin: lista de usuarios con estado (pendiente/activo/bloqueado) | Historia | P1 | 3 h | Santiago Flores Carlos |
| PBI-AUTH-01b | Registro en 2 pasos con barra de progreso (refinamiento de Sprint 1) | Refinamiento | P2 | 2 h | Cortez Zamora Leonardo |
| PBI-S2-03 | Bloquear/desbloquear cuentas desde el panel admin | Historia | P2 | 2 h | Gonza Morales Yoel |
| PBI-14b | Actualizar README con nueva estructura de BD y seed ampliado | Chore | P2 | 1 h | Santiago Flores Carlos |

> **Total estimado: 14 horas — 1 hora de buffer disponible para imprevistos.**

---

### Modelamiento de base de datos — Decisiones clave

El Sprint 2 establece la estructura de datos que soportará todos los módulos futuros. Se toman las siguientes decisiones de diseño (documentadas en ADR-002 actualizado):

#### Tablas del módulo Usuarios (completas)

| Tabla | Campos principales | Notas de diseño |
|---|---|---|
| `usuarios` | id (uuid), email (unique), nombre, apellido, telefono, rol (residente\|admin\|tecnico), piso, departamento, estado_cuenta (pendiente\|activo\|bloqueado), empresa_tercero, created_at, updated_at | RLS: admin lee todo, usuario lee solo su fila. `empresa_tercero` permite registrar técnicos de empresas externas. |
| `edificios` | id, nombre, direccion, pisos_total, unidades_por_piso, imagen_url, created_at | `imagen_url` apunta a Supabase Storage. Una instancia = un edificio (no multi-tenant en esta versión). |
| `invitaciones` | id, email, rol, token (unique), estado (pendiente\|aceptada\|expirada), creada_por, expires_at, created_at | Gestiona las invitaciones enviadas por el admin. Token expira en 48 h. |

#### Tablas del módulo Mantenimiento (diseño anticipado — Sprint 3)

| Tabla | Campos principales | Notas de diseño |
|---|---|---|
| `solicitudes` | id, residente_id, unidad_id, tipo, categoria, descripcion, estado (pendiente\|asignada\|en_progreso\|resuelta\|cerrada), prioridad, imagen_url, created_at, updated_at | `imagen_url` obligatoria (Supabase Storage). RLS: residente ve solo las suyas. |
| `asignaciones` | id, solicitud_id, tecnico_id, asignado_por, fecha_asignacion, notas, empresa_tercero | Si técnico es externo, se registra `empresa_tercero`. |
| `historial_estados` | id, solicitud_id, estado_anterior, estado_nuevo, cambiado_por, nota, created_at | Auditoría completa de cada cambio de estado. |
| `calificaciones` | id, solicitud_id, residente_id, tecnico_id, calificacion (buena\|mala), comentario (max 100 chars), created_at | Calificación binaria simple. Sprint 6. |

#### Tablas del módulo Finanzas (diseño anticipado — Sprint 9)

| Tabla | Campos principales | Notas de diseño |
|---|---|---|
| `gastos` | id, tipo, monto, proveedor, ruc_proveedor, fecha, boleta_url, notas (max 100 chars), registrado_por, created_at | `boleta_url` obligatoria (Supabase Storage). |
| `rentas` | id, unidad_id, residente_id, monto, mes, anio, estado (pendiente\|pagada\|vencida), fecha_pago, created_at | Control de pagos mensuales por unidad. |

#### Tablas de soporte global

| Tabla | Campos principales | Notas de diseño |
|---|---|---|
| `notificaciones` | id, usuario_id, tipo, titulo, mensaje, leida, entidad_id, entidad_tipo, created_at | Centraliza todas las notificaciones del sistema. |
| `audit_log` | id, usuario_id, accion, entidad, entidad_id, resultado, ip_hash (no PII), created_at | Sin PII directa. Solo IDs y acciones. Visible solo para admin. |

---

### Desglose de tareas — ¿Cómo?

#### Cortez Zamora Leonardo — Modelamiento BD (3 h)

| Tarea | Horas |
|---|---|
| Diagrama ER completo con todas las tablas y relaciones (draw.io o dbdiagram.io) | 1 h |
| Migraciones Supabase para todas las tablas nuevas (invitaciones, tablas anticipadas) | 1 h |
| Actualizar RLS para cada tabla: políticas por rol documentadas en `/docs/rls.md` | 1 h |

#### Gonza Morales Yoel — Creación de usuarios + bloqueo (5 h)

| Tarea | Horas |
|---|---|
| API: endpoint para crear invitación (`POST /invitaciones`) + envío de email vía Resend | 1.5 h |
| Frontend: formulario en panel admin para invitar usuario (email, nombre, rol, piso, depto) | 1.5 h |
| Frontend: acción bloquear/desbloquear cuenta desde la lista de usuarios | 1 h |
| Tests unitarios: validación de formulario de invitación + lógica de expiración de token | 1 h |

#### Santiago Flores Carlos — Panel admin + README (4 h)

| Tarea | Horas |
|---|---|
| Panel admin: tabla de usuarios con columnas nombre, email, rol, piso/depto, estado_cuenta | 1.5 h |
| Filtros en tabla de usuarios: por rol (residente/técnico/admin) y por estado (activo/pendiente/bloqueado) | 1 h |
| Indicador visual de estado_cuenta: badge de color (verde=activo, amarillo=pendiente, rojo=bloqueado) | 0.5 h |
| Actualizar README: nueva estructura de BD, cómo correr migraciones, seed ampliado | 1 h |

#### Cortez Zamora Leonardo — Registro en 2 pasos (2 h)

| Tarea | Horas |
|---|---|
| Añadir barra de progreso visual (Paso 1 de 2 / Paso 2 de 2) al formulario de registro | 0.5 h |
| Guardar estado del paso 1 en memoria para no perder datos al avanzar | 0.5 h |
| Botón 'Volver' en paso 2 que recupera los datos del paso 1 sin borrarlos | 0.5 h |
| Test de UX: verificar que el flujo completo tarda menos de 2 minutos en la demo | 0.5 h |

---

### Riesgos del Sprint 2

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | El diagrama ER puede requerir revisiones que retrasen las migraciones | Media | Medio | Cortez Zamora presenta borrador del ER el Día 1 antes de codificar migraciones. El equipo lo valida en 15 min. |
| R2 | El email de invitación puede caer en spam durante la demo | Media | Medio | Usar cuenta de email de prueba verificada con Resend. Tener flujo de activación manual como backup. |
| R3 | Scope creep hacia el módulo de mantenimiento | Baja | Medio | SM recuerda el Sprint Goal al inicio de cada Daily. Mantenimiento entra en Sprint 3. |
| R4 | RLS para tablas anticipadas puede ser compleja de probar | Media | Alto | Crear tests de integración con 3 roles distintos para cada tabla nueva. Incluir en pipeline CI. |
| R5 | Cotización de Twilio (SMS) pendiente del Sprint 1 | Baja | Medio | PO debe cotizar Twilio esta semana y presentar resultado antes del Planning de Sprint 3. |

---

## 2. Registro de Daily Scrums

> 📌 *Referencia Scrum: la Daily Scrum inspecciona el progreso hacia el Sprint Goal y adapta el Sprint Backlog. Duración máxima: 15 minutos.*

**Sprint Goal: "BD completa, admin gestiona usuarios, registro en 2 pasos operativo."**

---

### Daily Scrum — Día 1 (Lunes)

| Campo | Detalle |
|---|---|
| **Progreso hacia el objetivo** | Revisión del backlog de Sprint 1 completada. ADR-002 actualizado con decisiones de modelamiento. Cortez Zamora presenta el borrador del diagrama ER al equipo (15 min de validación). Se aprueba el diseño con un ajuste: agregar campo `empresa_tercero` en la tabla `usuarios` para técnicos de empresas externas. |
| **Plan siguiente 24h** | Cortez Zamora: crear migraciones para tablas `invitaciones` y ajustes a tabla `usuarios` (campo `empresa_tercero`). Gonza Morales: endpoint `POST /invitaciones` + integración con Resend para envío de email. Santiago Flores: estructura base del panel admin con tabla de usuarios (sin datos aún). |
| **Impedimentos** | La librería de UI para el badge de `estado_cuenta` (verde/amarillo/rojo) no está instalada en el proyecto. Hay que decidir si usar Tailwind puro o instalar una librería de componentes. |
| **Ajuste Sprint Backlog** | Se decide usar Tailwind puro para los badges (evitar dependencias externas no planificadas). Santiago Flores implementa los badges con clases de Tailwind en 30 min. No se necesita instalar ningún paquete adicional. |

---

### Daily Scrum — Día 2 (Martes)

| Campo | Detalle |
|---|---|
| **Progreso hacia el objetivo** | Migraciones aplicadas en Supabase (tablas `invitaciones`, columna `empresa_tercero` en `usuarios`, tablas anticipadas de mantenimiento y finanzas). RLS básico configurado para todas las tablas nuevas. Endpoint `POST /invitaciones` funciona en local: crea registro en BD y envía email vía Resend. Panel admin muestra la lista de usuarios con badges de estado. |
| **Plan siguiente 24h** | Gonza Morales: formulario frontend de invitación en panel admin + acción de bloquear/desbloquear. Santiago Flores: filtros por rol y estado en la tabla de usuarios del panel admin. Cortez Zamora: documento de RLS (`/docs/rls.md`) + formulario de registro en 2 pasos con barra de progreso. |
| **Impedimentos** | El email de invitación enviado por Resend tarda ~3 minutos en llegar durante las pruebas. Puede ser un problema en la demo si el stakeholder espera la confirmación en tiempo real. |
| **Ajuste Sprint Backlog** | Se agrega pantalla de confirmación inmediata: *"Invitación enviada a correo@ejemplo.com — puede tardar unos minutos"*. Se documenta el comportamiento esperado en el guión de demo. No afecta el Sprint Goal. |

---

### Daily Scrum — Día 3 (Miércoles)

| Campo | Detalle |
|---|---|
| **Progreso hacia el objetivo** | Formulario de invitación completo y funcional. Bloquear/desbloquear cuentas operativo con confirmación de acción (modal: *"¿Estás seguro?"*). Registro en 2 pasos con barra de progreso funcionando. Filtros del panel admin operativos. CI en verde. Diagrama ER exportado como imagen y como archivo `.dbml` en `/docs/db/`. |
| **Plan siguiente 24h** | Gonza Morales: tests unitarios de formulario de invitación + lógica de expiración de token. Santiago Flores: seed ampliado con 3 residentes + 2 técnicos (uno de empresa tercera) + 1 admin ficticios. Cortez Zamora: preparar guión de Sprint Review + verificar DoD v1. |
| **Impedimentos** | El seed ampliado genera conflicto con el seed anterior del Sprint 1 (emails duplicados). Hay que limpiar la BD de staging antes de correr el seed nuevo. |
| **Ajuste Sprint Backlog** | Se agrega comando `npm run seed:clean` que limpia la BD de staging antes de insertar datos demo. Se documenta en README. Se verifica que no afecta datos de producción (no existe producción aún). |

---

## 3. Acta de Sprint Review

> 📌 *Referencia Scrum: la Sprint Review inspecciona el resultado del Sprint y determina adaptaciones futuras. Es una sesión de trabajo, no una presentación.*

| Campo | Detalle |
|---|---|
| **Sprint** | Sprint 2 — Semana 3 |
| **Fecha** | Viernes — cierre de semana 3 |
| **Duración** | 45 minutos |
| **Facilitador** | Alvarez Rocca Jaqueline (PO) |
| **Scrum Team** | Alvarez Rocca Jaqueline (PO), Meza Pelaez Carlos (SM), Cortez Zamora Leonardo, Gonza Morales Yoel, Santiago Flores Carlos |
| **Stakeholders** | Carlos Fuentes (Admin ficticio), Laura Vega (Residente ficticia), Mario Peña (Técnico ficticio de empresa 'TecnoEdif SAC') |
| **Incremento presentado** | BD completamente modelada con diagrama ER · Panel admin con lista de usuarios filtrable · Invitación de usuarios por email · Bloqueo/desbloqueo de cuentas · Registro en 2 pasos con barra de progreso |

### Guión de demostración

1. Admin (Carlos) accede al panel de administrador. Ve la lista de usuarios: 3 residentes, 2 técnicos (uno de TecnoEdif SAC), 1 admin. Cada uno con badge de estado.
2. Admin crea una invitación para un nuevo residente: ingresa email, nombre, rol 'residente', piso 3, depto A. Sistema muestra confirmación y envía email.
3. Admin bloquea la cuenta del técnico externo (Mario Peña — TecnoEdif SAC). El sistema pide confirmación (modal). Después del bloqueo, el badge cambia a rojo.
4. Admin desbloquea la misma cuenta. Badge vuelve a verde.
5. Se muestra el filtro: admin filtra por 'técnico' y por 'pendiente'. La tabla se actualiza mostrando solo los técnicos con cuentas pendientes.
6. Se muestra el nuevo flujo de registro en 2 pasos: paso 1 (credenciales) → barra de progreso → paso 2 (datos del edificio). Botón 'Volver' no pierde los datos.
7. Se muestra el diagrama ER en `/docs/db/` — el equipo explica brevemente las relaciones principales.

### ✅ Revisión del Sprint Goal

> **CUMPLIDO AL 100%: BD modelada, admin gestiona usuarios, registro en 2 pasos operativo.**

---

### Feedback de stakeholders

#### Carlos Fuentes (Administrador)
- *"¿Puedo ver en la lista de usuarios cuánto tiempo lleva pendiente cada invitación?"* → Se crea **PBI emergente PBI-S2-E01**: 'Mostrar tiempo transcurrido desde invitación en la lista de usuarios' — P2, 1 h. Sprint 3 como tarea menor.
- *"Cuando bloqueo a alguien, ¿se cierra automáticamente su sesión activa?"* → Actualmente no. Se crea **PBI-S2-E02**: 'Invalidar sesión activa al bloquear cuenta' — P1, 2 h. Entra en Sprint 3.
- *"Quiero poder ver el campo empresa_tercero en la lista de técnicos para identificar cuáles son internos y cuáles de empresas contratadas."* → Se refina la tabla del panel admin para mostrar columna `empresa_tercero` solo en el filtro de técnicos. Se añade criterio al PBI-S2-02 ya entregado — se implementa en este mismo ciclo como hotfix.

#### Laura Vega (Residente)
- *"El formulario de registro de 2 pasos es mucho mejor. ¿Puedo editar mis datos de piso y departamento después de registrarme?"* → Se crea **PBI-S2-E03**: 'Perfil de usuario: editar datos personales y de ubicación' — P2, 3 h. Sprint 4 o posterior.
- *"¿Cuándo voy a poder reportar un problema de mantenimiento?"* → PO confirma que el módulo de mantenimiento entra en Sprint 3. Se presenta brevemente el roadmap actualizado.

#### Mario Peña (Técnico — TecnoEdif SAC)
- *"¿El sistema va a mostrar el nombre de mi empresa cuando el residente vea quién atiende su solicitud?"* → Confirmado: el campo `empresa_tercero` se mostrará en el detalle de la solicitud. Se incluye en los criterios de HU-MANT-01 (Sprint 3).

---

### Decisiones de adaptación del Product Backlog

| Decisión | Detalle |
|---|---|
| PBI emergente PBI-S2-E01 | Mostrar tiempo transcurrido de invitación — P2, 1 h. Sprint 3 como tarea menor. |
| PBI emergente PBI-S2-E02 | Invalidar sesión activa al bloquear cuenta — P1, 2 h. Sprint 3. |
| PBI emergente PBI-S2-E03 | Perfil de usuario: editar datos personales — P2, 3 h. Sprint 4. |
| Refinamiento PBI-S2-02 | Agregar columna `empresa_tercero` en tabla de técnicos del panel admin. Hotfix en esta semana. |
| Sprint 3 confirmado | Módulo de mantenimiento: crear solicitud con foto obligatoria (HU-MANT-01). |
| Cotización Twilio | PO confirma que presentará cotización de Twilio antes del Planning del Sprint 3. |
| ADR-002 actualizado | Modelamiento de BD v2 aprobado. Diagrama ER versionado en `/docs/db/`. Próxima revisión en Sprint 5. |

---

## 4. Acta de Sprint Retrospective

> 📌 *Referencia Scrum: la Retrospective planifica formas de aumentar calidad y efectividad. Los cambios más impactantes pueden entrar al Sprint Backlog del próximo Sprint.*

| Campo | Detalle |
|---|---|
| **Sprint** | Sprint 2 — Semana 3 |
| **Fecha** | Viernes — después de la Sprint Review |
| **Duración** | 30 minutos |
| **Facilitador** | Meza Pelaez Carlos (Scrum Master) |
| **Participantes** | Todo el Scrum Team (PO + SM + Developers) |

### ✅ ¿Qué salió bien?

- Presentar el borrador del diagrama ER el Día 1 antes de codificar evitó refactorizaciones costosas. El ajuste del campo `empresa_tercero` tomó 5 minutos.
- Usar Tailwind puro para los badges fue una buena decisión: evitó instalar dependencias no planificadas y el código quedó más limpio.
- El comando `npm run seed:clean` resolvió el conflicto de seeds de forma limpia y quedó documentado en el README.
- El diagrama ER versionado en `/docs/db/` le dio al equipo una referencia visual clara durante todo el Sprint.
- La acción 3 del Sprint anterior (comentarios cortos en el código) se cumplió: todos los PRs tenían comentarios de 1 línea con referencia al PBI.

### ❌ ¿Qué salió mal?

- No se consideró que bloquear una cuenta no invalida la sesión activa. Se detectó recién en la Sprint Review (feedback de Carlos Fuentes). Debe entrar como P1 en Sprint 3.
- El email de invitación tarda ~3 minutos en llegar. Esto generó incertidumbre durante la demo. Se manejó con una pantalla de confirmación, pero sería mejor en <30 segundos.
- Las tablas anticipadas de Mantenimiento y Finanzas se crearon en BD pero no tienen tests de RLS todavía. Representan deuda técnica que hay que cubrir en Sprint 3-4.

### 🔧 Acciones de mejora (máx. 3)

#### Acción 1 — Tests de RLS obligatorios para cada tabla nueva

| Campo | Detalle |
|---|---|
| **Descripción** | Toda tabla nueva que se cree en BD debe tener al menos 1 test de integración que valide el RLS con los 3 roles (residente, admin, técnico) antes de ser mergeada a main. |
| **Dueño** | Cortez Zamora Leonardo — valida en PR review |
| **Evidencia** | Tests de integración para tablas de mantenimiento y finanzas en el pipeline CI de Sprint 3 |
| **Fecha** | Desde el primer PR de Sprint 3 |

#### Acción 2 — Presentar borrador de diseño antes de codificar (extender a UI)

| Campo | Detalle |
|---|---|
| **Descripción** | El criterio de 'presentar borrador antes de codificar' que funcionó para el ER también se aplica a pantallas nuevas: sketch en papel o Figma antes de desarrollar cualquier vista del panel admin o de usuarios. |
| **Dueño** | Gonza Morales Yoel — coordina con PO |
| **Evidencia** | Foto del sketch en el canal del equipo antes de iniciar desarrollo de cada pantalla nueva en Sprint 3 |
| **Fecha** | Desde Sprint 3 |

#### Acción 3 — Incluir caso de uso 'sesión activa' en criterios de aceptación de seguridad

| Campo | Detalle |
|---|---|
| **Descripción** | Toda historia de usuario que involucre cambio de estado de cuenta (bloquear, desbloquear, cambiar rol, eliminar) debe incluir explícitamente el criterio: *"La sesión activa del usuario afectado se invalida inmediatamente"*. |
| **Dueño** | Alvarez Rocca Jaqueline (PO) — al redactar criterios de aceptación |
| **Evidencia** | PBI-S2-E02 (invalidar sesión al bloquear) como ejemplo en Sprint 3 |
| **Fecha** | Retroactivo: aplicar a todos los PBIs de auth pendientes |

---

### ☑️ Verificación DoD v1

| Criterio | Estado |
|---|---|
| Código mergeado a main con CI verde (lint + unit tests) | ✅ CUMPLIDO |
| PR revisado por al menos 1 Developer | ✅ CUMPLIDO — promedio 2 reviewers por PR |
| README actualizado con nueva estructura de BD + seed:clean | ✅ CUMPLIDO |
| Manejo de errores: sin stacktraces, mensajes claros en UI | ✅ CUMPLIDO |
| Datos demo disponibles (`npm run seed:clean` + `npm run seed`) | ✅ CUMPLIDO — seed con 6 usuarios ficticios |
| Deploy preview en Vercel funcional para cada PR | ✅ CUMPLIDO |
| Diagrama ER versionado en `/docs/db/` | ✅ CUMPLIDO — añadido como evidencia adicional de Sprint 2 |

> **DoD v1 CUMPLIDA AL 100%. Sprint 2 cerrado correctamente.**

---

## 5. Historias de Usuario — Sprint 2

### PBI-AUTH-06 · Creación de usuarios por administrador
`Sprint 2` · `3 h` · 🔴 P1

> Como administrador, quiero crear cuentas de residentes y técnicos directamente desde mi panel enviando una invitación, para controlar quién tiene acceso al sistema sin depender del auto-registro público.

**Campos / Entidades:**
- Email del invitado (único, validado)
- Nombre y apellido
- Rol: residente / técnico
- Piso y departamento
- `empresa_tercero` (opcional — solo para técnicos de empresas externas contratadas)

**Criterios de aceptación:**
- [ ] El admin ingresa los datos y el sistema envía un email de invitación con link de activación.
- [ ] El link de invitación expira en 48 horas (distinto al link de registro propio: 24 h).
- [ ] La cuenta creada aparece con estado `pendiente` en la lista de usuarios del admin.
- [ ] Si el link expira, el admin puede reenviar la invitación desde el panel.
- [ ] Si el técnico pertenece a una empresa contratada (tercero), el campo `empresa_tercero` es visible en la lista de técnicos del panel.
- [ ] La sesión activa del usuario NO se ve afectada (cuenta nueva, no tiene sesión).
- [ ] El email de invitación usa el template personalizado de Zity (no el default de Supabase).
- [ ] Se registra la acción en `audit_log`: `{accion: 'crear_invitacion', creada_por: admin_id, email_invitado}`.

**Meta técnica / Evidencia:** formulario funcional en panel admin + email recibido en cuenta de prueba + registro en `audit_log`.

---

### PBI-S2-02 · Panel admin: lista de usuarios
`Sprint 2` · `3 h` · 🔴 P1

> Como administrador, quiero ver todos los usuarios del sistema en una tabla filtrable con su estado actual, para gestionar el acceso al sistema de forma centralizada y eficiente.

**Criterios de aceptación:**
- [ ] Tabla con columnas: nombre, email, rol, piso/depto, `empresa_tercero` (solo técnicos), `estado_cuenta` (badge de color: verde=activo, amarillo=pendiente, rojo=bloqueado).
- [ ] Filtros disponibles: por rol (residente / técnico / admin / todos) y por estado (activo / pendiente / bloqueado / todos).
- [ ] Los filtros son combinables (ej: técnicos bloqueados).
- [ ] Se muestra el tiempo transcurrido desde la invitación para cuentas en estado `pendiente`.
- [ ] La tabla es responsiva (funciona en tablet y móvil).
- [ ] Solo el administrador puede acceder a esta vista (RLS + guarda de ruta en frontend).

**Meta técnica / Evidencia:** vista funcional en staging con seed de 6 usuarios ficticios.

---

### PBI-S2-03 · Bloquear y desbloquear cuentas
`Sprint 2` · `2 h` · 🔴 P1

> Como administrador, quiero bloquear o desbloquear la cuenta de cualquier usuario desde el panel, para controlar el acceso al sistema ante situaciones de riesgo o cambios de personal.

**Criterios de aceptación:**
- [ ] Botón de acción en cada fila de la tabla de usuarios.
- [ ] Al hacer clic, aparece un modal de confirmación: *"¿Seguro que quieres bloquear a [nombre]?"*.
- [ ] Al confirmar, el `estado_cuenta` cambia a `bloqueado` y el badge se actualiza en tiempo real.
- [ ] Al bloquear: la sesión activa del usuario se invalida inmediatamente (token revocado en Supabase Auth).
- [ ] Al desbloquear: el usuario puede volver a iniciar sesión normalmente.
- [ ] El admin no puede bloquearse a sí mismo.
- [ ] La acción se registra en `audit_log`: `{accion: 'bloquear_cuenta' | 'desbloquear_cuenta', ejecutado_por, usuario_afectado}`.

**Meta técnica / Evidencia:** acción funcional en staging + verificación de cierre de sesión + registro en `audit_log`.

---

### PBI-AUTH-01b · Registro en 2 pasos con barra de progreso
`Sprint 2` · `2 h` · 🟡 P2

> Como nuevo usuario, quiero completar mi registro en 2 pasos claros con una barra de progreso visual, para saber en qué parte del proceso estoy y no perder mis datos si vuelvo al paso anterior.

**Criterios de aceptación:**
- [ ] Paso 1: credenciales (email, contraseña, confirmar contraseña) con barra que muestra *"Paso 1 de 2"*.
- [ ] Paso 2: datos del edificio (nombre, apellido, teléfono, piso, departamento, rol solicitado) con barra que muestra *"Paso 2 de 2"*.
- [ ] El botón 'Volver' en el paso 2 recupera exactamente los datos ingresados en el paso 1 sin borrarlos.
- [ ] Si el usuario intenta salir a mitad del registro, aparece un aviso: *"¿Deseas cancelar el registro?"*.
- [ ] El flujo completo (registro + activación + login) tarda menos de 3 minutos en la demo guiada.
- [ ] La imagen del edificio es visible durante todo el proceso de registro.

**Meta técnica / Evidencia:** flujo demostrado en Sprint Review con stakeholder Laura Vega.

---

### PBIs emergentes — entran en Sprint 3

| ID | Historia | Prioridad | Horas est. | Sprint |
|---|---|---|---|---|
| PBI-S2-E01 | Mostrar tiempo transcurrido desde invitación en lista de usuarios (ej: 'hace 2 días') | 🟡 P2 | 1 h | 3 |
| PBI-S2-E02 | Invalidar sesión activa al bloquear cuenta de usuario | 🔴 P1 | 2 h | 3 |
| PBI-S2-E03 | Perfil de usuario: editar nombre, apellido, teléfono, piso y departamento | 🟡 P2 | 3 h | 4 |

---

## 6. Estado del Backlog tras Sprint 2

### Progreso acumulado

| Sprint | Horas invertidas | Módulo completado | Estado |
|---|---|---|---|
| Sprint 0 | 12 h | Setup técnico + CI + ADRs + Supabase base | ✅ Completado |
| Sprint 1 | 15 h | Módulo Auth completo (registro, activación, login, recuperación) | ✅ Completado |
| Sprint 2 | 14 h | Modelamiento BD + panel admin + gestión de usuarios | ✅ Completado |
| Sprint 3 | 13 h (est.) | Módulo Mantenimiento: crear solicitud con foto | 🔜 Próximo |
| Sprint 4 | 13 h (est.) | Mantenimiento: asignar técnico (interno/tercero) | ⏳ Pendiente |
| Sprints 5–15 | 137 h (est.) | Módulos restantes según roadmap | ⏳ Pendiente |

- **Total invertido:** 41 horas en 3 sprints (Sprint 0 + 1 + 2)
- **Total restante:** 163 horas estimadas en 13 sprints
- **Horas mensuales disponibles:** 60 horas/mes · al ritmo actual el proyecto cierra en ~2.7 meses adicionales

---

### Próximo Sprint — Vista previa Sprint 3

> **Sprint 3: Módulo de Mantenimiento** — Crear solicitud con foto obligatoria + vista del residente + vista básica del admin.

| PBI | Historia | Horas est. | Prioridad |
|---|---|---|---|
| HU-MANT-01 | Como residente, crear solicitud de mantenimiento con foto obligatoria | 5 h | 🔴 P1 |
| PBI-S2-E02 | Invalidar sesión activa al bloquear cuenta (emergente de Sprint 2) | 2 h | 🔴 P1 |
| PBI-S2-E01 | Mostrar tiempo transcurrido desde invitación en lista de usuarios | 1 h | 🟡 P2 |
| HU-MANT-01b | Vista del admin: ver solicitudes pendientes con foto y datos del residente | 4 h | 🔴 P1 |
| Chore | Tests de RLS para tablas de mantenimiento (deuda técnica de Sprint 2) | 1 h | 🔴 P1 |

> **Total estimado Sprint 3: 13 horas (2 h de buffer disponible)**

---

*— Zity · Artefactos Sprint 2 · Documento vivo — actualizar en cada Sprint Review —*
