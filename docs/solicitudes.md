# Guía de comportamiento: subida de fotos en solicitudes

## Atributo `capture="environment"` — Comportamiento por plataforma

El componente `UploadFoto` usa un `<input type="file" capture="environment">` para el botón **Tomar foto** en dispositivos móviles. El atributo `capture` indica al navegador que debe preferir la cámara del dispositivo en lugar del selector de archivos.

### Android Chrome

- Abre directamente la **cámara trasera** del dispositivo.
- Ofrece un botón para cambiar a la **cámara frontal** dentro de la UI de cámara.
- Una vez capturada la foto, la devuelve al formulario sin salir del navegador.
- La foto se comprime según la configuración del sistema; si supera 5 MB, el componente la rechaza con mensaje claro.

### iOS Safari

- Muestra un **menú de acción nativo** con las opciones:
  - _Tomar foto_
  - _Tomar video_ (ignorado — el `accept` filtra a imagen)
  - _Elegir desde la fototeca_
  - _Seleccionar archivo_
- Al elegir "Tomar foto", abre la cámara nativa de iOS.
- **Nota**: iOS comprime automáticamente las fotos capturadas con la cámara (HEIC → JPEG en entrega al navegador), por lo que rara vez superan el límite de 5 MB.

### Desktop (Chrome, Firefox, Edge, Safari)

- El atributo `capture` es **ignorado** por los navegadores de escritorio.
- El botón actúa exactamente igual que el botón _Elegir archivo_: abre el selector de archivos del sistema operativo.
- **No se muestra error ni advertencia** — la degradación es elegante y transparente para el usuario.
- El botón _Tomar foto_ **no se renderiza en desktop** (oculto por detección de viewport `matchMedia("(max-width: 640px)")`), por lo que este caso solo ocurre si el CSS o el JS de detección fallan.

---

## Validaciones aplicadas a ambos flujos

Sin importar si la foto viene de **galería** o **cámara**, se aplican las mismas reglas:

| Regla | Detalle |
|---|---|
| Tipos permitidos | `image/jpeg`, `image/png` |
| Tamaño máximo | 5 MB |
| Manejo de error | Mensaje inmediato bajo el componente, `onCambio(null)` |

---

## Notas de implementación

- La detección de móvil usa `window.matchMedia('(max-width: 640px)')` con listener para reaccionar al cambio de orientación del dispositivo.
- En el entorno de tests (jsdom), `matchMedia` no existe de forma nativa — el componente hace guard `typeof window.matchMedia === 'function'` para evitar el crash y asumir desktop.
- Referencia de la especificación: [HTML Living Standard — `capture`](https://html.spec.whatwg.org/multipage/input.html#dom-input-capture)
