# Zity
## Product Requirements Document
**Gestión de solicitudes en edificios y condominios**

---

| Campo | Detalle |
|---|---|
| Versión | 1.2 — Sprint 1 en curso |
| Estado | Borrador activo |
| Stack | React 19 + Vite 8 + TailwindCSS 4 · Supabase (Postgres + Auth + Realtime) · Vercel · GitHub Actions · Vitest (E2E con Playwright planificado para Sprint 7) |
| Product Owner | Alvarez Rocca Jaqueline |
| Scrum Master | Meza Pelaez Carlos |
| Developers | Cortez Zamora Leonardo Fabian · Gonza Morales Yoel Ronaldo · Santiago Flores Carlos Steven |
| Curso | Ingeniería de Software con Scrum — 16 semanas |
| Nota | Documento académico. Todos los datos de usuarios son ficticios. Sin PII real. |

> 📄 Documento vivo — se actualiza en cada Sprint Review.

---

## Tabla de contenidos

1. [Visión del producto](#1-visión-del-producto)
2. [Stakeholders y usuarios](#2-stakeholders-y-usuarios)
3. [Alcance y exclusiones](#3-alcance-y-exclusiones)
4. [Arquitectura y stack](#4-arquitectura-y-stack)
5. [Requerimientos funcionales](#5-requerimientos-funcionales)
6. [Requerimientos no funcionales](#6-requerimientos-no-funcionales)
7. [Product Backlog semilla](#7-product-backlog-semilla)
8. [Roadmap de 16 semanas](#8-roadmap-de-16-semanas)
9. [Definición de Terminado (DoD)](#9-definición-de-terminado-dod)
10. [Riesgos y mitigaciones](#10-riesgos-y-mitigaciones)
11. [Architecture Decision Records](#11-architecture-decision-records-adrs)
12. [Privacidad y datos](#12-privacidad-y-datos)
13. [Estado actual de implementación](#13-estado-actual-de-implementación)
14. [Glosario](#14-glosario)

---

## 1. Visión del producto

### 1.1 Problema que resuelve

En edificios y condominios residenciales, la comunicación entre residentes, administración y técnicos de mantenimiento es frecuentemente informal, dispersa y no trazable. Los reportes se hacen por WhatsApp, llamadas telefónicas o notas en papel, lo que genera pérdida de solicitudes, tiempos de respuesta desconocidos, falta de historial y fricciones entre las partes.

| Dimensión | Problema |
|---|---|
| Problema central | No existe un canal único y trazable para que los residentes reporten problemas y la administración los gestione con asignación, seguimiento y cierre. |
| Impacto en residentes | No saben si su reporte fue recibido ni cuándo será atendido. |
| Impacto en admins | Gestionan solicitudes manualmente sin métricas ni historial consolidado. |
| Impacto en técnicos | Reciben instrucciones verbales sin contexto del problema ni historial de la unidad. |

### 1.2 Visión

> Zity centraliza la gestión de solicitudes de mantenimiento en edificios y condominios, ofreciendo a los residentes un canal simple para reportar problemas, a la administración un panel de control con asignación y seguimiento, y a los técnicos una vista clara de sus tareas pendientes — generando trazabilidad, reduciendo tiempos de respuesta y eliminando la pérdida de solicitudes.

### 1.3 Objetivo del Producto (Product Goal)

> **Al finalizar la semana 16, Zity permitirá crear, asignar, actualizar y cerrar solicitudes de mantenimiento con control de acceso por rol (residente / administrador / técnico), notificaciones de cambio de estado, historial trazable, despliegue en staging y calidad evidenciada mediante DoD v3, suite de pruebas automatizadas y logs de auditoría.**

### 1.4 Métricas de éxito (piloto académico)

| Métrica | Objetivo |
|---|---|
| Tiempo de creación de solicitud | ≤ 60 segundos desde login hasta confirmación (demo guiada) |
| Solicitudes perdidas | 0 solicitudes creadas sin registro en DB (integridad referencial) |
| Cobertura de notificaciones | ≥ 80% de cambios de estado generan notificación (Realtime o email simulado) |
| Estabilidad CI | ≥ 90% de ejecuciones del pipeline en verde en rama main |
| Tiempo de asignación | Administrador asigna técnico en ≤ 3 clics desde el panel |
| Trazabilidad | 100% de acciones críticas (crear / asignar / cerrar) registradas en audit_log |

---

## 2. Stakeholders y usuarios

### 2.1 Mapa de stakeholders

| Stakeholder | Rol en sistema | Persona ficticia | Necesidad principal |
|---|---|---|---|
| Administrador | `admin` | Carlos Fuentes | Ver y gestionar todas las solicitudes. Asignar técnicos. Ver métricas. |
| Residente | `residente` | Laura Vega (Depto. 4B) | Crear solicitudes y saber el estado en tiempo real sin llamar a recepción. |
| Técnico | `tecnico` | Mario Peña (Plomería) | Ver sus solicitudes asignadas, actualizar estado y agregar notas. |
| Dueño del edificio | observador | Sra. Rosa Díaz | Ver reportes ejecutivos: volumen, tiempos, tipos más frecuentes. |

### 2.2 User Personas

#### Persona 1 — Laura Vega (Residente)

| Campo | Detalle |
|---|---|
| Edad / contexto | 34 años, trabaja desde casa, vive en Depto. 4B hace 2 años. |
| Frustración actual | Manda mensajes al grupo de WhatsApp del edificio y nadie sabe quién es el responsable. |
| Objetivo | Reportar un problema y olvidarse hasta que esté resuelto, con notificación al cambiar el estado. |
| Comportamiento | Usa el celular para todo. Prefiere interfaces simples, no tolera formularios largos. |
| Criterio de éxito | Crear una solicitud en menos de 1 minuto y recibir confirmación inmediata. |

#### Persona 2 — Carlos Fuentes (Administrador)

| Campo | Detalle |
|---|---|
| Edad / contexto | 52 años, administra 3 edificios. Usa laptop Windows. No es técnico. |
| Frustración actual | Recibe solicitudes por WhatsApp, email y papel. Olvida seguimientos. No tiene historial. |
| Objetivo | Tener un panel único donde ver qué hay pendiente, a quién asignarlo y qué ya se resolvió. |
| Comportamiento | Revisa el sistema 2-3 veces al día. Necesita vistas de lista ordenadas por urgencia. |
| Criterio de éxito | Ver todas las solicitudes pendientes y asignar un técnico en menos de 3 clics. |

#### Persona 3 — Mario Peña (Técnico)

| Campo | Detalle |
|---|---|
| Edad / contexto | 41 años, técnico de plomería y electricidad. Usa el teléfono en campo. |
| Frustración actual | El administrador le avisa por WhatsApp pero no tiene contexto del problema ni la unidad. |
| Objetivo | Ver exactamente qué tiene asignado, con descripción y ubicación, y marcar como resuelto. |
| Comportamiento | Accede desde el celular entre trabajos. No quiere aprender sistemas complejos. |
| Criterio de éxito | Ver sus solicitudes asignadas y actualizar estado desde una pantalla simple. |

---

## 3. Alcance y exclusiones

### 3.1 Dentro del alcance (MVP 16 semanas)

- Auto-registro de residentes y técnicos (con verificación de email). El admin activa o bloquea cuentas.
- Creación de solicitudes por parte del residente con tipo, categoría, descripción y unidad.
- Panel del administrador: ver todas las solicitudes, filtrar por estado/tipo, asignar técnico.
- Vista del técnico: solicitudes asignadas, actualizar estado y agregar notas.
- Historial de solicitudes por residente y por unidad.
- Autenticación con roles (`residente` / `admin` / `tecnico`) y estados de cuenta (`pendiente` / `activo` / `bloqueado`) mediante Supabase Auth.
- Recuperación y restablecimiento de contraseña via email.
- Notificaciones en tiempo real (Supabase Realtime) y por email simulado al cambiar estado.
- Log de auditoría: quién hizo qué y cuándo en acciones críticas.
- Exportar solicitudes a CSV (administrador).
- Panel de métricas básicas: solicitudes por tipo, tiempos promedio, tasa de resolución.
- Despliegue continuo a staging con GitHub Actions + Vercel.
- Suite de pruebas: unit (Vitest) + integración + E2E (Playwright, a partir de Sprint 7).

### 3.2 Fuera del alcance

- Pagos o cobro de cuotas de mantenimiento.
- App móvil nativa (iOS/Android) — solo web responsiva.
- Integración con sistemas contables o ERP.
- Chat en tiempo real entre usuarios.
- Múltiples condominios por instancia (multi-tenant complejo).
- Portal público sin autenticación.
- Gestión de proveedores externos o licitaciones.

### 3.3 Decisiones de diseño tempranas

| Decisión | Justificación |
|---|---|
| Sin Node.js/Express custom | Supabase provee Auth, RLS, Realtime y Postgres. No se necesita backend custom en sprints iniciales. Si surge necesidad, se usa Supabase Edge Functions (documentado en ADR-001). |
| Datos sintéticos | Todo el entorno de staging usa datos ficticios. Prohibido subir datos reales de residentes a repositorios públicos. |
| RBAC con Supabase RLS | Los permisos se implementan con Row Level Security a nivel de base de datos, no solo en frontend. |
| Responsivo desde Sprint 1 | La UI debe funcionar en móvil desde el inicio; los técnicos acceden desde el celular. |
| Auto-registro habilitado (limitado) | Residentes y técnicos pueden registrarse. El admin activa la cuenta antes de que puedan operar. Sin auto-registro para cuentas admin. |
| Estado de cuenta | `pendiente` al registrarse, `activo` cuando el admin aprueba, `bloqueado` si se suspende el acceso. Solo cuentas `activas` pueden acceder al sistema (guardas en frontend + RLS). |

---

## 4. Arquitectura y stack

### 4.1 Stack tecnológico

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Frontend | React | 19.2.4 | SPA con hooks modernos y renderizado eficiente. |
| Build | Vite | 8.0.4 | Build rápido con HMR. Soporte nativo para React 19. |
| Estilos | TailwindCSS | 4.2.2 | Utilidades CSS sin configuración compleja; v4 usa CSS nativo y es más rápido (ADR-003). |
| Routing | React Router | 7.14.0 | Enrutamiento cliente + rutas protegidas por rol. |
| Lenguaje | TypeScript | 6.0.2 | Tipado estático completo en frontend y tipos de DB. |
| Auth + DB | Supabase (Postgres + Auth + Realtime) | 2.102.1 (SDK JS) | RBAC nativo con RLS, suscripciones en tiempo real, migraciones reproducibles. |
| Backend logic | Supabase Edge Functions (Deno) | — | Solo para lógica que no puede vivir en frontend ni en DB triggers. |
| Deploy | Vercel (frontend) + Supabase (DB/Auth) | — | CI/CD nativo con GitHub, Preview Deployments por PR, staging automático. |
| CI/CD | GitHub Actions | — | Lint + tests en PR, gate de merge, deploy a staging en merge a main. |
| Testing (unit/integración) | Vitest | 4.1.3 | Rápido para lógica pura; compatible con Vite y jsdom. |
| Testing (E2E) | Playwright | Planificado Sprint 7 | Para flujos críticos end-to-end en staging. Aún no instalado. |

### 4.2 Diagrama de arquitectura (conceptual)

```
[ Residente / Admin / Técnico ]
          ↓  HTTPS
[ React App — Vercel ]
  ├── React Router (rutas por rol + rutas protegidas)
  ├── AuthContext (sesión + perfil + acciones auth)
  └── Supabase JS Client
          ↓
[ Supabase ]
  ├── Postgres (RLS por rol + constraints)
  ├── Auth (JWT + email verification + password recovery)
  ├── Realtime (suscripciones a cambios de estado)
  └── Edge Functions (lógica compleja, si aplica)

[ GitHub Actions ]
  ├── CI: lint (ESLint) + unit tests (Vitest) en PR
  └── CD: merge a main → deploy Vercel staging
```

### 4.3 Rutas de la aplicación

| Ruta | Acceso | Componente | Descripción |
|---|---|---|---|
| `/login` | Público (guest) | `Login` | Inicio de sesión con email y contraseña. |
| `/register` | Público (guest) | `Register` | Auto-registro de residentes y técnicos. |
| `/forgot-password` | Público (guest) | `ForgotPassword` | Solicitar enlace de recuperación de contraseña. |
| `/reset-password` | Autenticado (recovery) | `ResetPassword` | Establecer nueva contraseña tras recovery. |
| `/verify-email` | Público | `VerifyEmail` | Confirmación de email post-registro. |
| `/admin` | `admin` activo | `AdminDashboard` | Panel de gestión del administrador. |
| `/residente` | `residente` activo | `ResidenteDashboard` | Panel del residente para crear y ver solicitudes. |
| `/tecnico` | `tecnico` activo | `TecnicoDashboard` | Panel del técnico para ver y actualizar tareas. |
| `/` | Todos | `RootRedirect` | Redirige al panel del rol o a `/login`. |

### 4.4 Modelo de datos

| Tabla | Campos clave | Descripción |
|---|---|---|
| `profiles` | `id`, `email`, `nombre`, `apellido`, `telefono`, `rol`, `piso`, `departamento`, `estado_cuenta`, `created_at`, `updated_at` | Perfil de usuario vinculado a Supabase Auth. Rol: `residente \| admin \| tecnico`. Estado: `pendiente \| activo \| bloqueado`. |
| `edificios` | `id`, `nombre`, `direccion`, `pisos`, `unidades_por_piso`, `created_at` | Registro del edificio o condominio gestionado. |
| `unidades` | `id`, `edificio_id`, `numero`, `piso`, `descripcion`, `created_at` | Unidades del condominio (4B, 3A, Sala común, etc.). |
| `solicitudes` | `id`, `residente_id`, `unidad_id`, `tipo`, `categoria`, `descripcion`, `estado`, `created_at`, `updated_at` | Solicitud de mantenimiento. `unidad_id` nullable: si existe registro en `unidades` se usa el FK; si no, la ubicación se infiere de `piso`+`departamento` del perfil. Estado: `pendiente \| asignada \| en_progreso \| resuelta \| cerrada`. |
| `asignaciones` | `id`, `solicitud_id`, `tecnico_id`, `asignado_por`, `fecha_asignacion`, `notas` | Registro de qué técnico atiende cada solicitud y quién asignó. |
| `historial_estados` | `id`, `solicitud_id`, `estado_anterior`, `estado_nuevo`, `cambiado_por`, `fecha`, `nota` | Auditoría de cada cambio de estado en una solicitud. |
| `notificaciones` | `id`, `usuario_id`, `solicitud_id`, `tipo`, `mensaje`, `leida`, `created_at` | Cola de notificaciones. Tipo: `estado_cambio \| asignacion \| nueva_solicitud \| sistema`. |
| `audit_log` | `id`, `usuario_id`, `accion`, `entidad`, `entidad_id`, `detalles`, `resultado`, `created_at` | Log de auditoría general. `detalles` es JSON estructurado. `resultado`: `exitoso \| fallido`. Sin PII innecesaria. |

> **Nota de diseño pendiente — Unidad vs. Perfil:** El tipo `Profile` almacena `piso` y `departamento` como strings libres. La tabla `unidades` es un catálogo formal con FK. En Sprint 2, al implementar la creación de solicitudes, el equipo debe decidir: (a) el residente selecciona su unidad de un dropdown que consulta `unidades` y el sistema guarda el FK, o (b) se crea automáticamente un registro en `unidades` a partir de `piso`+`departamento` del perfil. Esta decisión debe actualizarse aquí y en ADR correspondiente.

**Enumeraciones del dominio:**

| Tipo | Valores |
|---|---|
| `EstadoSolicitud` | `pendiente \| asignada \| en_progreso \| resuelta \| cerrada` |
| `TipoSolicitud` | `mantenimiento \| reparacion \| queja \| sugerencia \| otro` |
| `CategoriaSolicitud` | `plomeria \| electricidad \| limpieza \| seguridad \| areas_comunes \| otro` |
| `TipoNotificacion` | `estado_cambio \| asignacion \| nueva_solicitud \| sistema` |
| `Rol` | `residente \| admin \| tecnico` |
| `EstadoCuenta` | `pendiente \| activo \| bloqueado` |

### 4.5 Roles y permisos (RLS)

| Acción | Residente activo | Administrador | Técnico activo | Cuenta pendiente/bloqueada | Anónimo |
|---|---|---|---|---|---|
| Crear solicitud | ✅ (propia unidad) | ✅ | ❌ | ❌ | ❌ |
| Ver solicitudes | ✅ (solo suyas) | ✅ (todas) | ✅ (asignadas) | ❌ | ❌ |
| Asignar técnico | ❌ | ✅ | ❌ | ❌ | ❌ |
| Actualizar estado | ❌ | ✅ | ✅ (asignadas) | ❌ | ❌ |
| Activar/bloquear cuentas | ❌ | ✅ | ❌ | ❌ | ❌ |
| Ver audit log | ❌ | ✅ | ❌ | ❌ | ❌ |
| Exportar CSV | ❌ | ✅ | ❌ | ❌ | ❌ |
| Ver métricas | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 5. Requerimientos funcionales

### 5.1 Módulo de Autenticación y Roles

| ID | Rol | Historia | Criterios clave | Estimación |
|---|---|---|---|---|
| RF-01 | Todos | Quiero iniciar sesión con email y contraseña para acceder a mi panel según mi rol. | Login exitoso redirige al panel del rol. Sesión expira. Logout disponible. Solo cuentas `activas` pueden acceder. | 8 pts |
| RF-02 | Todos | Quiero registrarme con email, contraseña y mis datos para solicitar acceso al sistema. | Auto-registro disponible para `residente` y `tecnico`. Cuenta queda en estado `pendiente` hasta activación. Sin auto-registro para `admin`. | 5 pts |
| RF-03 | Todos | Quiero verificar mi correo electrónico tras el registro para validar mi cuenta. | Email con enlace de verificación enviado por Supabase. Redirect a `/verify-email`. Sin verificación no puede iniciar sesión. | 3 pts |
| RF-04 | Todos | Quiero recuperar mi contraseña si la olvidé para poder volver a acceder. | Formulario en `/forgot-password`. Email con enlace de reset. Redirect a `/reset-password` con flujo `PASSWORD_RECOVERY`. | 3 pts |
| RF-05 | Administrador | Quiero activar o bloquear cuentas de usuarios para controlar quién accede al sistema. | Panel de gestión de usuarios con cambio de `estado_cuenta`. Solo admin puede activar. Cuentas `pendientes` no acceden a dashboards. | 5 pts |

### 5.2 Módulo de Solicitudes (Residente)

| ID | Rol | Historia | Criterios clave | Estimación |
|---|---|---|---|---|
| RF-06 | Residente | Quiero crear una solicitud indicando tipo, categoría, descripción y mi unidad para notificar al admin. | Formulario con validación. Confirmación con ID. Estado inicial: `pendiente`. Unidad asociada al residente. | 8 pts |
| RF-07 | Residente | Quiero ver el historial de mis solicitudes con estado actual y fecha. | Lista cronológica. Filtro por estado. Detalle con historial de cambios de estado. | 5 pts |
| RF-08 | Residente | Quiero recibir una notificación cuando el estado de mi solicitud cambie. | Notificación en pantalla (Realtime). Email simulado. Marcar como leída. | 5 pts |

### 5.3 Módulo de Gestión (Administrador)

| ID | Rol | Historia | Criterios clave | Estimación |
|---|---|---|---|---|
| RF-09 | Administrador | Quiero ver todas las solicitudes con filtros por estado, tipo y técnico para priorizar. | Panel con tabla. Filtros combinables. Ordenar por fecha/urgencia. | 8 pts |
| RF-10 | Administrador | Quiero asignar una solicitud a un técnico con una nota. | Selector de técnico. Campo nota opcional. Notificación al técnico. Registro en `asignaciones`. | 5 pts |
| RF-11 | Administrador | Quiero cambiar el estado de cualquier solicitud. | Cambio de estado con nota obligatoria. Registro en `historial_estados`. | 3 pts |
| RF-12 | Administrador | Quiero exportar las solicitudes del mes a CSV. | Exporta por rango de fechas. Campos definidos. Solo admin. | 3 pts |
| RF-13 | Administrador | Quiero ver métricas básicas para entender el volumen y eficiencia del mantenimiento. | KPIs: total, por estado, por tipo, tiempo promedio resolución. | 5 pts |

### 5.4 Módulo de Tareas (Técnico)

| ID | Rol | Historia | Criterios clave | Estimación |
|---|---|---|---|---|
| RF-14 | Técnico | Quiero ver solo las solicitudes que me asignaron con descripción y ubicación. | Lista filtrada por `tecnico_id`. Detalle con tipo, descripción, unidad, notas y categoría. | 5 pts |
| RF-15 | Técnico | Quiero actualizar el estado de una solicitud asignada y agregar una nota de trabajo. | Cambio de estado (`en_progreso` / `resuelta`). Nota de cierre obligatoria al marcar `resuelta`. | 3 pts |

### 5.5 Módulo de Auditoría y Seguridad

| ID | Rol | Historia | Criterios clave | Estimación |
|---|---|---|---|---|
| RF-16 | Sistema | El sistema debe registrar todas las acciones críticas con usuario, acción, entidad y timestamp. | Log en `audit_log` con campo `detalles` JSON. Sin PII innecesaria. Solo admin puede ver. | 5 pts |
| RF-17 | Sistema | El sistema debe proteger todos los endpoints y vistas según el rol y estado del usuario autenticado. | RLS en Supabase + guardas en frontend (`ProtectedRoute`). URL directa redirige a login. Cuentas `pendientes`/`bloqueadas` son rechazadas. | 8 pts |

---

## 6. Requerimientos no funcionales

| Categoría | Requerimiento | Criterio de verificación |
|---|---|---|
| Rendimiento | Carga inicial de la SPA en < 3 segundos en red normal. | Lighthouse en staging. Score performance ≥ 80. |
| Disponibilidad | Staging disponible ≥ 95% del tiempo durante el curso. | Vercel + Supabase free tier. Monitor manual. |
| Seguridad | Sin exposición de secretos en código. Sin stacktraces en respuestas públicas. | Revisión de PRs. Checklist OWASP en DoD v2. Variables en CI/CD secrets. |
| Privacidad | Entorno demo no usa PII real. Seeds con datos sintéticos. | Política `no-PII` en README. Script de limpieza de staging. |
| Usabilidad | Interfaz responsiva: funciona en móvil (360px+) y desktop. | Prueba manual en Chrome DevTools móvil en cada Sprint Review. |
| Mantenibilidad | Cobertura de pruebas ≥ 60% en módulos core (DoD v2). | Reporte de cobertura en CI (Vitest coverage). |
| Trazabilidad | 100% de acciones críticas registradas en `audit_log`. | Verificación en Sprint Review: crear/asignar/cerrar genera entrada en log. |
| CI/CD | ≥ 90% de pipelines en verde en main a lo largo del curso. | Dashboard GitHub Actions. Métrica reportada en Sprint Review. |
| Tipado | Todo el código TypeScript sin `any` implícito. | `tsc --noEmit` en CI como gate adicional (planificado DoD v2). |

---

## 7. Product Backlog semilla

> Convenciones del curso (no prescritas por Scrum): prioridad P1/P2/P3, estimación en story points (Fibonacci), formato "Como… quiero… para…". ✅ = completado en sprint anterior.

| ID | Tipo | Prior. | Descripción | Criterios clave | Pts | Estado |
|---|---|---|---|---|---|---|
| PBI-01 | Spike | P1 | Investigar y decidir estructura de roles en Supabase (`user_metadata` vs tabla profiles). | Documento comparativo + ADR + checklist seguridad | 3 | ✅ |
| PBI-02 | Spike | P1 | Definir esquema de datos completo (entidades, RLS, migraciones) y estrategia de seeds. | Diagrama ER + migración inicial + seed reproducible + ADR | 3 | ✅ |
| PBI-03 | Chore | P1 | Configurar CI con lint + unit tests para detectar fallas en PR tempranamente. | Pipeline ESLint + Vitest en PR + gate bloquea si falla | 3 | ✅ |
| PBI-04 | Historia | P1 | Como usuario, quiero registrarme, verificar mi email e iniciar sesión para acceder al sistema. | Login + logout + registro + verificación email + recuperar contraseña + redirect por rol | 8 | ✅ |
| PBI-05 | Historia | P1 | Como sistema, necesito rutas protegidas por rol y estado de cuenta para proteger los datos. | ProtectedRoute + RLS + redirect al panel correcto + bloqueo cuentas pendientes | 8 | ✅ |
| PBI-06 | Historia | P1 | Como residente, quiero crear una solicitud con tipo, categoría y descripción para notificar al admin. | Formulario válido + confirmación + estado Pendiente + seed demo | 8 | Pendiente |
| PBI-07 | Historia | P1 | Como admin, quiero ver todas las solicitudes con filtros para gestionar el mantenimiento. | Panel con filtros estado/tipo + ordenamiento + paginación | 8 | Pendiente |
| PBI-08 | Historia | P1 | Como admin, quiero asignar una solicitud a un técnico con nota para delegar el trabajo. | Selector técnico + nota + notificación + registro historial | 5 | Pendiente |
| PBI-09 | Historia | P1 | Como técnico, quiero ver mis solicitudes asignadas y actualizar su estado para informar avance. | Lista filtrada por `tecnico_id` + cambio estado + nota cierre | 5 | Pendiente |
| PBI-10 | Historia | P1 | Como residente, quiero ver el historial de mis solicitudes para saber si fueron atendidas. | Lista con filtro estado + detalle con historial de cambios | 5 | Pendiente |
| PBI-11 | Historia | P1 | Como curso, quiero que el entorno demo use datos sintéticos y no exponga PII real. | Seed ficticio + política no-PII + seudonimización en logs | 5 | Pendiente |
| PBI-12 | Historia | P2 | Como residente, quiero recibir notificaciones cuando cambie el estado de mi solicitud. | Realtime en pantalla + email simulado + marcar leída | 5 | Pendiente |
| PBI-13 | Historia | P2 | Como admin, quiero registrar cambios de estado con nota para tener trazabilidad. | Tabla `historial_estados` + registro automático + visible en detalle | 5 | Pendiente |
| PBI-14 | Historia | P2 | Como sistema, quiero log de auditoría de acciones críticas para diagnóstico y control. | Tabla `audit_log` + insertar en crear/asignar/cerrar + vista admin | 5 | Pendiente |
| PBI-15 | Historia | P2 | Como técnico, quiero agregar una nota de cierre al resolver una solicitud para documentar el trabajo. | Campo nota obligatoria al marcar resuelta + guardado en historial | 3 | Pendiente |
| PBI-16 | Historia | P2 | Como dev, quiero README e instrucciones claras para correr el proyecto y los tests. | README prereqs + correr local + correr tests + seed demo | 3 | Pendiente |
| PBI-17 | Historia | P2 | Como admin, quiero exportar solicitudes a CSV para llevar registro externo. | Exporta por rango fechas + campos definidos + solo admin | 3 | Pendiente |
| PBI-18 | Historia | P2 | Como admin, quiero activar o bloquear cuentas de usuarios para controlar accesos. | Panel usuarios + cambio estado_cuenta + efecto inmediato en sesión | 5 | Pendiente |
| PBI-19 | Historia | P2 | Como sistema, quiero E2E para flujos críticos para detectar regresiones automáticamente. | E2E: crear solicitud, asignar, cerrar — corre en CI | 5 | Pendiente |
| PBI-20 | Spike | P2 | Realizar threat model ligero + checklist OWASP aplicable al producto. | Diagrama flujo datos + amenazas top 5-8 + checklist 10 controles + ADR | 3 | Pendiente |
| PBI-21 | Chore | P2 | Configurar despliegue automático a staging al mergear a main (CD). | Merge a main → deploy Vercel + smoke test + secretos seguros | 3 | Pendiente |
| PBI-22 | Historia | P3 | Como dueño del edificio, quiero ver métricas de solicitudes para entender la eficiencia del mantenimiento. | KPIs: total, por estado, por tipo, tiempo promedio + solo admin | 5 | Pendiente |

---

## 8. Roadmap de 16 semanas

| Sem. | Sprint | Objetivo del Sprint | PBIs | Entregable verificable | DoD |
|---|---|---|---|---|---|
| 1 | S0 | Arranque técnico y decisiones base | PBI-01, PBI-02, PBI-03 | Repo + CI verde + ADRs + tipos de DB + estructura de proyecto | v1 |
| 2 | S1 | Autenticación completa y rutas protegidas | PBI-04, PBI-05 | Login/registro/recovery + RLS + redirect por rol + staging | v1 |
| 3 | S2 | Residente crea y ve solicitudes | PBI-06, PBI-10, PBI-16 | Formulario funcional + lista solicitudes + README + seed sintético | v1 |
| 4 | S3 | Admin visualiza y gestiona solicitudes | PBI-07, PBI-11 | Panel admin + filtros + seed no-PII | v1 |
| 5 | S4 | Técnico ve y actualiza sus tareas | PBI-09, PBI-15 | Vista técnico + actualizar estado + nota cierre | v1 |
| 6 | S5 | Asignación y trazabilidad de cambios | PBI-08, PBI-13 | Asignar técnico + historial estados + log auditoría | v2 |
| 7 | S6 | Notificaciones y operabilidad | PBI-12, PBI-14 | Realtime notif + audit_log + `/health` endpoint | v2 |
| 8 | S7 | Calidad: E2E + threat model | PBI-19, PBI-20 | Suite E2E (Playwright instalado) + threat model + checklist OWASP | v2 |
| 9 | S8 | CD: despliegue continuo a staging | PBI-21 | Deploy automático + smoke test + secretos seguros | v2 |
| 10 | S9 | Métricas, exportación y gestión de cuentas | PBI-17, PBI-22, PBI-18 | Export CSV + panel KPIs + activar/bloquear cuentas | v2 |
| 11 | S10 | Hardening y deuda técnica | Emergentes | 3-5 mejoras desde Review anterior | v2 |
| 12 | S11 | Privacidad y seudonimización reforzada | PBI-11 (refinado) | Política PII completa + limpieza staging | v2 |
| 13 | S12 | Performance y robustez | Emergentes | Pruebas de carga básicas + optimizaciones Lighthouse | v3 |
| 14 | S13 | Seguridad y observabilidad | Emergentes | Checklist OWASP aplicada + logging mejorado | v3 |
| 15 | S14 | Release candidate y docs finales | Emergentes | RC en staging + manual operativo | v3 |
| 16 | S15 | Entrega final: demo + retro | — | Demo final + métricas del curso + retro final | v3 |

---

## 9. Definición de Terminado (DoD)

### DoD v1 — Semanas 1–5 · *"Baseline funcional y reproducible"*

- [ ] Código mergeado a `main` con CI en verde (lint ESLint + unit tests Vitest).
- [ ] PR revisado por al menos 1 Developer.
- [ ] README actualizado: cómo correr localmente + ejecutar pruebas + variables de entorno.
- [ ] Manejo básico de errores: sin stacktraces ni secretos en respuestas de la UI.
- [ ] Datos demo disponibles (`npm run seed`) para reproducir la demo del Sprint.
- [ ] Deploy preview en Vercel funcional para el PR.

### DoD v2 — Semanas 6–12 · *"Calidad + seguridad base + integración"*

- [ ] Todo lo de DoD v1, más:
- [ ] Pruebas de integración para flujos críticos (crear solicitud, asignar, cambiar estado).
- [ ] Cobertura ≥ 60% en módulos core (Vitest coverage report en CI).
- [ ] Endpoint `/health` disponible en staging.
- [ ] Checklist OWASP aplicada a cambios relevantes (`/docs/security/checklist.md`).
- [ ] Variables de entorno manejadas via secrets CI/CD — sin hardcode.
- [ ] Despliegue a staging con verificación `/health` post-deploy.
- [ ] `tsc --noEmit` pasa sin errores en CI.

### DoD v3 — Semanas 13–16 · *"Release candidate"*

- [ ] Todo lo de DoD v2, más:
- [ ] E2E (mínimo 3 escenarios críticos) ejecutados en pipeline con Playwright.
- [ ] Regresión: si se toca flujo de solicitudes, deben pasar unit + integration + E2E.
- [ ] Documentación operativa: cómo desplegar, rollback y variables requeridas.
- [ ] Evidencia de seudonimización y no-PII en staging.
- [ ] Release candidate etiquetado en staging y demo final reproducible.

---

## 10. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Señal temprana | Mitigación |
|---|---|---|---|---|
| Alcance excesivo por Sprint | Alta | Alta | Sprint Goals vagos, PBIs >8 pts sin dividir | Sprint Goal en 1 frase + PBIs pequeños; renegociar sin romper el Sprint Goal. |
| Deuda técnica acumulada | Media | Alta | CI se rompe frecuentemente, bugs sin prueba | DoD escalonada; Sprints 10-14 dedicados a hardening; "calidad no disminuye". |
| RLS mal configurada en Supabase | Media | Alta | Residente ve solicitudes de otros en tests | Pruebas de integración con múltiples roles desde Sprint 0; revisión en Review. |
| Variables de entorno expuestas | Media | Alta | Secreto en commit o PR visible | GitHub Secrets + Vercel env vars + checklist PR template desde Sprint 1. |
| Uso accidental de PII real | Baja | Alta | Datos reales en seeds o logs del repo | Política `no-PII` en README + seed con datos manuales ficticios. |
| Staging inestable por deploys fallidos | Media | Media | Deploys manuales inconsistentes | CD con smoke test post-deploy; `/health` monitoreado en Sprint Review. |
| Supabase free tier alcanza límites | Baja | Media | Errores de conexión en demos | Límites documentados; limpiar datos de staging regularmente. |
| Cuentas pendientes acumuladas sin activar | Baja | Media | Usuarios registrados que no pueden usar el sistema | Admin recibe notificación de cuenta nueva; gestión de cuentas en Sprint 9. |
| Playwright no disponible a tiempo (Sprint 7) | Media | Media | Dependencia de instalación y configuración nueva | Reservar tiempo de setup en Sprint 7; E2E manual como fallback temporal. |

---

## 11. Architecture Decision Records (ADRs)

### ADR-001 — Stack: Supabase como BaaS en lugar de Node.js/Express

| Campo | Detalle |
|---|---|
| Estado | Aprobado — Sprint 0 |
| Contexto | El producto necesita Auth con RBAC, base de datos relacional, suscripciones en tiempo real y despliegue rápido en sprints de 1 semana. Se evaluó construir un backend Express custom. |
| Opciones | A) Node.js + Express + PostgreSQL propio · B) **Supabase BaaS** (seleccionada) · C) Firebase |
| Decisión | Supabase por su integración nativa de Auth + Postgres + RLS + Realtime + migraciones, eliminando configuración de servidor en los sprints iniciales. |
| Consecuencias | Dependencia de proveedor externo (riesgo bajo para curso). Si se necesita lógica compleja, se usa Supabase Edge Functions (Deno). OAuth federado descartado por complejidad. |
| Evidencia | Sprint 0: repo + CI + proyecto Supabase funcionando en Día 1. |

### ADR-002 — Persistencia y concurrencia: Postgres + RLS

| Campo | Detalle |
|---|---|
| Estado | Aprobado — Sprint 0 |
| Contexto | Se necesita consistencia fuerte en la asignación de solicitudes y control de acceso por fila según el rol del usuario. |
| Opciones | A) **Postgres con RLS + constraints únicos** (seleccionada) · B) NoSQL con control en app · C) In-memory |
| Decisión | Postgres con Row Level Security: los permisos viven en la DB, no solo en el frontend. Constraints únicos para integridad referencial. |
| Consecuencias | Migraciones reproducibles obligatorias desde Sprint 0. Tests de concurrencia en Sprint 2. La lógica de permisos en RLS debe documentarse. |
| Evidencia | Migración inicial + tests de integración con múltiples roles. |

### ADR-003 — Estilos: TailwindCSS v4 en lugar de v3

| Campo | Detalle |
|---|---|
| Estado | Aprobado — Sprint 0 |
| Contexto | El proyecto requiere un sistema de utilidades CSS que sea rápido en build y fácil de mantener. TailwindCSS v4 fue liberada al inicio del curso y presenta cambios importantes respecto a v3. |
| Opciones | A) TailwindCSS v3 (estable, más documentación) · B) **TailwindCSS v4** (seleccionada) · C) CSS Modules |
| Decisión | TailwindCSS v4 mediante el plugin oficial `@tailwindcss/vite`. No usa `tailwind.config.js` — la configuración vive en CSS (`@theme`, `@import "tailwindcss"`). La integración con Vite 8 es nativa y más rápida. |
| Consecuencias | La documentación externa de v3 no aplica directamente. Los tokens de diseño (`--color-*`, `--font-*`) se definen en CSS en lugar de JS. La curva de aprendizaje inicial es mayor. |
| Evidencia | Build de producción funcional con `@tailwindcss/vite 4.2.2` integrado en `vite.config.ts`. |

### ADR-004 — Modelo de perfil: tabla `profiles` en lugar de solo `user_metadata`

| Campo | Detalle |
|---|---|
| Estado | Aprobado — Sprint 0 |
| Contexto | Supabase Auth permite almacenar datos en `user_metadata` (JSON en tabla `auth.users`), pero no es consultable eficientemente ni protegible con RLS por filas de negocio. |
| Opciones | A) Solo `user_metadata` en Auth · B) **Tabla `profiles` en schema público** (seleccionada) · C) Tabla híbrida |
| Decisión | Tabla `profiles` en schema público, sincronizada con `auth.users` via trigger. Incluye `nombre`, `apellido`, `telefono`, `piso`, `departamento`, `rol` y `estado_cuenta`. RLS protege la tabla por `id = auth.uid()`. |
| Consecuencias | Se requiere un trigger en Supabase que cree el perfil al registrarse. El `estado_cuenta` permite controlar el acceso a nivel de aplicación sin deshabilitar la cuenta en Auth. |
| Evidencia | Tipo `Profile` en `src/types/database.ts`; `AuthContext` consulta `profiles` en cada sesión. |

---

## 12. Privacidad y datos

| Principio | Detalle |
|---|---|
| Minimización | Solo se recolectan los datos necesarios para la funcionalidad del curso: nombre, apellido, teléfono, piso, departamento. Sin documentos de identidad ni información financiera. |
| Datos sintéticos obligatorios | Todos los seeds y datos de staging usan nombres ficticios. Prohibido subir datos de residentes reales a cualquier repositorio. |
| Seudonimización en logs | El `audit_log` y `historial_estados` usan IDs de usuario (`uuid`), no nombres ni emails. El campo `detalles` no debe contener PII. |
| Retención en staging | Script `npm run clean:staging` debe ejecutarse al final de cada semana. Staging no es producción. |
| Repositorio | Verificar que `.env` y `.env.local` estén en `.gitignore` antes del primer commit. Usar `.env.example` con valores ficticios. |
| Estado de cuenta | El sistema distingue `pendiente`/`activo`/`bloqueado` para poder suspender acceso sin eliminar datos del usuario. |

---

## 13. Estado actual de implementación

> Última actualización: Semana 2 — Sprint 1 en curso.

| Módulo | Componentes / Archivos | Estado |
|---|---|---|
| Infraestructura | Repo GitHub + CI (ESLint + Vitest) + Vite + TailwindCSS v4 + TypeScript | ✅ Completo |
| Tipos de dominio | `src/types/database.ts` — Profile, Edificio, Unidad, Solicitud, Asignacion, HistorialEstado, Notificacion, AuditLog | ✅ Completo |
| Supabase client | `src/lib/supabase.ts` | ✅ Completo |
| AuthContext | `src/contexts/AuthContext.tsx` — signIn, signUp, signOut, resetPassword, updatePassword, fetchProfile | ✅ Completo |
| Páginas de auth | Login, Register, ForgotPassword, ResetPassword, VerifyEmail | ✅ Completo |
| Routing + protección | App.tsx con React Router v7, ProtectedRoute, GuestRoute, RootRedirect | ✅ Completo |
| AdminDashboard | Shell básico con header y tarjetas placeholder | 🔄 Esqueleto |
| ResidenteDashboard | Shell básico con header | 🔄 Esqueleto |
| TecnicoDashboard | Shell básico con header | 🔄 Esqueleto |
| Solicitudes (CRUD) | — | ⏳ Planificado Sprint 2 |
| Asignaciones | — | ⏳ Planificado Sprint 5 |
| Notificaciones Realtime | — | ⏳ Planificado Sprint 6 |
| Audit log (vista admin) | — | ⏳ Planificado Sprint 6 |
| Exportación CSV | — | ⏳ Planificado Sprint 9 |
| Métricas / KPIs | — | ⏳ Planificado Sprint 9 |
| E2E (Playwright) | — | ⏳ Planificado Sprint 7 |
| CD (deploy staging) | — | ⏳ Planificado Sprint 8 |

---

## 14. Glosario

| Término | Definición |
|---|---|
| Solicitud | Reporte de problema o mantenimiento creado por un residente. Entidad central del sistema. |
| Estado de solicitud | Ciclo de vida: `pendiente` → `asignada` → `en_progreso` → `resuelta` → `cerrada`. |
| Estado de cuenta | Estado del perfil de usuario: `pendiente` (recién registrado, sin acceso), `activo` (aprobado por admin), `bloqueado` (acceso suspendido). |
| Unidad | Departamento o espacio dentro del condominio (ej: 4B, Sala común, Estacionamiento 12). |
| Edificio | Registro del inmueble gestionado, con nombre, dirección, número de pisos y unidades. |
| Perfil | Entidad en la tabla `profiles` que extiende la cuenta de Supabase Auth con datos de negocio: nombre, rol, departamento, estado de cuenta. |
| RLS | Row Level Security — política de Postgres que restringe qué filas puede ver/modificar cada usuario según su rol. |
| ADR | Architecture Decision Record — documento que registra una decisión técnica importante con contexto, opciones y consecuencias. |
| DoD | Definition of Done — criterios que debe cumplir un incremento para considerarse terminado. |
| PBI | Product Backlog Item — ítem del Product Backlog (historia, spike, bug, chore). |
| Seed | Script que carga datos ficticios en la base de datos para ejecutar demos reproducibles. |
| Staging | Entorno de pre-producción en Vercel donde se despliegan los incrementos para validación. |
| Edge Function | Función serverless de Supabase (Deno) para lógica que no puede vivir en frontend ni en triggers de DB. |
| GuestRoute | Componente React Router que redirige al dashboard si el usuario ya tiene sesión activa. |
| ProtectedRoute | Componente React Router que bloquea el acceso a rutas según rol y estado de cuenta. |

---

*— Zity PRD v1.2 — Documento vivo — Actualizar en cada Sprint Review —*
