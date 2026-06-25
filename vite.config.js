import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Both the REST API ('/api') and the SignalR hub ('/hubs') must be forwarded to
// the backend. `server.proxy` only applies to `vite dev`; `vite preview` (and any
// production-like local run) needs its own `preview.proxy`, otherwise non-GET calls
// such as the SignalR `negotiate` POST and the notification PATCH endpoints hit the
// static SPA server and fail with 405 Method Not Allowed.
const backendProxy = {
  '/api': {
    target: 'http://localhost:5013',
    changeOrigin: true,
  },
  '/hubs': {
    target: 'http://localhost:5013',
    changeOrigin: true,
    ws: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: backendProxy,
  },
  preview: {
    proxy: backendProxy,
  },
})
