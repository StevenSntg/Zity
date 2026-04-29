# ADR-005 — Manejo de imágenes con Supabase Storage

| Campo | Valor |
|---|---|
| Estado | Aprobado — Sprint 3 |
| Fecha | Sprint 3, Semana 5 |
| Decisores | Scrum Team Zity |

## Contexto

El módulo de mantenimiento (Sprint 3+) requiere que los residentes adjunten fotos de los problemas reportados. La evidencia visual es obligatoria para que el administrador pueda priorizar correctamente sin necesidad de visitar la unidad. Necesitamos almacenamiento de archivos:

- Seguro: sólo el dueño, el admin y el técnico asignado pueden ver una foto.
- Accesible por rol: las URLs no deben ser indexables públicamente.
- Con limpieza prevista: si una solicitud se elimina, las fotos asociadas también deben eliminarse.

## Opciones evaluadas

| Opción | Pros | Contras |
|---|---|---|
| **A · Supabase Storage** (seleccionada) | Integrado con la auth y RLS del proyecto. URLs firmadas con caducidad. Política de objetos por bucket. Sin coste extra dentro del free tier. | Latencia de subida potencialmente más alta en free tier. Tamaño máximo de archivo configurable, pero limitado. |
| B · Cloudinary | Transformaciones server-side, CDN global. | Requiere cuenta de pago para más de 25 créditos. Auth desacoplada de Supabase. |
| C · Base64 en BD | Sin servicio adicional. | Infla la BD. Degrada queries. Tamaño práctico < 100 KB por imagen. Imposible firmar URLs. |

## Decisión

Usar **Supabase Storage** con un bucket privado dedicado por dominio:

- `solicitudes-fotos` para fotos de solicitudes de mantenimiento (Sprint 3).

Configuración del bucket:

| Atributo | Valor |
|---|---|
| `public` | `false` (sólo accesible vía URL firmada o autenticación) |
| `file_size_limit` | `5 MB` (aplicado tanto en frontend como en backend) |
| `allowed_mime_types` | `image/jpeg`, `image/png` |

Las URLs para visualización se generan con `createSignedUrls(paths, 3600)` — expiración de 1 hora. La app refirma cada vez que se renderiza la lista o el detalle.

## Nomenclatura de archivos

`{residente_id}/{solicitud_id}/{timestamp}_{nombre_original_seguro}`

El primer segmento (`residente_id`) es lo que las **storage policies** validan contra `auth.uid()` para evitar que un residente suba a la carpeta de otro.

El nombre original se "satiniza": minúsculas, espacios y caracteres no alfanuméricos a guiones, sin caracteres ASCII fuera del rango común.

## Storage policies (resumen)

| Acción | Quién | Condición |
|---|---|---|
| INSERT | authenticated | `bucket_id='solicitudes-fotos' AND foldername(name)[1] = auth.uid()::text` |
| SELECT | authenticated | `bucket_id='solicitudes-fotos'` (el control real lo dan las URLs firmadas y el RLS de `solicitudes`) |
| DELETE | authenticated | admin, o dueño de la carpeta |

Detalles completos en [`/docs/storage.md`](../storage.md).

## Variables de entorno

`SUPABASE_SERVICE_ROLE_KEY` (Edge Functions / scripts de seed) — configurada en GitHub Secrets, Vercel y `.env` local. Nunca se expone al frontend.

## Política de limpieza

Cuando se elimine una solicitud (UI prevista para Sprint 5+), un trigger `BEFORE DELETE` en `public.solicitudes` borrará el directorio `{residente_id}/{solicitud_id}/` del bucket `solicitudes-fotos`. La implementación se hará cuando exista la operación de borrado de solicitud — en Sprint 3 no aplica (no hay UI de eliminación).

## Política de uso de imágenes

**Documento académico, sin PII real.** En staging se usan únicamente fotos de dominio público (`picsum.photos`). Está prohibido subir fotos reales del equipo o de cualquier persona identificable mientras el proyecto siga siendo académico.

## Soporte HEIC

Por ahora se limita a JPEG/PNG. Conversión automática de HEIC (formato por defecto de iPhone) está planificada para Sprint 7+ (PBI-S3-E02).

## Consecuencias

- **Positivas:** auth y storage en una sola plataforma, costes acotados, URLs firmadas con TTL controlado.
- **Negativas:** dependencia operativa adicional de Supabase, free tier impone límite de 1 GB de storage del proyecto.

## Evidencia

- Bucket creado mediante migration `sprint3_storage_solicitudes_fotos_bucket`.
- Storage policies aplicadas vía la misma migration.
- Documentación en [`/docs/storage.md`](../storage.md).
- Demo de Sprint Review: solicitud `ZIT-001` creada por Laura Vega, foto visible para el admin Carlos Fuentes.
