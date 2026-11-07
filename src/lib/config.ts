/**
 * 高德配置解析
 * 优先级：Worker 运行时注入（window.__AMAP_CONFIG__）> 构建期注入（VITE_ 变量）
 * 均未配置时返回 null → 前端进入演示模式（Mock 地图）。
 *
 * 生产环境（Cloudflare Workers）：
 *   wrangler secret put AMAP_JS_KEY
 *   wrangler secret put AMAP_SECURITY_CODE
 * Android（GitHub Actions）：
 *   GitHub Secrets AMAP_ANDROID_KEY / AMAP_SECURITY_CODE → VITE_ 构建变量
 */

export interface AmapConfig {
  key: string
  securityCode?: string
}

declare global {
  interface Window {
    __AMAP_CONFIG__?: AmapConfig
    _AMapSecurityConfig?: { securityJsCode?: string }
    AMap?: unknown
  }
}

export function resolveAmapConfig(): AmapConfig | null {
  const injected = typeof window !== 'undefined' ? window.__AMAP_CONFIG__ : undefined
  if (injected?.key) return injected

  const key = import.meta.env.VITE_AMAP_KEY as string | undefined
  if (key) {
    const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE as string | undefined
    return { key, securityCode }
  }
  return null
}

/** 未配置密钥时是否强制演示模式（?mock=1） */
export function forceMock(): boolean {
  return new URLSearchParams(window.location.search).has('mock')
}
