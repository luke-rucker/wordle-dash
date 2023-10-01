import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    sentryVitePlugin({
      org: 'wordle-dash',
      project: 'web',
      sourcemaps: {
        filesToDeleteAfterUpload: '**/*.*.map',
      },
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true,
  },
})
