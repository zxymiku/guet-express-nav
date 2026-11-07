/**
 * Cloudflare Worker：静态资源 + 敏感配置运行时下发
 *
 * - 静态资源由 [assets] 绑定提供（wrangler.jsonc → directory: ./dist，资源优先）
 * - `/api/amap-config`：非静态路径必进 Worker，返回
 *     window.__AMAP_CONFIG__ = { key, securityCode }
 *   index.html 以 <script src="/api/amap-config"> 在模块脚本前同步加载，
 *   高德 Key 与安全密钥（jscode）因此永不进入前端源码与构建产物。
 * - `/api/health`：部署自检（不回显密钥内容）
 * - Secrets 设置：wrangler secret put AMAP_JS_KEY / AMAP_SECURITY_CODE
 * - 本地开发：复制 .dev.vars.example 为 .dev.vars 后 `wrangler dev`
 */

export interface Env {
  /** 静态资源绑定 */
  ASSETS: Fetcher
  /** 高德 Web 端 JS API Key */
  AMAP_JS_KEY?: string
  /** 高德安全密钥 jscode */
  AMAP_SECURITY_CODE?: string
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' } as const

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          ok: true,
          amapKeyConfigured: !!env.AMAP_JS_KEY,
          amapSecurityConfigured: !!env.AMAP_SECURITY_CODE,
        }),
        { headers: JSON_HEADERS },
      )
    }

    if (url.pathname === '/api/amap-config') {
      if (!env.AMAP_JS_KEY) {
        // 未配置密钥：返回空配置，前端自行进入演示模式
        return new Response('window.__AMAP_CONFIG__=null;', {
          headers: { 'content-type': 'application/javascript; charset=utf-8' },
        })
      }
      const config = JSON.stringify({
        key: env.AMAP_JS_KEY,
        securityCode: env.AMAP_SECURITY_CODE ?? '',
      }).replace(/</g, '\\u003c')
      return new Response(`window.__AMAP_CONFIG__=${config};`, {
        headers: {
          'content-type': 'application/javascript; charset=utf-8',
          'cache-control': 'no-store',
        },
      })
    }

    return env.ASSETS.fetch(request)
  },
}
