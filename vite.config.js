import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The backend does not configure CORS, so in development (and `vite preview`) the browser talks
  // to this server and `/api/...` is forwarded to the backend: /api/rooms -> http://localhost:8080/rooms
  // Another backend address: BACKEND_URL=http://host:port npm run dev (or put it in a .env file)
  const env = loadEnv(mode, '.', 'BACKEND_')
  const backendProxy = {
    '/api': {
      target: env.BACKEND_URL ?? 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  }

  return {
    plugins: [react()],
    server: { proxy: backendProxy },
    preview: { proxy: backendProxy },
  }
})
