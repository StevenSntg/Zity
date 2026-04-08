# Zity — Artefactos Scrum Sprint 1
**Gestión de solicitudes en edificios y condominios**

---

| Campo | Detalle |
|---|---|
| Producto | Zity |
| Sprint | Sprint 1 — Semana 2 |
| Stack | React + Vite + TailwindCSS · Supabase · Vercel · GitHub Actions · Vitest + Playwright |
| Objetivo del Producto | Al finalizar la semana 16, Zity permitirá crear, asignar, actualizar y cerrar solicitudes de mantenimiento con control de acceso por rol, notificaciones, historial trazable, despliegue en staging y calidad evidenciada mediante DoD v3. |
| Product Owner | Alvarez Rocca Jaqueline |
| Scrum Master | Meza Pelaez Carlos |
| Developers | Cortez Zamora Leonardo Fabian · Gonza Morales Yoel Ronaldo · Santiago Flores Carlos Steven |

> 📄 Documento académico — Datos ficticios sin PII real.

---

## Tabla de contenidos

1. [Acta de Sprint Planning](#1-acta-de-sprint-planning)
2. [Registro de Daily Scrums](#2-registro-de-daily-scrums)
3. [Acta de Sprint Review](#3-acta-de-sprint-review)
4. [Acta de Sprint Retrospective](#4-acta-de-sprint-retrospective)

---

## 1. Acta de Sprint Planning

| Campo | Detalle |
|---|---|
| Sprint | Sprint 1 — Semana 2 |
| Fecha | Lunes — inicio de semana 2 |
| Duración del evento | 75 minutos (Sprint de 1 semana; duración reducida según Scrum) |
| Facilitador | Meza Pelaez Carlos (Scrum Master) |
| Asistentes | Alvarez Rocca Jaqueline (PO), Meza Pelaez Carlos (SM), Cortez Zamora Leonardo, Gonza Morales Yoel, Santiago Flores Carlos (Devs) |
| Stakeholder invitado | Carlos Fuentes — Administrador ficticio del condominio |
| Entrada | Product Backlog ordenado + Objetivo del Producto vigente + DoD v1 publicada |

---

### Tema 1 — ¿Por qué es valioso este Sprint? (Sprint Goal)

> **"Permitir que un residente reporte una solicitud de mantenimiento y que el administrador la visualice, generando un incremento demostrable y funcional."**

> 📌 *Nota Scrum: el Sprint Goal es un compromiso del Sprint Backlog. Debe estar definido antes de finalizar el Sprint Planning y guía todas las decisiones de alcance del Sprint.*

---

### Tema 2 — ¿Qué se puede hacer en este Sprint?

**Capacidad del equipo:** 3 Developers — capacidad estimada: 10–11 story points (carga académica paralela considerada).

**PBIs seleccionados:**

| PBI | Descripción | Criterios de aceptación | Pts |
|---|---|---|---|
| PBI-01 | Como residente, quiero crear una solicitud de mantenimiento indicando tipo de problema, descripción y unidad, para notificar al administrador sin desplazarme. | 1) Formulario con tipo, descripción y unidad. 2) Solicitud guardada con estado "Pendiente". 3) Confirmación visible con ID de solicitud. | 8 pts |
| PBI-14 | Como nuevo integrante del equipo, quiero instrucciones claras para correr el sistema localmente y entender los endpoints disponibles, para integrarme rápido. | 1) README con prereqs + cómo correr + cómo probar. 2) Datos demo mínimos (seed). 3) Al menos 1 endpoint documentado. | 3 pts |

**Total seleccionado:** 11 story points (dentro de la capacidad estimada).

---

### Tema 3 — ¿Cómo se realizará el trabajo?

> *Descomposición de tareas a "un día o menos", según práctica del curso. La forma queda a criterio de los Developers.*

#### Backend / Base de datos (Supabase)

- Crear proyecto en Supabase y configurar variables de entorno en GitHub Secrets
- Migración inicial: tabla `solicitudes` (id, residente_id, tipo, descripcion, unidad, estado, created_at)
- Configurar Row Level Security (RLS): residente solo ve sus solicitudes, admin ve todas
- Seed de datos demo: 1 residente ficticio + 2 solicitudes de prueba

#### Frontend (React + Vite + TailwindCSS)

- Setup inicial: Vite + React + TailwindCSS + cliente Supabase
- Formulario "Nueva Solicitud": campos tipo (select), descripción (textarea), unidad (input)
- Lista de solicitudes del residente autenticado (lectura desde Supabase)
- Manejo de estado vacío ("Sin solicitudes activas")

#### CI/CD (GitHub Actions + Vercel)

- Pipeline CI: lint (ESLint) + unit tests (Vitest) en PR hacia main
- Vercel conectado al repo: deploy preview por PR + deploy a staging en merge a main
- Gate: bloquear merge si CI falla

#### Pruebas

- Unit tests con Vitest: validación del formulario (campos requeridos, tipos válidos)
- Test de integración básico: POST solicitud → verificar en Supabase

#### Documentación

- README: prereqs (Node, cuenta Supabase) + cómo correr localmente + cómo ejecutar pruebas
- Documentar endpoint de creación de solicitud (comentario en código o archivo `docs/`)

---

**Riesgos identificados:**

| Riesgo | Mitigación |
|---|---|
| Configuración inicial de Supabase puede tomar más tiempo del esperado | Cortez Zamora Leonardo realiza el setup el Día 1 como primera tarea. |
| Scope creep hacia autenticación completa | Se usa un usuario demo hardcoded en Sprint 1; auth real se aborda en Sprint 4 (PBI-06). |

| Campo | Detalle |
|---|---|
| DoD aplicable | DoD v1: CI verde + PR revisado + README actualizado + seed demo disponible |
| ADR relacionado | ADR-001 (Stack): uso de Supabase como BaaS en lugar de Node.js/Express — documentado en Sprint 0 |

---

## 2. Registro de Daily Scrums

> 📌 *Referencia Scrum: la Daily Scrum inspecciona el progreso hacia el Sprint Goal y adapta el Sprint Backlog. Duración máxima: 15 minutos. La estructura queda a criterio de los Developers, siempre enfocada en el Sprint Goal.*

**Sprint Goal recordatorio:**
> *"Permitir que un residente reporte una solicitud de mantenimiento y que el administrador la visualice, generando un incremento demostrable y funcional."*

---

### Daily Scrum — Día 1 (Lunes)

| Campo | Detalle |
|---|---|
| **Progreso hacia el objetivo** | Setup inicial completado: repositorio creado, Vite + React + TailwindCSS configurados. Proyecto Supabase creado y variables de entorno agregadas a GitHub Secrets. CI básico (lint) funcionando en PR de prueba. |
| **Plan siguiente 24h** | Cortez Zamora Leonardo: migración inicial de tabla `solicitudes` + RLS por rol. Gonza Morales Yoel: formulario "Nueva Solicitud" (estructura base sin conectar a Supabase). Santiago Flores Carlos: configurar Vitest + primer test unitario de validación del formulario. |
| **Impedimentos** | Duda sobre estructura de roles en Supabase RLS: ¿usar campo `rol` en tabla usuarios o metadata de Auth? Se necesita decisión antes de continuar. |
| **Ajuste Sprint Backlog** | Se agrega tarea técnica: *"Investigar RLS con roles en Supabase Auth metadata (30 min, Cortez Zamora Leonardo)"* — no es un PBI nuevo, es una subtarea de PBI-01. |

---

### Daily Scrum — Día 2 (Martes)

| Campo | Detalle |
|---|---|
| **Progreso hacia el objetivo** | Decisión de roles resuelta: se usa `user_metadata.rol` en Supabase Auth. Migración aplicada en DB de desarrollo. Formulario conectado a Supabase: crear solicitud funciona en local. CI falla en GitHub por variable de entorno no configurada en Actions. |
| **Plan siguiente 24h** | Gonza Morales Yoel: conectar lista de solicitudes del residente (SELECT con RLS). Santiago Flores Carlos: fix del CI — configurar `SUPABASE_URL` y `SUPABASE_ANON_KEY` en GitHub Secrets del repo. Cortez Zamora Leonardo: seed de datos demo (1 residente + 2 solicitudes). |
| **Impedimentos** | CI falla porque las variables de entorno de Supabase no están disponibles en el contexto de los tests de integración en GitHub Actions. |
| **Ajuste Sprint Backlog** | Ajuste de prioridad: Santiago Flores Carlos resuelve el CI antes de agregar nuevas features. Se decide mockear Supabase en unit tests y usar variables de entorno solo en tests de integración. |

---

### Daily Scrum — Día 3 (Miércoles)

| Campo | Detalle |
|---|---|
| **Progreso hacia el objetivo** | CI en verde con estrategia de mock para unit tests. Lista de solicitudes del residente funcionando con datos reales de Supabase. Seed ejecutable desde `npm run seed`. Deploy preview en Vercel funcionando desde PR. |
| **Plan siguiente 24h** | Gonza Morales Yoel: manejo de estado vacío ("Sin solicitudes activas") + hardening UI (mensajes de error). Cortez Zamora Leonardo: test de integración básico + documentación del endpoint. Santiago Flores Carlos: README inicial + preparar guión de Sprint Review. |
| **Impedimentos** | El deploy de Vercel Preview tiene warning por variables de entorno no configuradas en el dashboard de Vercel (distintas a las de GitHub Actions). |
| **Ajuste Sprint Backlog** | Se agrega tarea: *"Configurar variables de entorno en Vercel dashboard (Santiago Flores Carlos, 20 min)"*. Se prepara guión de validación para la Sprint Review del viernes. |

---

## 3. Acta de Sprint Review

> 📌 *Referencia Scrum: la Sprint Review inspecciona el resultado del Sprint y determina adaptaciones futuras. Se discute el progreso hacia el Objetivo del Producto. El Product Backlog puede ajustarse. No debe limitarse a una presentación: es una sesión de trabajo.*

| Campo | Detalle |
|---|---|
| Sprint | Sprint 1 — Semana 2 |
| Fecha | Viernes — cierre de semana 2 |
| Duración | 45 minutos |
| Facilitador | Alvarez Rocca Jaqueline (PO) |
| Scrum Team presente | Alvarez Rocca Jaqueline (PO), Meza Pelaez Carlos (SM), Cortez Zamora Leonardo, Gonza Morales Yoel, Santiago Flores Carlos (Devs) |
| Stakeholders presentes | Carlos Fuentes (Admin ficticio), Laura Vega (Residente ficticia) |
| Incremento presentado | Residente puede crear una solicitud de mantenimiento y verla en su lista — funcionando en Vercel staging con datos demo. |

---

### Demostración del Incremento

El equipo realizó una demostración en vivo sobre el entorno de staging (Vercel). Guión seguido:

1. Acceso con usuario residente demo (Laura Vega — datos ficticios).
2. Creación de solicitud: tipo "Fuga de agua", descripción "Gotera en baño principal", unidad "4B".
3. Confirmación en pantalla: ID de solicitud generado + estado "Pendiente".
4. Vista de lista: solicitudes del residente autenticado con fecha y estado.
5. Estado vacío: pantalla con mensaje "No tienes solicitudes activas" para usuario sin solicitudes.

---

### Revisión del Sprint Goal

> ✅ **CUMPLIDO:** El residente puede reportar solicitudes y visualizarlas. El incremento es demostrable en staging.

> ⚠️ *Nota: la vista del administrador queda pendiente para Sprint 2 por decisión de alcance al inicio del Sprint (se priorizó el flujo del residente como MVP vertical).*

---

### Feedback de Stakeholders

#### Carlos Fuentes (Administrador)

- **"Necesito ver TODAS las solicitudes pendientes desde mi panel, no solo las mías."**
  → Se crea PBI emergente: `PBI-E01` — "Vista de solicitudes para administrador" (prioridad P1, estimación: 5 pts). Se sube en el backlog para Sprint 2.

- **"¿Puedo filtrar por tipo de problema? Hay muchas categorías distintas."**
  → Se refina PBI-01: agregar campo "categoría" con lista predefinida (eléctrico, plomería, estructural, otro). Se planifica impacto en migración.

#### Laura Vega (Residente)

- **"El formulario no me dice si mi solicitud fue recibida o hay algún error de conexión."**
  → Se agrega criterio al PBI-01 ya entregado: mejorar feedback de error en el formulario. Entra como tarea en Sprint 2.

- **"¿Puedo ver el historial de mis solicitudes antiguas?"**
  → Ya cubierto por la lista actual. Se aclara que se muestran todas las solicitudes del residente.

---

### Decisiones de Adaptación del Product Backlog

| Decisión | Detalle |
|---|---|
| PBI emergente creado | `PBI-E01`: "Vista de solicitudes para administrador" — P1, 5 pts. Se ubica en posición 2 del backlog. |
| PBI refinado | PBI-01: se agrega criterio "campo categoría con opciones predefinidas". Impacto: columna `categoria` en tabla `solicitudes`. |
| PBI repriorizado | PBI-06 (Autenticación RBAC) sube de P2 a P1 dado que la vista del administrador requiere control de acceso real. Planificado para Sprint 3-4. |
| Objetivo del Producto | Sin cambios — el objetivo de 16 semanas sigue vigente. |

---

## 4. Acta de Sprint Retrospective

> 📌 *Referencia Scrum: la Retrospective planifica formas de aumentar calidad y efectividad. Inspecciona personas, interacciones, procesos, herramientas y DoD. Identifica cambios útiles y los más impactantes se abordan lo antes posible; pueden agregarse al Sprint Backlog del próximo Sprint.*

| Campo | Detalle |
|---|---|
| Sprint | Sprint 1 — Semana 2 |
| Fecha | Viernes — después de la Sprint Review |
| Duración | 30 minutos |
| Facilitador | Meza Pelaez Carlos (Scrum Master) |
| Participantes | Todo el Scrum Team (PO + SM + Developers) |

---

### ✅ ¿Qué salió bien?

- La estrategia de mockear Supabase en unit tests resolvió el problema de CI rápidamente (Día 2). Buen ejemplo de adaptación dentro del Sprint.
- El guión de demo preparado el Día 3 evitó improvisación en la Sprint Review; la demostración fue fluida y generó feedback concreto de los stakeholders.
- La división de tareas fue clara desde el Sprint Planning: cada Developer supo qué hacer sin bloqueos entre ellos.
- Deploy preview de Vercel por PR facilitó la revisión de cambios antes de mergear a main.

---

### ❌ ¿Qué salió mal?

- Las variables de entorno de Supabase no estuvieron listas desde el Día 1, causando bloqueo en CI y en los tests de integración (Día 2 perdido parcialmente).
- No se documentó el setup de variables de entorno en el README ni en el Sprint 0, lo que generó confusión al configurar GitHub Secrets y Vercel dashboard por separado.
- La vista del administrador no se completó en este Sprint por subestimación del tiempo de configuración inicial. Impactó el Sprint Goal parcialmente.

---

### 🔧 Acciones de mejora (máx. 3)

#### Acción 1 — Checklist de setup de entorno

> Crear checklist de "Setup de entorno" en el README con todas las variables de entorno requeridas (Supabase, Vercel, GitHub Secrets) y sus valores demo.

| Campo | Detalle |
|---|---|
| Dueño | Santiago Flores Carlos |
| Evidencia | Sección "Configuración de entorno" en `README.md` + PR en repo |
| Fecha | Inicio Sprint 2 (entra al Sprint Backlog) |

#### Acción 2 — PBIs listos antes del Planning

> Antes de cada Sprint Planning, el PO debe tener al menos los primeros 2 PBIs con criterios de aceptación detallados y datos demo identificados, para evitar bloqueos en Día 1.

| Campo | Detalle |
|---|---|
| Dueño | Alvarez Rocca Jaqueline (PO) + Meza Pelaez Carlos (SM) |
| Evidencia | PBIs del Sprint 2 listos con criterios completos al inicio del Planning |
| Fecha | Antes del Sprint Planning de Semana 3 |

#### Acción 3 — PR template con checklist DoD v1

> Agregar plantilla de PR con checklist DoD v1 al repositorio para que cada PR recuerde verificar: CI verde, pruebas pasando, README actualizado, seed funcional.

| Campo | Detalle |
|---|---|
| Dueño | Cortez Zamora Leonardo |
| Evidencia | Archivo `.github/PULL_REQUEST_TEMPLATE.md` en el repo |
| Fecha | Día 1 del Sprint 2 |

---

### ☑️ Verificación DoD v1

| Criterio | Estado |
|---|---|
| Código mergeado a main con CI verde (lint + unit tests) | ✅ CUMPLIDO — pipeline verde en GitHub Actions |
| PR revisado por al menos 1 Developer | ✅ CUMPLIDO — todos los PRs tuvieron al menos 1 reviewer |
| README actualizado: correr local + correr pruebas | ⚠️ PARCIAL — falta sección de variables de entorno (Acción 1) |
| Manejo básico de errores: sin stacktraces en respuestas | ✅ CUMPLIDO — errores de Supabase manejados con mensajes amigables |
| Datos demo disponibles (seed) para reproducir la demo | ✅ CUMPLIDO — `npm run seed` carga 1 residente + 2 solicitudes |

> **Conclusión:** DoD v1 considerada **CUMPLIDA** con observación en README. La Acción 1 cierra la brecha en Sprint 2.

---

*— Fin de artefactos Sprint 1 — Zity —*
