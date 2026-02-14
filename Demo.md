Aquí tienes un **plugin de Vite** que, **solo en `vite build`**, detecta los idiomas dentro de `/i18n/<lang>/...` y genera **una build por idioma** en:

```
dist/en
dist/es
dist/pt
...
```

La idea es simple: para cada idioma, hace un build programático cambiando el **alias** (o ruta) para que tus imports de i18n apunten a `i18n/<lang>`.

---

## 1) Plugin: `plugins/vite-multi-i18n-build.ts`

```ts
import fs from "node:fs";
import path from "node:path";
import { build, type Plugin, type UserConfig } from "vite";

type Options = {
  /** Carpeta i18n relativa al root del proyecto */
  i18nDir?: string; // default: "i18n"
  /** Idioma por defecto (el que usas en dev) */
  defaultLocale?: string; // default: "en"
  /** Out dir base (donde se crean subcarpetas por idioma) */
  outDirBase?: string; // default: "dist"
  /**
   * Alias que usas para i18n.
   * Ej: si importas desde "@/i18n" o "i18n", ponlo aquí.
   */
  i18nAlias?: string; // default: "i18n"
};

const CHILD_BUILD_FLAG = "__VITE_MULTI_I18N_CHILD__";

function isDir(p: string) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function listLocales(i18nAbsDir: string): string[] {
  if (!isDir(i18nAbsDir)) return [];
  return fs
    .readdirSync(i18nAbsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => /^[a-z]{2}(-[A-Z]{2})?$/.test(name) || /^[a-z]{2,3}$/.test(name)); // flexible
}

/**
 * Plugin: genera dist/<locale> por cada carpeta dentro de i18n/
 */
export function multiI18nBuildPlugin(opts: Options = {}): Plugin {
  const i18nDir = opts.i18nDir ?? "i18n";
  const defaultLocale = opts.defaultLocale ?? "en";
  const outDirBase = opts.outDirBase ?? "dist";
  const i18nAlias = opts.i18nAlias ?? "i18n";

  let rootAbs = process.cwd();

  return {
    name: "vite:multi-i18n-build",
    apply: "build",

    config(config, env) {
      // Solo en build (por si acaso)
      if (env.command !== "build") return;

      // Evitar recursión en builds "hijos"
      if (process.env[CHILD_BUILD_FLAG] === "1") return;

      // Capturar root real si viene en config
      if (config.root) rootAbs = path.resolve(process.cwd(), config.root);

      // Fuerza que la build "principal" salga en dist/<defaultLocale>
      // y que el alias apunte a i18n/<defaultLocale>
      const defaultLocalePath = path.resolve(rootAbs, i18nDir, defaultLocale);

      const merged: UserConfig = {
        build: {
          outDir: path.posix.join(outDirBase, defaultLocale),
          emptyOutDir: true,
        },
        resolve: {
          alias: [
            // Mantiene aliases existentes + añade el de i18n
            { find: i18nAlias, replacement: defaultLocalePath },
          ],
        },
        define: {
          __LOCALE__: JSON.stringify(defaultLocale),
        },
      };

      return merged;
    },

    async closeBundle() {
      // Solo el proceso "padre" dispara los builds adicionales
      if (process.env[CHILD_BUILD_FLAG] === "1") return;

      const i18nAbsDir = path.resolve(rootAbs, i18nDir);
      const locales = listLocales(i18nAbsDir);

      if (locales.length === 0) {
        this.warn(`[multi-i18n] No se encontraron idiomas en: ${i18nAbsDir}`);
        return;
      }

      const others = locales.filter((l) => l !== defaultLocale);
      if (others.length === 0) return;

      // Ejecutar builds secuenciales para evitar saturar CPU/mem
      for (const locale of others) {
        const localePath = path.resolve(i18nAbsDir, locale);

        // Marca build hijo (para evitar que el plugin vuelva a disparar closeBundle)
        process.env[CHILD_BUILD_FLAG] = "1";
        process.env.__LOCALE__ = locale;

        await build({
          root: rootAbs,
          logLevel: "info",
          define: {
            __LOCALE__: JSON.stringify(locale),
          },
          resolve: {
            alias: [{ find: i18nAlias, replacement: localePath }],
          },
          build: {
            outDir: path.posix.join(outDirBase, locale),
            emptyOutDir: true,
          },
        });

        // Limpia flag para el siguiente loop (seguimos en padre, pero cada build es hijo)
        delete process.env[CHILD_BUILD_FLAG];
      }
    },
  };
}
```

---

## 2) Uso en `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { multiI18nBuildPlugin } from "./plugins/vite-multi-i18n-build";

export default defineConfig({
  plugins: [
    react(),
    multiI18nBuildPlugin({
      i18nDir: "i18n",
      defaultLocale: "en",
      outDirBase: "dist",
      i18nAlias: "i18n", // <-- AJUSTA ESTO a tu alias real
    }),
  ],
});
```

---

## 3) Importante: tu alias de i18n

Este plugin asume que en tu código importas algo como:

```ts
import messages from "i18n/common.json";
```

o

```ts
import { resources } from "i18n/resources";
```

Si tu alias real es otro (por ejemplo `@i18n` o `~/i18n`), cambia `i18nAlias`.

---

## 4) Resultado

Al ejecutar:

```bash
vite build
```

Quedará:

```
dist/en/...
dist/es/...
dist/...
```

Cada carpeta contendrá la build completa con el idioma “inyectado” vía alias.

---

Si me pegas **cómo importas i18n hoy** (una línea de ejemplo) y **qué alias usas en `resolve.alias`**, te lo dejo ajustado exacto para tu estructura (sin suposiciones).
