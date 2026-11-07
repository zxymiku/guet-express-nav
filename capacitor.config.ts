import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor 配置 — Android 壳复用 Web 构建产物 dist/
 * 构建流程见 .github/workflows/android.yml（本地禁止任何 Gradle 编译）
 */
const config: CapacitorConfig = {
  appId: 'top.zxymiku.guetexpress',
  appName: '桂电快递导航',
  webDir: 'dist',
  server: {
    // 使用 https scheme 以便高德 JS API 在 WebView 中正常工作
    androidScheme: 'https',
  },
  android: {
    // 混合内容调试由 CI 构建的 release 配置控制
    allowMixedContent: false,
  },
}

export default config
