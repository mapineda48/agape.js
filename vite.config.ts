import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import virtualModule from "./bin/virtual-agape-plugin";
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: "dist/build"
  },
  plugins: [react(), tailwindcss(), virtualModule()],
  resolve: {
    alias: {
      // ej. @ apunta a src
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server:{
    watch:{
      ignored:[
        "**/lib/**/*"
      ]
    }
  }
})
