import { defineConfig, loadEnv, type Connect } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const serviceKey = (env.DATA_GO_KR_KEY || env.VITE_DATA_GO_KR_KEY || '').trim()
  // Encoding 키(%2F…) / Decoding 키 모두 한 번만 인코딩
  const encodedServiceKey = serviceKey
    ? encodeURIComponent(decodeURIComponent(serviceKey))
    : ''

  const guardMissingKey: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/api/bus')) {
      next()
      return
    }
    if (!encodedServiceKey) {
      res.statusCode = 503
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'NO_API_KEY' }))
      return
    }
    next()
  }

  return {
    // GitHub Pages: https://<user>.github.io/transport-agent/
    base: process.env.VITE_BASE || '/',
    plugins: [
      react(),
      {
        name: 'bus-api-key-guard',
        configureServer(server) {
          server.middlewares.use(guardMissingKey)
        },
      },
    ],
    server: {
      proxy: {
        '/api/bus': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          rewrite: (path) => {
            const rest = path.replace(/^\/api\/bus/, '')
            const sep = rest.includes('?') ? '&' : '?'
            return `/6410000${rest}${sep}serviceKey=${encodedServiceKey}&format=json`
          },
        },
      },
    },
  }
})
