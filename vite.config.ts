import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import virtualModule from "./bin/virtual-agape-plugin";
import path from 'node:path';


// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: "dist/build",
  },

  plugins: [react(), tailwindcss(), virtualModule()],
  resolve: {
    alias: {
      // ej. @ apunta a src
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    watch: {
      ignored: [
        "**/lib/**/*", ""
      ]
    }
  },
})


// rollupOptions: {
//   output: {
//     manualChunks(id) {
//       // sólo node_modules
//       if (!id.includes('node_modules')) return

//       // dividimos por cualquier "node_modules/" (soporta pnpm y npm/yarn)
//       const parts = id.split(/node_modules[\\/]/).filter(Boolean)
//       // el último fragmento será "axios/…", "@babel/core/…" o ".pnpm/axios@1.2.3/…"
//       const pkgPath = parts[parts.length - 1]
//       const segments = pkgPath.split(/[\\/]/)
//       // si es scopeado (@foo/bar) cojo los dos primeros segmentos
//       const pkgName = segments[0].startsWith('@')
//         ? segments.slice(0, 2).join('/')
//         : segments[0]

//       return `vendor-${pkgName}`
//     }
//   }
// }