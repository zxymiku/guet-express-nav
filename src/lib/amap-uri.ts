/**
 * 高德 URI Scheme 构造与唤起策略
 * 文档见 docs/amap-setup.md
 *
 * Android App 内导航（主）：
 *   androidamap://navi?sourceApplication=guet_express_nav&lat={lat}&lon={lng}&poiname={name}&dev=0
 * Web / 未安装高德时的兜底：https://uri.amap.com/navigation?to=lng,lat,name&mode=car
 */
import { AMAP_SOURCE_APP } from './data'
import type { RouteMode } from './data'
import { isNative, isMobileUA, openExternal } from './native'

export interface NavTarget {
  lng: number
  lat: number
  name: string
}

export function buildNaviScheme(t: NavTarget): string {
  const name = encodeURIComponent(t.name)
  return `androidamap://navi?sourceApplication=${AMAP_SOURCE_APP}&lat=${t.lat}&lon=${t.lng}&poiname=${name}&dev=0`
}

export function buildUriWebUrl(t: NavTarget, mode: RouteMode): string {
  const amapMode = mode === 'walk' ? 'walk' : mode === 'transit' ? 'bus' : 'car'
  const name = encodeURIComponent(t.name)
  return `https://uri.amap.com/navigation?to=${t.lng},${t.lat},${name}&mode=${amapMode}&src=${AMAP_SOURCE_APP}&coordinate=gaode&callnative=1`
}

/**
 * 统一唤起入口：
 * - Android（Capacitor）：原生 Intent 打开 androidamap://，失败回退 uri.amap.com
 * - 移动端浏览器：直接跳 scheme，1.2s 未离开页面则回退网页版
 * - 桌面浏览器：新标签打开 uri.amap.com（可扫码/查看网页版导航）
 */
export async function launchNavi(t: NavTarget, mode: RouteMode): Promise<void> {
  if (isNative()) {
    try {
      await openExternal(buildNaviScheme(t))
    } catch {
      await openExternal(buildUriWebUrl(t, mode))
    }
    return
  }
  if (isMobileUA()) {
    const fallback = window.setTimeout(() => {
      window.location.href = buildUriWebUrl(t, mode)
    }, 1200)
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden') window.clearTimeout(fallback)
      },
      { once: true },
    )
    window.location.href = buildNaviScheme(t)
    return
  }
  window.open(buildUriWebUrl(t, mode), '_blank', 'noopener')
}
