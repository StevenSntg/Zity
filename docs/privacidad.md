# Política de Privacidad — Zity

> Documento académico — Datos sintéticos sin PII real.
> Última actualización: Sprint 4 (Semana 6).

## 1. Principios base

| Principio | Aplicación en Zity |
|---|---|
| **Minimización** | Sólo se recolectan los datos necesarios para el flujo de mantenimiento: nombre, apellido, teléfono, piso, departamento. Sin documentos de identidad ni datos financieros. |
| **Datos sintéticos en staging** | Todo seed y entorno de staging usa nombres y emails ficticios (`@example.com`, `@test.local`). Prohibido subir datos reales de residentes al repositorio o a entornos compartidos. |
| **Seudonimización en logs** | `audit_log` y `historial_estados` usan `uuid` para identificar al actor (`usuario_id`, `cambiado_por`). El campo `detalles` (JSONB) no debe contener PII; sólo IDs o flags. |
| **Retención corta en staging** | El workflow `npm run seed:clean` se ejecuta semanalmente para reciclar datos de prueba. Staging no es producción. |
| **Repositorio limpio** | `.env`, `.env.local` y `service_role` keys en `.gitignore`. `.env.example` contiene valores ficticios documentados. |

## 2. Estados de cuenta y privacidad

| Estado | Datos visibles para el usuario | Persistencia |
|---|---|---|
| `pendiente` | El usuario ve solo su propio perfil (no puede operar). | Datos retenidos hasta activación o limpieza manual. |
| `activo` | Acceso completo según rol. | Datos visibles para admin (gestión) y para sí mismo. |
| `bloqueado` | Sin acceso. Datos preservados para historial. | El admin puede ver el perfil pero el usuario no inicia sesión. |

Bloquear o eliminar una cuenta no borra sus solicitudes históricas — preserva trazabilidad. Si fuera necesario un "derecho al olvido" en producción real, se ejecutaría una pseudonimización destructiva (campos `nombre`, `apellido`, `telefono` reemplazados por `[eliminado]`, manteniendo el `uuid`).

## 3. Visibilidad de nombres en historial de estados

> Decisión tomada en Sprint 4, Day 2 (Daily Scrum).

Cuando un residente o técnico abre el detalle de una solicitud y mira el historial de estados, **el nombre completo del autor de cada cambio no se debe revelar a roles ajenos**. Política aplicada:

| Rol observador | Etiqueta para autor *propio* | Etiqueta para *admin* | Etiqueta para *técnico* | Etiqueta para *residente* |
|---|---|---|---|---|
| Admin | "Tú" | "Admin Carlos Fuentes" (nombre completo) | "Técnico Mario Peña" (nombre completo) | "Residente Laura Vega" (nombre completo) |
| Residente | "Tú" | "Admin" | "Técnico Mario P." (apellido truncado a inicial) | n/a |
| Técnico | "Tú" | "Admin" | n/a | "Residente Laura V." (apellido truncado a inicial) |

Implementado en `src/components/shared/HistorialEstados.tsx` (función `etiquetaAutor`).

El `audit_log` no se ve afectado: sigue almacenando sólo `usuario_id` (uuid), sin nombres. Esta política es exclusivamente de **presentación**.

## 4. Datos en el módulo de solicitudes

| Campo | Sensibilidad | Visibilidad |
|---|---|---|
| `descripcion` | Baja-media (puede contener detalles del problema) | Residente dueño · técnico asignado · admin |
| `imagen_url` (foto del problema) | Variable (puede mostrar ubicación interna) | Bucket privado `solicitudes-fotos` · URLs firmadas con expiración 1h · misma RLS que la solicitud |
| `piso`, `departamento` | Media (PII operacional) | Mismo nivel que la solicitud |
| `nota` (historial de estados) | Variable | Sigue las reglas de la sección 3 |

## 5. Captura desde cámara móvil (HU-MANT-06)

El atributo `capture="environment"` en el input file abre la cámara trasera del dispositivo. La foto resultante:

- Se valida MIME (JPEG/PNG) y tamaño (≤ 5 MB) antes de subirse a Supabase Storage.
- Se almacena con el path determinístico `{residente_id}/{solicitud_id}/{timestamp}_{nombre}` en el bucket privado.
- **No se envía a ningún servicio externo.** Ni Cloudinary ni servicios de terceros — todo queda en Supabase.
- Se accede sólo vía URL firmada con expiración corta.

Ver `docs/solicitudes.md` para detalles del flujo y comportamientos por navegador.

## 6. Confirmación del residente (HU-MANT-07)

Cuando el residente confirma o rechaza una solución:

- La acción queda registrada en `audit_log` (`confirmar_solicitud` o `rechazar_solucion`) con `usuario_id = auth.uid()`.
- La nota del rechazo entra en `historial_estados.nota` y es visible para admin y técnico asignado.
- Tras 3 rechazos, la escalada genera un nuevo entry en `audit_log` (`escalada_solicitud`) con `detalles.intentos = 3, escalada = true`.

No se almacena información subjetiva ni metadata adicional (geolocalización, dispositivo, etc.).

## 7. Edge Functions y service_role

Las Edge Functions (`invitaciones`, `bloquear-cuenta`, `aceptar-invitacion`) usan `service_role`:

- La key vive sólo en variables de entorno de Supabase y GitHub Secrets — nunca en el código fuente ni en el frontend.
- Cada función valida el JWT del invocador antes de ejecutar operaciones privilegiadas.
- Las acciones del admin via Edge Function se auditan vía `audit_log` con `usuario_id = admin.id`.

## 8. Política de no-PII en repositorio

Cualquier commit que contenga PII real (emails de residentes reales, números de teléfono, direcciones específicas que identifiquen unidades fuera del set ficticio) **debe rechazarse en code review**. Para detectar accidentes:

- `.env.example` documenta el formato esperado sin valores reales.
- Los seeds usan plantillas ficticias bien identificables (Laura Vega, Carlos Fuentes, Mario Peña, etc.).
- En Sprint 11 (Privacidad reforzada) se añadirá un script de detección de PII como check de CI.

## 9. Referencias

- ADR-004 — Tabla `profiles` (`usuarios`) separada de `auth.users`
- ADR-005 — Manejo de imágenes con Supabase Storage (bucket privado + URLs firmadas)
- ADR-008 — Confirmación del residente
- `docs/db/rls.md` — políticas RLS detalladas
