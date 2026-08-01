import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Scripts use --mode mock|real (not "development"); treat both as local dev servers
  const isLocalDev = mode === 'development' || mode === 'mock' || mode === 'real'
  const apiTarget = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    ...(isLocalDev ? {
      server: {
        host: true,
        port: 5173,
        // Proxy non-AI /api calls when VITE_API_URL is empty; AI uses absolute VITE_AI_API_URL
        proxy: {
          '/api': {
            target: apiTarget,
            changeOrigin: true,
          },
        },
      },
    } : {}),
  }
})
