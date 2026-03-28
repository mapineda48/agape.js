import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { agapeCoreRpc } from '@mapineda48/agape-core/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [agapeCoreRpc(), react()],
})
