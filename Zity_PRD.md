# Zity
## Product Requirements Document
**Gestión de solicitudes en edificios y condominios**

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
| Trazabilidad | 100% de acciones críticas (crear / asignar / cerrar / confirmar / rechazar) registradas en audit_log |
| Confirmación del residente | 100% de solicitudes resueltas requieren confirmación explícita del residente antes de cerrarse (ADR-008) |
| Cobertura de tests | ≥ 60% en módulos core a partir de Sprint 4 (DoD v2). Alcanzado: 64% en `src/lib/solicitudes.ts` |

---

## 2. Stakeholders y usuarios

### 2.1 Mapa de stakeholders

| Stakeholder | Rol en sistema | Persona ficticia | Necesidad principal |
|---|---|---|---|
| Administrador | `admin` | Carlos Fuentes | Ver y gestionar todas las solicitudes. Asignar técnicos (internos o de empresas terceras). Ver métricas. |
| Residente | `residente` | Laura Vega (Depto. 4B) | Crear solicitudes, recibir actualizaciones en tiempo real y confirmar que el trabajo del técnico cumplió con su expectativa. |
| Técnico | `tecnico` | Mario Peña (TecnoEdif SAC — Plomería) | Ver sus solicitudes asignadas con foto y contexto, actualizar estado y cerrar con nota de trabajo realizado. |
| Dueño del edificio | observador | Sra. Rosa Díaz | Ver reportes ejecutivos: volumen, tiempos, tipos más frecuentes. |

### 2.2 User Personas

#### Persona 1 — Laura Vega (Residente)

| Campo | Detalle |
|---|---|
| Edad / contexto | 34 años, trabaja desde casa, vive en Depto. 4B hace 2 años. |
| Frustración actual | Manda mensajes al grupo de WhatsApp del edificio y nadie sabe quién es el responsable. |
| Objetivo | Reportar un problema con foto capturada desde la cámara del celular, olvidarse hasta que esté resuelto, y poder confirmar o rechazar la solución antes de que se cierre la solicitud. |
| Comportamiento | Usa el celular para todo. Prefiere interfaces simples, no tolera formularios largos. Valora poder tomar foto directamente sin salir del navegador. |
| Criterio de éxito | Crear una solicitud en menos de 1 minuto con foto capturada en el acto, y poder confirmar/rechazar la solución del técnico desde la sección "Pendientes de tu confirmación". |

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
| Edad / contexto | 41 años, técnico de plomería y electricidad. Trabaja para **TecnoEdif SAC** (empresa contratista del condominio). Usa el teléfono en campo. |
| Frustración actual | El administrador le avisa por WhatsApp pero no tiene contexto del problema ni la unidad. |
| Objetivo | Ver exactamente qué tiene asignado, con foto, descripción y ubicación, y marcar como resuelto dejando una nota detallada del trabajo realizado. |
| Comportamiento | Accede desde el celular entre trabajos. No quiere aprender sistemas complejos. |
| Criterio de éxito | Ver sus solicitudes asignadas, abrir detalle con foto en grande y datos de la unidad, actualizar estado (`en_progreso` → `resuelta`) con nota de cierre obligatoria (≥ 20 caracteres). |

---

## 3. Alcance y exclusiones

### 3.1 Dentro del alcance (MVP 16 semanas)

- Auto-registro de residentes y técnicos (con verificación de email). El admin activa o bloquea cuentas.
- Creación de solicitudes por parte del residente con tipo, categoría, descripción, prioridad y **foto obligatoria** (subida desde galería o **capturada directamente desde la cámara móvil** con `capture="environment"`).
- Panel del administrador: ver todas las solicitudes, filtrar por estado/tipo, asignar técnico (interno o de empresa tercera con agrupación en dropdown).
- Vista del técnico: solicitudes asignadas filtradas por `tecnico_id`, actualizar estado y agregar nota de cierre obligatoria (≥ 20 caracteres).
- **Confirmación del residente al cierre**: tras `resuelta`, el residente confirma (`→ cerrada`) o rechaza (`→ en_progreso` con nota). Tras 3 rechazos escala al admin (ADR-008).
- Historial de solicitudes por residente y por unidad con línea de tiempo de cambios de estado.
- Autenticación con roles (`residente` / `admin` / `tecnico`) y estados de cuenta (`pendiente` / `activo` / `bloqueado`) mediante Supabase Auth.
- Recuperación y restablecimiento de contraseña via email.
- Notificaciones en tiempo real (Supabase Realtime) y por email simulado al cambiar estado.
- Log de auditoría: quién hizo qué y cuándo en acciones críticas.
- Exportar solicitudes a CSV (administrador).
- Panel de métricas básicas: solicitudes por tipo, tiempos promedio, tasa de resolución.
- **Módulo de Facturaciones** (Epic FACT-01, Sprints 9-10): emisión mensual de facturas (luz, agua, pensión, multas) y vista del residente para ver/marcar como pagadas.
- **Módulo de Tienda interna** (Epic TIENDA-01, Sprints 10-11): catálogo de productos comestibles/bebidas gestionado por admin; los pedidos del residente se suman a la factura mensual.
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
| `profiles` | `id`, `email`, `nombre`, `apellido`, `telefono`, `rol`, `piso`, `departamento`, `estado_cuenta`, `empresa_tercero`, `created_at`, `updated_at` | Perfil de usuario vinculado a Supabase Auth. Rol: `residente \| admin \| tecnico`. Estado: `pendiente \| activo \| bloqueado`. `empresa_tercero` (nullable) registra la empresa contratista del técnico externo. |
| `invitaciones` | `id`, `email`, `rol`, `nombre`, `piso`, `departamento`, `token`, `estado`, `creada_por`, `expires_at`, `created_at` | Invitaciones enviadas por el admin. Estado: `pendiente \| aceptada \| expirada`. Token expira en 48 h. |
| `edificios` | `id`, `nombre`, `direccion`, `pisos`, `unidades_por_piso`, `created_at` | Registro del edificio o condominio gestionado. |
| `unidades` | `id`, `edificio_id`, `numero`, `piso`, `descripcion`, `created_at` | Unidades del condominio (4B, 3A, Sala común, etc.). |
| `solicitudes` | `id`, `residente_id`, `unidad_id`, `tipo`, `categoria`, `descripcion`, `estado`, `prioridad`, `imagen_url`, `piso`, `departamento`, `confirmada_por_residente`, `intentos_resolucion`, `created_at`, `updated_at` | Solicitud de mantenimiento. `imagen_url` apunta al bucket `solicitudes-fotos` (Supabase Storage, ADR-005). `prioridad`: `Normal \| Urgente`, editable por admin desde el drawer. Estado: `pendiente \| asignada \| en_progreso \| resuelta \| cerrada`. `confirmada_por_residente` (boolean, default false) e `intentos_resolucion` (integer, default 0) implementan el flujo de confirmación del residente (ADR-008, migración `005_confirmacion_residente.sql`). |
| `asignaciones` | `id`, `solicitud_id`, `tecnico_id`, `asignado_por`, `fecha_asignacion`, `notas`, `empresa_tercero` | Registro de qué técnico atiende cada solicitud y quién asignó. `empresa_tercero` se usa cuando el técnico es contratista externo (ej. TecnoEdif SAC, Mantenex SRL) y se autocompleta desde el perfil al asignar. |
| `historial_estados` | `id`, `solicitud_id`, `estado_anterior`, `estado_nuevo`, `cambiado_por`, `nota`, `created_at` | Auditoría de cada cambio de estado en una solicitud. Toda mutación pasa por el helper centralizado `cambiarEstadoSolicitud()` que inserta aquí + en `audit_log` en transacción. |
| `notificaciones` | `id`, `usuario_id`, `solicitud_id`, `tipo`, `mensaje`, `leida`, `created_at` | Cola de notificaciones. Tipo: `estado_cambio \| asignacion \| nueva_solicitud \| sistema`. |
| `audit_log` | `id`, `usuario_id`, `accion`, `entidad`, `entidad_id`, `resultado`, `created_at` | Log de auditoría general. Solo IDs (sin PII directa). `resultado`: `exitoso \| fallido`. Visible solo para admin. |

**Tablas planificadas para Epics futuros** (Sprints 9-11):

| Tabla | Epic | Sprint | Descripción |
|---|---|---|---|
| `facturas` | FACT-01 | 9 | Facturas mensuales por residente. Tipos: luz, agua, pensión, multas. Estados: pendiente, pagada, vencida. |
| `productos` | TIENDA-01 | 10 | Catálogo de productos del edificio (comestibles, bebidas) con stock y precio. |
| `pedidos` | TIENDA-01 | 11 | Pedidos del residente desde la tienda; al cerrar el mes genera línea en `facturas`. |
| `pedido_items` | TIENDA-01 | 11 | Detalle de los productos de cada pedido. |

> **Decisión de Unidad vs. Perfil (resuelta en Sprint 3):** Se eligió la opción (b): la unidad se infiere de `piso`+`departamento` del perfil del residente. La tabla `solicitudes` mantiene `unidad_id` nullable como FK opcional para compatibilidad futura, y duplica `piso`+`departamento` para mostrar la ubicación sin joins. La tabla `unidades` queda como catálogo formal disponible para Sprints futuros si se requiere normalizar.

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
| Asignar técnico (interno o empresa tercera) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Actualizar estado | ❌ | ✅ | ✅ (asignadas: `en_progreso` / `resuelta`) | ❌ | ❌ |
| Confirmar / rechazar solución del técnico | ✅ (solo suyas) | ❌ | ❌ | ❌ | ❌ |
| Activar/bloquear cuentas | ❌ | ✅ | ❌ | ❌ | ❌ |
| Ver audit log | ❌ | ✅ | ❌ | ❌ | ❌ |
| Exportar CSV | ❌ | ✅ | ❌ | ❌ | ❌ |
| Ver métricas | ❌ | ✅ | ❌ | ❌ | ❌ |
| Emitir factura mensual (Sprint 9+) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Crear pedido en tienda (Sprint 11+) | ✅ | ❌ | ❌ | ❌ | ❌ |

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
| RF-06 | Residente | Quiero crear una solicitud indicando tipo, categoría, descripción, prioridad y **foto obligatoria del problema** (capturada desde la cámara móvil o galería) para notificar al admin con evidencia visual. | Formulario con validación. Foto en JPEG/PNG (≤ 5 MB) subida a Supabase Storage. Botón "Tomar foto" con `capture="environment"` como CTA principal en móvil (viewport ≤ 640px). Confirmación con ID. Estado inicial: `pendiente`. Unidad inferida del perfil. | 8 pts |
| RF-07 | Residente | Quiero ver el historial de mis solicitudes con estado actual y fecha. | Lista cronológica. Filtro por estado. Detalle con historial de cambios de estado (componente `HistorialEstados` reutilizable). | 5 pts |
| RF-08 | Residente | Quiero recibir una notificación cuando el estado de mi solicitud cambie. | Notificación en pantalla (Realtime). Email simulado. Marcar como leída. | 5 pts |
| RF-08b | Residente | Quiero confirmar o rechazar la solución propuesta por el técnico antes de que la solicitud se cierre, para validar que el problema fue efectivamente corregido. | Sección "Pendientes de tu confirmación" en `/residente`. Confirmar → estado `cerrada` + `confirmada_por_residente=true`. Rechazar → estado `en_progreso` con nota obligatoria (≥ 20 chars), `intentos_resolucion += 1`. Tras 3 rechazos: escala al admin (estado → `pendiente`, badge "ESCALADA"). ADR-008. | 5 pts |

### 5.3 Módulo de Gestión (Administrador)

| ID | Rol | Historia | Criterios clave | Estimación |
|---|---|---|---|---|
| RF-09 | Administrador | Quiero ver todas las solicitudes con filtros por estado, tipo y técnico para priorizar. | Panel con tabla. Filtros combinables. Ordenar por fecha/urgencia. Miniatura de foto. Drawer de detalle. | 8 pts |
| RF-10 | Administrador | Quiero asignar una solicitud a un técnico (interno o de empresa tercera) con una nota de instrucción. | Dropdown agrupado por `empresa_tercero` del perfil (Internos / TecnoEdif SAC / Mantenex SRL / Otros). Solo técnicos con `rol=tecnico` y `estado_cuenta=activo`. Nota opcional (≤ 300 chars). Inserta en `asignaciones`, cambia estado a `asignada`, registra en `historial_estados` y `audit_log`. Si la solicitud ya está asignada, el botón se convierte en "Reasignar". | 5 pts |
| RF-11 | Administrador | Quiero cambiar el estado de cualquier solicitud. | Cambio de estado con nota obligatoria. Registro en `historial_estados`. | 3 pts |
| RF-12 | Administrador | Quiero exportar las solicitudes del mes a CSV. | Exporta por rango de fechas. Campos definidos. Solo admin. | 3 pts |
| RF-13 | Administrador | Quiero ver métricas básicas para entender el volumen y eficiencia del mantenimiento. | KPIs: total, por estado, por tipo, tiempo promedio resolución. | 5 pts |

### 5.4 Módulo de Tareas (Técnico)

| ID | Rol | Historia | Criterios clave | Estimación |
|---|---|---|---|---|
| RF-14 | Técnico | Quiero ver solo las solicitudes que me asignaron con foto, descripción y ubicación. | Lista filtrada por `tecnico_id = auth.uid()` (RLS). Cards con miniatura, tipo, prioridad (badge), unidad, descripción truncada (80 chars) y fecha. Detalle con foto en grande, descripción completa, datos del residente, nota del admin e historial. | 5 pts |
| RF-15 | Técnico | Quiero actualizar el estado de una solicitud asignada y agregar una nota de trabajo. | Transiciones permitidas: `asignada → en_progreso` (nota opcional) y `en_progreso → resuelta` (nota obligatoria, 20-500 chars, validado en frontend y RLS). El estado `resuelta` NO cierra la solicitud — queda pendiente de confirmación del residente (ADR-008). | 3 pts |

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
| PBI-06 | Historia | P1 | Como residente, quiero crear una solicitud con tipo, categoría, descripción y **foto obligatoria** para notificar al admin con evidencia visual. | Formulario válido + foto en Supabase Storage + confirmación + estado Pendiente + seed demo | 8 | ✅ v1 (Sprint 3) |
| PBI-07 | Historia | P1 | Como admin, quiero ver todas las solicitudes con filtros para gestionar el mantenimiento. | Panel con filtros estado/tipo + ordenamiento + miniatura de foto + drawer de detalle | 8 | ✅ v1 (Sprint 3) |
| PBI-08 | Historia | P1 | Como admin, quiero asignar una solicitud a un técnico (interno o empresa tercera) con nota para delegar el trabajo. | Dropdown agrupado por empresa + nota opcional + registro en `asignaciones` + estado `asignada` + historial + audit log | 5 | ✅ HU-MANT-02 (Sprint 4) |
| PBI-09 | Historia | P1 | Como técnico, quiero ver mis solicitudes asignadas y actualizar su estado para informar avance. | Vista `/tecnico` filtrada por `tecnico_id` + detalle con foto + transiciones `asignada→en_progreso→resuelta` + nota cierre obligatoria | 5 | ✅ HU-MANT-03 + HU-MANT-04 (Sprint 4) |
| PBI-10 | Historia | P1 | Como residente, quiero ver el historial de mis solicitudes para saber si fueron atendidas. | Lista con filtro estado + detalle con historial de cambios (componente `HistorialEstados`) | 5 | ✅ HU-MANT-05 (Sprint 4) |
| PBI-11 | Historia | P1 | Como curso, quiero que el entorno demo use datos sintéticos y no exponga PII real. | Seed ficticio + política no-PII + seudonimización en logs | 5 | Pendiente (Sprint 11) |
| PBI-12 | Historia | P2 | Como residente, quiero recibir notificaciones cuando cambie el estado de mi solicitud. | Realtime en pantalla + email simulado + marcar leída | 5 | Pendiente (Sprint 6) |
| PBI-13 | Historia | P2 | Como admin, quiero registrar cambios de estado con nota para tener trazabilidad. | Tabla `historial_estados` + registro automático via helper `cambiarEstadoSolicitud()` + visible en detalle | 5 | 🔄 Parcial — helper centralizado y visualización ✅ (Sprint 4). Notas obligatorias en transiciones críticas → Sprint 5 |
| PBI-14 | Historia | P2 | Como sistema, quiero log de auditoría de acciones críticas para diagnóstico y control. | Tabla `audit_log` + insertar en crear/asignar/cerrar/confirmar/rechazar + vista admin | 5 | 🔄 Parcial — inserción automática ✅ (Sprint 4). Vista admin → Sprint 5 (HU-AUDIT-01) |
| PBI-15 | Historia | P2 | Como técnico, quiero agregar una nota de cierre al resolver una solicitud para documentar el trabajo. | Nota obligatoria (≥ 20 chars) al marcar `resuelta` + guardado en `historial_estados` | 3 | ✅ HU-MANT-04 (Sprint 4) |
| PBI-16 | Historia | P2 | Como dev, quiero README e instrucciones claras para correr el proyecto y los tests. | README prereqs + correr local + correr tests + seed demo | 3 | Continuo |
| PBI-17 | Historia | P2 | Como admin, quiero exportar solicitudes a CSV para llevar registro externo. | Exporta por rango fechas + campos definidos + solo admin | 3 | Pendiente (Sprint 9) |
| PBI-18 | Historia | P2 | Como admin, quiero activar o bloquear cuentas de usuarios para controlar accesos. | Panel usuarios + cambio estado_cuenta + efecto inmediato en sesión (Edge Function `bloquear-cuenta`) | 5 | ✅ (Sprint 2 + extensión Sprint 3) |
| PBI-19 | Historia | P2 | Como sistema, quiero E2E para flujos críticos para detectar regresiones automáticamente. | E2E: crear solicitud, asignar, cerrar — corre en CI | 5 | Pendiente (Sprint 7) |
| PBI-20 | Spike | P2 | Realizar threat model ligero + checklist OWASP aplicable al producto. | Diagrama flujo datos + amenazas top 5-8 + checklist 10 controles + ADR | 3 | 🔄 Parcial — A01/A03/A07 ✅ (Sprint 4). Completo → Sprint 7 |
| PBI-21 | Chore | P2 | Configurar despliegue automático a staging al mergear a main (CD). | Merge a main → deploy Vercel + smoke test + secretos seguros | 3 | Pendiente (Sprint 8) |
| PBI-22 | Historia | P3 | Como dueño del edificio, quiero ver métricas de solicitudes para entender la eficiencia del mantenimiento. | KPIs: total, por estado, por tipo, tiempo promedio + solo admin | 5 | Pendiente (Sprint 9) |

### 7.1 Historias del Sprint 4 (Mantenimiento v2)

| ID | Tipo | Prior. | Descripción | Pts/h | Estado |
|---|---|---|---|---|---|
| HU-MANT-02 | Historia | P1 | Como admin, quiero asignar una solicitud a un técnico (interno o de empresa tercera) con nota de instrucción. | 3.5 h | ✅ Sprint 4 |
| HU-MANT-03 | Historia | P1 | Como técnico, quiero ver mis solicitudes asignadas con foto, descripción y datos de la unidad. | 2.5 h | ✅ Sprint 4 |
| HU-MANT-04 | Historia | P1 | Como técnico, quiero actualizar el estado de una solicitud asignada y agregar una nota de cierre obligatoria. | 2 h | ✅ Sprint 4 |
| HU-MANT-05 | Historia | P2 | Como residente/admin/técnico, quiero ver el historial completo de cambios de estado con autor y fecha. | 2 h | ✅ Sprint 4 |
| HU-MANT-06 ★ | Mejora | P1 | Como residente en celular, quiero tomar foto directamente con la cámara al reportar un problema. | 1 h | ✅ Sprint 4 |
| HU-MANT-07 ★ | Mejora | P1 | Como residente, quiero confirmar o rechazar la solución del técnico antes de que se cierre la solicitud. | 2 h | ✅ Sprint 4 |

★ Mejoras priorizadas tras feedback del profesor en el Sprint 3 Review.

### 7.2 PBIs emergentes del Sprint 4

| ID | Historia | Prior. | Est. | Sprint |
|---|---|---|---|---|
| PBI-S4-E01 | Notificar al admin cuando residente rechaza solución (cualquier rechazo, no solo tras 3) | P2 | 2 h | 6 |
| PBI-S4-E02 | Mostrar carga de trabajo del técnico (solicitudes activas) en dropdown de asignación | P2 | 1 h | 5 |
| PBI-S4-E03 | Spike: asignaciones múltiples por solicitud (1 a N técnicos) | P3 | 3 h | Sin asignar |
| PBI-S4-E04 | Permitir adjuntar foto al rechazar solución del técnico | P2 | 1 h | 5 |
| PBI-S4-E05 | Vista del técnico con historial agregado por unidad (detección de patrones) | P3 | 3 h | 10 |

### 7.3 Epic FACT-01 — Módulo de Facturaciones (Sprints 9-10)

> Origen: feedback del profesor en Sprint 4 Review. Permitir al admin emitir facturas mensuales (luz, agua, pensión, multas) y al residente ver/marcar como pagadas.

| ID | Historia | Prior. | Est. | Sprint |
|---|---|---|---|---|
| HU-FACT-01 | Modelado BD: tabla `facturas` con tipos de servicio, monto, vencimiento, estado | P1 | 2 h | 9 |
| HU-FACT-02 | Admin emite factura mensual por residente (manual + opción "lote: emitir a todos") | P1 | 3 h | 9 |
| HU-FACT-03 | Residente ve sus facturas: pendientes, pagadas, vencidas. Detalle con desglose | P1 | 2 h | 9 |
| HU-FACT-04 | Admin marca factura como pagada (registro manual del cobro) + recordatorios automáticos (email/Realtime) | P1 | 3 h | 10 |

### 7.4 Epic TIENDA-01 — Módulo de Tienda interna (Sprints 10-11)

> Origen: feedback del profesor en Sprint 4 Review. Permitir al residente pedir productos comestibles/bebidas del catálogo del edificio. **Depende de Epic FACT-01**: los pedidos se cobran junto con la pensión a fin de mes.

| ID | Historia | Prior. | Est. | Sprint |
|---|---|---|---|---|
| HU-TIENDA-01 | Modelado BD: tablas `productos`, `pedidos`, `pedido_items` + RLS | P1 | 2 h | 10 |
| HU-TIENDA-02 | Admin gestiona catálogo: alta/baja/stock/precio de productos | P1 | 3 h | 10 |
| HU-TIENDA-03 | Residente navega catálogo y crea pedido (carrito simple, sin pago en línea) | P1 | 3 h | 11 |
| HU-TIENDA-04 | Pedido genera línea en factura mensual del residente automáticamente | P1 | 3 h | 11 |

---

## 8. Roadmap de 16 semanas

> **Filosofía del roadmap:** Cada Sprint cierra con un entregable visible y demostrable al profesor. La Semana 1 fue de introducción al curso (sin Sprint formal); el trabajo técnico arrancó en la Semana 2. Tras el Sprint 4 Review, el roadmap se ajustó para incorporar los Epics FACT-01 (Facturación) y TIENDA-01 (Tienda interna) sugeridos por el profesor.

| Sem. | Sprint | Objetivo del Sprint | PBIs | Entregable verificable | DoD |
|---|---|---|---|---|---|
| 1 | — | Introducción al curso (sin Sprint formal) | — | Presentación del equipo + definición del producto | — |
| 2 | S0 | Arranque técnico y decisiones base | PBI-01, PBI-02, PBI-03 | Repo + CI verde + ADRs + tipos de DB + estructura de proyecto | v1 ✅ |
| 3 | S1 | Autenticación completa y rutas protegidas | PBI-04, PBI-05 | Login/registro 2 pasos/recovery + RLS + redirect por rol + staging | v1 ✅ |
| 4 | S2 | Modelamiento BD + panel admin + gestión de usuarios | PBI-02 (refinado), PBI-18 | BD completa + panel admin con tabla filtrable + invitaciones + bloqueo | v1 ✅ |
| 5 | S3 | Mantenimiento v1: crear solicitud con foto + vista admin | PBI-06, PBI-07 | Formulario con foto en Supabase Storage + drawer admin + filtros | v1 ✅ |
| 6 | S4 | Mantenimiento v2: asignación + vista técnico + cierre + **cámara móvil ★** + **confirmación residente ★** | HU-MANT-02, 03, 04, 05, 06, 07 | Flujo end-to-end: residente crea con cámara → admin asigna (interno/empresa tercera) → técnico cierra con nota → residente confirma. ADR-008 aplicado | v2 ✅ (78%) |
| 7 | S5 | Trazabilidad: historial admin completo + audit log visible + perfil editable + emergentes Sprint 4 (E02, E04) | PBI-13, PBI-14, HU-AUDIT-01, PBI-S2-E03, PBI-S4-E02, PBI-S4-E04 | Audit log con filtros + historial completo en detalle + perfil editable + carga técnico en dropdown + foto al rechazar | v2 |
| 8 | S6 | Notificaciones en tiempo real + email simulado + foto cierre técnico + alertas residente rechaza | PBI-12, PBI-S3-E01, PBI-S4-E01 | Realtime activo en 3 dashboards + centro de notificaciones + email simulado + alerta admin en rechazo | v2 |
| 9 | S7 | Calidad: Playwright + suite E2E + threat model + OWASP completo | PBI-19, PBI-20, PBI-S3-E02 | Suite E2E en CI + threat model + checklist OWASP top 10 + soporte HEIC | v2 |
| 10 | S8 | CD: despliegue continuo a staging + `/health` + smoke tests | PBI-21 | Deploy automático + endpoint `/health` + rollback documentado | v2 |
| 11 | S9 | Métricas + CSV + **Facturación v1** (BD + admin emite + residente ve) | PBI-17, PBI-22, HU-FACT-01, 02, 03 | Dashboard de KPIs con gráficas + exportación CSV + módulo facturas operativo | v2 |
| 12 | S10 | Hardening + **Facturación v2** (cobros + recordatorios) + **Tienda v1** (BD + admin gestiona catálogo) | Emergentes, HU-FACT-04, HU-TIENDA-01, 02, PBI-S4-E05 | Refactor Edge Functions + factura como pagada + catálogo gestionable + historial por unidad | v2 |
| 13 | S11 | Privacidad reforzada + **Tienda v2** (carrito + integración con factura mensual) | PBI-11, HU-TIENDA-03, 04 | Política PII completa + workflow `clean:staging` + cero PII en logs + carrito residente + facturación automática | v3 |
| 14 | S12 | Performance y robustez (incluye optimización de nuevos módulos) | Emergentes | Lighthouse ≥ 80 + k6 50 usuarios + code splitting | v3 |
| 15 | S13 | Seguridad y observabilidad | Emergentes | OWASP completo + logging estructurado + alertas Vercel | v3 |
| 16 | S14 | ★ Twilio Verify (sorpresa) + Release Candidate + Demo final (incluye Facturación y Tienda) | HU-AUTH-07 | 2FA SMS real funcionando + tag `v1.0.0-rc` + manual operativo + demo grabada + retro del curso | v3 |

**Progreso acumulado al cierre del Sprint 4:** 67 horas invertidas en 5 sprints (S0 → S4) con velocidad promedio 13.4 h/sprint. Restan ~130 horas estimadas en 10 sprints.

★ Mejoras integradas en Sprint 4 tras feedback del profesor en Sprint 3 Review.

---

## 9. Definición de Terminado (DoD)

### DoD v1 — Semanas 2–5 · *"Baseline funcional y reproducible"*

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
| Cuentas pendientes acumuladas sin activar | Baja | Media | Usuarios registrados que no pueden usar el sistema | Admin recibe notificación de cuenta nueva; gestión de cuentas implementada en Sprint 2 (panel admin con filtro por estado y tiempo de invitación). |
| Playwright no disponible a tiempo (Sprint 7) | Media | Media | Dependencia de instalación y configuración nueva | Reservar tiempo de setup en Sprint 7; E2E manual como fallback temporal. |
| Bucle de rechazos del residente (rechazo recurrente) | Baja | Media | Solicitud con `intentos_resolucion` creciendo sin cerrarse | Tope de 3 rechazos: tras el tercero, la solicitud vuelve a `pendiente` y escala al admin con badge "ESCALADA AL ADMIN" (ADR-008). |
| UPDATE directo a `solicitudes` sin pasar por helper centralizado | Media | Alta | Cambios de estado sin entrada en `historial_estados` o `audit_log` | Helper `cambiarEstadoSolicitud()` único punto de mutación; test de integración verifica que toda transición genera entrada en `historial_estados`; code review obligatorio para PRs que toquen tabla solicitudes. |
| Captura desde cámara con diferencias entre navegadores móviles | Media | Bajo | Inconsistencias visuales o errores en iOS Safari vs Android Chrome | Atributo `capture="environment"` validado en celulares físicos del equipo; degradación elegante a selector de archivo si no se soporta; comportamientos documentados en `/docs/solicitudes.md`. |
| Cobertura de tests insuficiente al entrar nueva DoD | Media | Medio | Threshold del coverage gate falla al cierre del Sprint | Acción de mejora del Sprint 4 Retro: dedicar 1 h del Sprint anterior a auditar cobertura antes de cualquier transición de DoD. |

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

### ADR-005 — Manejo de imágenes con Supabase Storage

| Campo | Detalle |
|---|---|
| Estado | Aprobado — Sprint 3 |
| Contexto | El módulo de mantenimiento requiere que los residentes adjunten fotos de los problemas. Se necesita almacenamiento de archivos seguro, accesible por rol y con limpieza automática. |
| Opciones | A) **Supabase Storage** (seleccionada) · B) Cloudinary (requiere cuenta de pago para más de 25 créditos) · C) Base64 en BD (descartada: infla la BD y degrada rendimiento) |
| Decisión | Supabase Storage con bucket privado `solicitudes-fotos`. URLs firmadas con expiración de 1 hora para visualización. Limpieza automática con trigger al eliminar solicitud. Formatos aceptados: JPEG/PNG, máx. 5 MB. |
| Consecuencias | Requiere variable de entorno `SUPABASE_SERVICE_ROLE_KEY` para operaciones admin (subida con políticas). Se maneja en GitHub Secrets y Edge Function para no exponer en frontend. |
| Evidencia | Bucket creado + políticas de acceso documentadas en `/docs/storage.md` + seed con imágenes de picsum.photos + flujo de creación de solicitud demostrado en Sprint 3 Review. |

### ADR-006 — Framework de E2E: Playwright (planificado Sprint 7)

| Campo | Detalle |
|---|---|
| Estado | Planificado — Sprint 7 |
| Contexto | Desde DoD v3 se exige una suite E2E que cubra los 3 flujos críticos (crear solicitud, asignar, cerrar) corriendo como gate de merge en CI. |
| Opciones | A) **Playwright** (planificada) · B) Cypress · C) E2E manual permanente |
| Decisión | Playwright por su soporte nativo multi-navegador (Chromium + Firefox), generación de videos/screenshots, integración limpia con GitHub Actions y trace viewer. |
| Consecuencias | Tiempo de setup en Sprint 7. Requiere fallback de E2E manual si la instalación se desborda en horas. ADR formal se redactará en Sprint 7 al instalar. |
| Evidencia | Pendiente — instalación + 3 escenarios E2E corriendo en CI al cierre del Sprint 7. |

### ADR-007 — Twilio Verify para 2FA SMS (planificado Sprint 14)

| Campo | Detalle |
|---|---|
| Estado | Aprobado por PO — Implementación planificada Sprint 14 (Semana 16, cierre del curso) |
| Contexto | Cotización presentada por PO en Sprint 3 Planning: Twilio Verify API a $0.05 USD/verificación con $15 de crédito inicial. Se reservó intencionalmente para el cierre del curso como integración estelar de la demo final. |
| Opciones | A) **Twilio Verify** (seleccionada) · B) Email-based 2FA (más simple, menos impactante) · C) Sin 2FA |
| Decisión | Twilio Verify para 2FA opcional en cuentas admin. Implementación reservada para Sprint 14 como sorpresa de la demo final. Costo estimado para todo el curso: $5–10 USD. |
| Consecuencias | Requiere validación previa con número del equipo en Sprint 13. Tener video pregrabado del 2FA como fallback por si falla la red móvil durante la demo. ADR formal se completa en Sprint 14 al implementar. |
| Evidencia | Pendiente — flujo 2FA SMS funcional con número real del equipo, demostrado en demo final. |

### ADR-008 — Confirmación del residente al cierre de solicitudes

| Campo | Detalle |
|---|---|
| Estado | Aprobado — Sprint 4 |
| Contexto | En el Sprint 3 Review el profesor sugirió que el residente debe confirmar que el problema fue efectivamente corregido antes de marcar la solicitud como cerrada. Sin esto, el técnico podía marcar como `resuelta` sin que el residente lo sepa, generando posible insatisfacción no detectada. |
| Opciones | A) Cierre automático tras 48 h sin objeción (descartada: el residente puede no entrar al sistema en ese tiempo). · B) **Confirmación explícita del residente** (seleccionada). · C) Confirmación obligatoria del admin (descartada: aumenta carga del admin sin valor). |
| Decisión | Tras `resuelta` por el técnico, el residente recibe la solicitud en una sección "Pendientes de tu confirmación" en `/residente`. Puede **Confirmar** (`estado → cerrada`, `confirmada_por_residente=true`) o **Rechazar** (`estado → en_progreso` + nota obligatoria ≥ 20 chars, `intentos_resolucion += 1`). Tras 3 rechazos consecutivos escala al admin (`estado → pendiente`, badge "ESCALADA AL ADMIN"). |
| Consecuencias | Nueva columna `confirmada_por_residente` (boolean, default `false`) y `intentos_resolucion` (integer, default `0`) en tabla `solicitudes`. RLS del residente permite UPDATE solo del campo de confirmación y la transición `resuelta → en_progreso`. Helper centralizado `cambiarEstadoSolicitud()` orquesta todas las transiciones y garantiza inserción en `historial_estados` + `audit_log`. |
| Evidencia | Migración `005_confirmacion_residente.sql` aplicada en Supabase. Flujo demostrado en Sprint 4 Review: Laura Vega confirma ZIT-002 (cierra exitosamente) y rechaza ZIT-003 (vuelve a `en_progreso`). 8 tests de integración cubren los 4 flujos (asignar, resolver, confirmar, rechazar). |

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

> Última actualización: Semana 6 — Sprint 4 cerrado (DoD v2 al 78%). Próximo: Sprint 5 (Semana 7) — Trazabilidad: historial admin completo + audit log visible + perfil editable.

| Módulo | Componentes / Archivos | Estado |
|---|---|---|
| Infraestructura | Repo GitHub + CI (ESLint + Vitest + **Vitest coverage threshold 50%**) + Vite + TailwindCSS v4 + TypeScript | ✅ Completo (Sprint 0, coverage gate desde Sprint 4) |
| Tipos de dominio | `src/types/database.ts` — Profile, Invitacion, Edificio, Unidad, Solicitud (con `confirmada_por_residente` e `intentos_resolucion`), Asignacion, HistorialEstado, Notificacion, AuditLog | ✅ Completo (Sprint 0/2/4) |
| Supabase client | `src/lib/supabase.ts` | ✅ Completo (Sprint 0) |
| AuthContext | `src/contexts/AuthContext.tsx` — signIn, signUp, signOut, resetPassword, updatePassword, fetchProfile | ✅ Completo (Sprint 1) |
| Páginas de auth | Login, Register (2 pasos), ForgotPassword, ResetPassword, VerifyEmail, EmailVerified, Activar | ✅ Completo (Sprint 1) |
| Routing + protección | App.tsx con React Router v7, ProtectedRoute, GuestRoute, RootRedirect | ✅ Completo (Sprint 1) |
| Modelamiento BD | Migraciones completas: `profiles`, `invitaciones`, `edificios`, `unidades`, `solicitudes`, `asignaciones`, `historial_estados`, `notificaciones`, `audit_log`. Migración `005_confirmacion_residente.sql` (ADR-008) aplicada en Sprint 4 | ✅ Completo (Sprint 2/4) |
| AdminDashboard | Shell con stats + accesos rápidos + navegación a Usuarios y Solicitudes | ✅ Completo (Sprint 2/3) |
| AdminUsuarios | `/admin/usuarios` — tabla con filtros por rol/estado, tiempo desde invitación, badge de estado | ✅ Completo (Sprint 2) |
| AdminSolicitudes | `/admin/solicitudes` — tabla con miniaturas + drawer de detalle + filtros por estado/tipo + edición de prioridad + **botón Asignar/Reasignar con modal `AsignarTecnicoModal`** (dropdown agrupado por empresa) | ✅ Completo (Sprint 3/4) |
| Edge Functions | `invitaciones` (crear + envío email Resend), `bloquear-cuenta` (cambio estado + invalidación de sesión) | ✅ Completo (Sprint 2/3) |
| ResidenteDashboard | Shell + formulario "Nueva solicitud" con foto obligatoria + lista del residente + **sección "Pendientes de tu confirmación"** con badge "PENDIENTE TU CONFIRMACIÓN" + componentes `ConfirmarSolucion` y `RechazarSolucion` | ✅ Completo (Sprint 3/4) |
| TecnicoDashboard | `/tecnico` con lista de solicitudes asignadas filtrada por `tecnico_id` (RLS) + detalle con foto en grande, datos del residente, nota del admin e historial + componente `CambiarEstadoTecnico` con transiciones válidas | ✅ Completo (Sprint 4) |
| Solicitudes (crear con foto) | Formulario completo con Supabase Storage + validación + preview + indicador de progreso + **botón "Tomar foto" con `capture="environment"`** como CTA principal en móvil (matchMedia ≤ 640px) | ✅ Completo (Sprint 3/4) |
| Supabase Storage | Bucket `solicitudes-fotos` con políticas RLS + URLs firmadas + nomenclatura por solicitud | ✅ Completo (Sprint 3) |
| Asignaciones | Tabla operativa + `AsignarTecnicoModal` + autocompletado de `empresa_tercero` desde el perfil + registro en `historial_estados` y `audit_log` via helper | ✅ Completo (Sprint 4) |
| Helper de estados | `src/lib/solicitudes.ts` → `cambiarEstadoSolicitud(solicitudId, nuevoEstado, nota, usuarioId)` centralizada. Inserta en `historial_estados` + `audit_log` en transacción. Cobertura tests: 64% | ✅ Completo (Sprint 4) |
| Confirmación del residente | Flujo `resuelta → cerrada` (confirmar) o `resuelta → en_progreso` (rechazar con nota). Escalado tras 3 rechazos a `pendiente`. ADR-008 documentado | ✅ Completo (Sprint 4) |
| Componente HistorialEstados | Línea de tiempo reutilizable en los 3 dashboards (admin, residente, técnico) con política de privacidad de autor según rol del observador | ✅ Completo (Sprint 4) |
| Tests de integración | 8 tests para flujos críticos (asignar, resolver, confirmar, rechazar) con cobertura 64% en `src/lib/solicitudes.ts` | ✅ Completo (Sprint 4) |
| Checklist OWASP | A01 (acceso roto), A03 (inyección), A07 (auth y session) verificadas en `/docs/security/checklist.md` | 🔄 Parcial — completo en Sprint 7 |
| Audit log (vista admin) | Tabla creada y poblada automáticamente desde helper. Vista admin pendiente | ⏳ Planificado Sprint 5 (HU-AUDIT-01) |
| Perfil editable | — | ⏳ Planificado Sprint 5 (PBI-S2-E03) |
| Notificaciones Realtime | — | ⏳ Planificado Sprint 6 |
| Endpoint `/health` | — | ⏳ Planificado Sprint 8 (DoD v2 pendiente) |
| E2E (Playwright) | — | ⏳ Planificado Sprint 7 |
| CD (deploy staging automático) | — | ⏳ Planificado Sprint 8 |
| Exportación CSV | — | ⏳ Planificado Sprint 9 |
| Métricas / KPIs | — | ⏳ Planificado Sprint 9 |
| **Módulo Facturación (Epic FACT-01)** | — | ⏳ Planificado Sprints 9-10 |
| **Módulo Tienda interna (Epic TIENDA-01)** | — | ⏳ Planificado Sprints 10-11 |
| Twilio Verify (2FA SMS) | — | ⏳ Planificado Sprint 14 (★ sorpresa final) |

### 13.1 Estado de la DoD v2 al cierre del Sprint 4

| Criterio | Estado |
|---|---|
| Todo lo de DoD v1 (lint, unit tests, README, manejo errores, seed, deploy preview) | ✅ Cumplido |
| Pruebas de integración para flujos críticos (asignar, resolver, confirmar/rechazar) | ✅ Cumplido — 8 tests |
| Cobertura ≥ 60% en módulo `src/lib/solicitudes.ts` | ✅ Cumplido — 64% al cierre |
| Endpoint `/health` disponible en staging | ⏳ Pendiente — planificado Sprint 8 (CD) |
| Checklist OWASP aplicada a cambios relevantes | ✅ Cumplido — A01, A03, A07 |
| Variables de entorno via Secrets CI/CD — sin hardcode | ✅ Cumplido |
| Despliegue staging con verificación post-deploy | ⏳ Pendiente — planificado Sprint 8 (CD) |
| `tsc --noEmit` pasa sin errores en CI | ✅ Cumplido |
| ADR-008 documentado en `/docs/adr/008-confirmacion-residente.md` | ✅ Cumplido |

**Conclusión:** DoD v2 cumplida al 78% (7/9 criterios). Los 2 criterios pendientes están explícitamente planificados para Sprint 8. El equipo y el PO acuerdan tratarlo como "DoD v2 en transición" durante Sprints 4-7.

---

## 14. Glosario

| Término | Definición |
|---|---|
| Solicitud | Reporte de problema o mantenimiento creado por un residente. Entidad central del sistema. |
| Estado de solicitud | Ciclo de vida: `pendiente` → `asignada` → `en_progreso` → `resuelta` → `cerrada`. La transición de `resuelta` a `cerrada` requiere confirmación explícita del residente (ADR-008); el rechazo devuelve a `en_progreso` o escala a `pendiente` tras 3 rechazos. |
| Estado de cuenta | Estado del perfil de usuario: `pendiente` (recién registrado, sin acceso), `activo` (aprobado por admin), `bloqueado` (acceso suspendido). |
| Unidad | Departamento o espacio dentro del condominio (ej: 4B, Sala común, Estacionamiento 12). |
| Edificio | Registro del inmueble gestionado, con nombre, dirección, número de pisos y unidades. |
| Perfil | Entidad en la tabla `profiles` que extiende la cuenta de Supabase Auth con datos de negocio: nombre, rol, departamento, estado de cuenta, `empresa_tercero` (para técnicos contratistas). |
| Empresa tercera | Empresa contratista externa que provee técnicos al condominio (ej. TecnoEdif SAC, Mantenex SRL). Se registra en `profiles.empresa_tercero` y se autocompleta en `asignaciones.empresa_tercero` al asignar. |
| Confirmación del residente | Mecanismo introducido en Sprint 4 (ADR-008): tras `resuelta`, el residente debe confirmar o rechazar la solución antes de cerrar la solicitud. Implementado con columnas `confirmada_por_residente` e `intentos_resolucion`. |
| Helper `cambiarEstadoSolicitud()` | Función centralizada en `src/lib/solicitudes.ts` que orquesta toda transición de estado, insertando en `historial_estados` y `audit_log` en transacción. Evita UPDATE directos en componentes. |
| RLS | Row Level Security — política de Postgres que restringe qué filas puede ver/modificar cada usuario según su rol. |
| ADR | Architecture Decision Record — documento que registra una decisión técnica importante con contexto, opciones y consecuencias. |
| DoD | Definition of Done — criterios que debe cumplir un incremento para considerarse terminado. |
| PBI | Product Backlog Item — ítem del Product Backlog (historia, spike, bug, chore). |
| Epic | Conjunto de PBIs relacionados que entregan un módulo funcional completo (ej. FACT-01, TIENDA-01). |
| Seed | Script que carga datos ficticios en la base de datos para ejecutar demos reproducibles. |
| Staging | Entorno de pre-producción en Vercel donde se despliegan los incrementos para validación. |
| Edge Function | Función serverless de Supabase (Deno) para lógica que no puede vivir en frontend ni en triggers de DB. |
| GuestRoute | Componente React Router que redirige al dashboard si el usuario ya tiene sesión activa. |
| ProtectedRoute | Componente React Router que bloquea el acceso a rutas según rol y estado de cuenta. |
| `capture="environment"` | Atributo HTML estándar en `<input type="file">` que en navegadores móviles abre directamente la cámara trasera del dispositivo. Usado en `UploadFoto` para captura de fotos sin salir del navegador. |

---

*— Zity PRD v1.3 — Actualizado tras Sprint 4 Review (Semana 6) — Documento vivo · Actualizar en cada Sprint Review —*
