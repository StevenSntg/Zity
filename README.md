# Zity

Sistema de gestion de solicitudes de mantenimiento para edificios y condominios.

## Prerequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- Cuenta de [Supabase](https://supabase.com/) (para base de datos y autenticacion)

## Configuracion de entorno

1. Copia el archivo de ejemplo de variables de entorno:

```bash
cp .env.example .env
```

2. Edita `.env` con las credenciales de tu proyecto Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

> Estas variables se obtienen desde el dashboard de Supabase en Settings > API.

## Correr localmente

```bash
npm install
npm run dev
```

La app estara disponible en `http://localhost:5173`.

## Ejecutar pruebas

```bash
# Tests en modo watch
npm test

# Tests una sola vez
npm run test:run

# Tests con reporte de cobertura
npm run test:coverage
```

## Lint

```bash
npm run lint
```

## Datos demo (seed)

```bash
npm run seed
```

Carga datos ficticios para demostracion. Sin PII real.

## Build para produccion

```bash
npm run build
npm run preview
```

## Stack

| Capa | Tecnologia |
|---|---|
| Frontend | React + Vite + TailwindCSS |
| Auth + DB | Supabase (Postgres + Auth + Realtime) |
| Deploy | Vercel |
| CI/CD | GitHub Actions |
| Testing | Vitest + Testing Library |

## Politica de datos

- Todos los datos de demo son ficticios.
- Prohibido subir PII real al repositorio.
- `.env` y `.env.local` estan en `.gitignore`.
