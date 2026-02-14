import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { multiI18nBuildPlugin } from './plugins/vite-multi-i18n-build'

// https://vite.dev/config/
export default defineConfig({
  define: {
    __LOCALE__: JSON.stringify('en'),
  },
  plugins: [
    react(),
    multiI18nBuildPlugin({
      i18nDir: 'i18n',
      defaultLocale: 'en',
      outDirBase: 'dist',
      i18nAlias: 'i18n',
    }),
  ],
  resolve: {
    alias: {
      i18n: path.resolve(__dirname, 'i18n/en'),
    },
  },
})
