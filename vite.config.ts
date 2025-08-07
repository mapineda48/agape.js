import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path';
import crypto from 'node:crypto'
import virtualModule from "./bin/virtual-agape-plugin";

const rootDir = process.cwd()

// función para generar un hash corto (8 chars) de una cadena
function hashOf(facadeModuleId: string) {
  const rel = path.relative(rootDir, facadeModuleId)

  return crypto.createHash('sha256').update(rel).digest('hex').slice(0, 8)
}

let index = 0;

// https://vite.dev/config/
export default defineConfig({
  root: "web",

  plugins: [react(), tailwindcss(), virtualModule()],
  resolve: {
    alias: {
      // ej. @ apunta a src
      '@': path.resolve('web'),
      '@utils': path.resolve('lib/utils'),
      '@rpc/client': path.resolve("lib/rpc/browser.ts")
    },
  },
  build: {
    outDir: path.resolve("dist/web/www"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Para entradas (entry points)
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.facadeModuleId) {
            const h = hashOf(chunkInfo.facadeModuleId);

            return `assets/js/${h}.[hash].js`
          }
          return `assets/js/[name].[hash].js`
        },
        // Para chunks generados dinámicamente
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.facadeModuleId) {
            const h = hashOf(chunkInfo.facadeModuleId);

            return `assets/js/${h}.[hash].js`
          }

          index += 1
          
          // los chunks sin moduleId (p.e. bundling interno)
          return `assets/js/[name]-${index}.[hash].js`
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

          return pkgName
        }
      }
    }
  },
  server: {
    watch: {
      ignored: [
        "lib/**/*",
      ]
    }
  },
})
