import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * 开发/预览服务器中间件：为 /api/amap-config 返回空配置。
 * 生产环境该路径由 Cloudflare Worker 提供（见 worker/index.ts）；
 * 本地静态预览时返回 null，前端回退 VITE_ 变量或演示模式。
 */
function amapConfigStub(): Plugin {
  const handler = (req: { url?: string }, res: { setHeader: (k: string, v: string) => void; end: (b: string) => void }) => {
    if (req.url?.split('?')[0] === '/api/amap-config') {
      res.setHeader('content-type', 'application/javascript; charset=utf-8')
      res.end('window.__AMAP_CONFIG__=null;')
      return true
    }
    return false
  }
  return {
    name: 'amap-config-stub',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (handler(req, res)) return
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (handler(req, res)) return
        next()
      })
    },
  }
}

// Web 构建入口。Android（Capacitor）复用同一构建产物 dist/。
export default defineConfig({
  plugins: [react(), amapConfigStub()],
  build: {
    target: 'es2020',
    // 站点照片体积较大，关闭警告阈值上限提示
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
    host: true,
  },
})
