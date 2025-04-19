import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import virtualModule from "./bin/virtual-agape-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), virtualModule()],
  build: {
    outDir: "dist/build"
  }
})
