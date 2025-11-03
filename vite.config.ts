import path from 'node:path'
import crypto from 'node:crypto'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import vitePluginRpc from "./lib/rpc/vite-plugin";

const rootDir = process.cwd();
const pages = path.resolve("web/app");

// función para generar un hash corto (8 chars) de una cadena
function hashOf(facadeModuleId: string) {
  const rel = path.relative(rootDir, facadeModuleId)

  return crypto.createHash('sha256').update(rel).digest('hex').slice(0, 8)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vitePluginRpc,
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],

  root: "web",

  resolve: {
    alias: {
      // ej. @ apunta a src
      '@': path.resolve('web'),
      '@utils': path.resolve('lib/utils')
    },
  },

  build: {
    outDir: path.resolve("dist/web/www/"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Para entradas (entry points)
        entryFileNames: "assets/js/[name].[hash].js",

        chunkFileNames: ({ facadeModuleId }) => {
          if (facadeModuleId && facadeModuleId.startsWith(pages)) {
            const name = hashOf(facadeModuleId);

            return `assets/js/${name}.[hash].js`;
          }

          // los chunks sin moduleId (p.e. bundling interno)
          return "assets/js/[name].[hash].js";
        },

        // Para assets (CSS, imágenes, fuentes…)
        assetFileNames: (assetInfo) => {
          if (assetInfo.names) {
            const [name] = assetInfo.names;
            const ext = path.extname(name).slice(1);

            const h = hashOf(name)
            return `assets/${ext}/${h}.[hash][extname]`
          }
          return `assets/_/[name].[hash][extname]`
        },

        manualChunks(id) {
          // sólo node_modules
          if (!id.includes('node_modules')) return

          // dividimos por cualquier "node_modules/" (soporta pnpm y npm/yarn)
          const parts = id.split(/node_modules[\\/]/).filter(Boolean)
          // el último fragmento será "axios/…", "@babel/core/…" o ".pnpm/axios@1.2.3/…"
          const pkgPath = parts[parts.length - 1]
          const segments = pkgPath.split(/[\\/]/)
          // si es scopeado (@foo/bar) cojo los dos primeros segmentos
          const pkgName = segments[0].startsWith('@')
            ? segments.slice(0, 2).join('/')
            : segments[0]

          return path.posix.join("vendor", pkgName)
        }
      }
    }
  }
})
