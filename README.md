# Demo i18n con Vite + React + Express

## Objetivo del repositorio

Este proyecto demuestra una estrategia de internacionalizacion orientada a archivos estaticos:

- Generar una build independiente por idioma con Vite.
- Servir siempre la URL raiz (`/`) sin exponer prefijos de idioma (`/en`, `/es`, etc.).
- Resolver idioma en servidor usando prioridad por cookie y fallback automatico.
- Permitir pruebas manuales de idioma en produccion con un selector visible solo en build.

## Arquitectura de la solucion

### 1) Build multi-idioma en Vite

Se implementa un plugin personalizado en `plugins/vite-multi-i18n-build.ts`.

Funcionamiento:

1. Detecta idiomas leyendo carpetas dentro de `i18n/<locale>/`.
2. Durante el build principal, apunta el alias `i18n` a `i18n/en` (idioma base).
3. En `closeBundle`, ejecuta builds adicionales programaticos con `build()` de Vite,
   cambiando el alias a cada locale.
4. Cada idioma se escribe en `dist/<locale>`.

Resultado esperado:

```
dist/
  en/
  es/
  pt/
  fr/
  de/
```

### 2) Contenido por idioma

El contenido de la pagina se define por locale en:

- `i18n/en/content.ts`
- `i18n/es/content.ts`
- `i18n/pt/content.ts`
- `i18n/fr/content.ts`
- `i18n/de/content.ts`

La app importa siempre `i18n/content`; el alias decide que archivo real se empaqueta en cada build.

### 3) App de una sola pagina

La pagina principal (`src/App.tsx`) renderiza "Hello World" con contenido de prueba.

Adicionalmente:

- Muestra el locale activo mediante la constante `__LOCALE__` inyectada por Vite.
- Incluye un selector de idioma visible solo cuando `import.meta.env.PROD` es `true`.
- Al cambiar idioma, guarda `preferred_locale` en cookie y recarga.

### 4) Servidor Express con negociacion de idioma

El servidor se implementa en `server.mjs` y sirve archivos estaticos desde `dist`.

Reglas de resolucion del locale:

1. Cookie `preferred_locale` (si existe y es valida).
2. Header `Accept-Language`.
3. Fallback a `en`.

Comportamiento clave:

- La URL visible no cambia: siempre se puede usar `/`.
- El servidor selecciona internamente el archivo correcto en `dist/<locale>/...`.
- Para HTML, ajusta dinamicamente `<html lang="...">`.
- Incluye headers de trazabilidad:
  - `Content-Language`: idioma finalmente servido.
  - `X-Locale-Source`: origen de la decision (`cookie`, `accept-language`, `fallback`).
  - `Vary: Accept-Language, Cookie` para caches intermedias.

## Scripts principales

- `pnpm dev`: entorno de desarrollo con Vite (locale base `en`).
- `pnpm build`: genera todas las builds por idioma.
- `pnpm serve:i18n`: levanta Express para servir build multi-idioma.

## Flujo de ejecucion recomendado

1. Build multi-idioma:

```bash
pnpm build
```

2. Servir estaticos con negociacion de idioma:

```bash
pnpm serve:i18n
```

3. Probar en navegador:

- Abrir `http://localhost:3000/`.
- Cambiar idioma con el selector (modo build).
- Verificar en DevTools los headers `Content-Language` y `X-Locale-Source`.

## Notas tecnicas

- En desarrollo (`pnpm dev`) no se muestra el selector porque depende de `PROD`.
- El tipado de `__LOCALE__` esta en `src/vite-env.d.ts`.
- La configuracion de alias para TypeScript se mantiene en `tsconfig.app.json` para que el editor resuelva `i18n/*` en local.
