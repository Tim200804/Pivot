import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isReal = env.VITE_AUTH_MODE === 'real'

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: isReal
        ? {
            '/api': {
              target: 'http://localhost:5001',
              changeOrigin: true,
            },
          }
        : undefined,
    },
  }
})
