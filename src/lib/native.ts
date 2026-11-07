/**
 * Capacitor 原生桥：外部链接 / 自定义 scheme 唤起
 *
 * - Web：window.open 新标签页
 * - Android（Capacitor）：
 *   · http(s) → @capacitor/browser 系统浏览器（不破坏 WebView 导航栈）
 *   · androidamap:// 等自定义 scheme → 本地原生插件 AmapLauncher（Intent ACTION_VIEW）
 */
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { AmapLauncher } from '../plugins/amap-launcher'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function openExternal(url: string): Promise<void> {
  if (!isNative()) {
    window.open(url, '_blank', 'noopener')
    return
  }
  if (/^https?:/i.test(url)) {
    await Browser.open({ url })
    return
  }
  // 自定义 scheme：交由原生 Intent 分发（未安装目标 App 时抛错，由调用方回退）
  await AmapLauncher.launch({ url })
}

/** 判断是否移动端 UA（用于决定 scheme 直接唤起还是引导到 uri.amap.com） */
export function isMobileUA(): boolean {
  if (isNative()) return true
  return /android|iphone|ipad|ipod|harmony/i.test(navigator.userAgent)
}
