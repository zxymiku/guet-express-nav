/**
 * AmapLauncher — 本地 Capacitor 插件的 TS 侧封装。
 * 原生实现：android/app/src/main/java/.../AmapLauncherPlugin.java
 * 在 MainActivity 中手动注册；Web 端不使用（调用方在 Web 走 window.open）。
 */
import { registerPlugin } from '@capacitor/core'

export interface AmapLauncherPlugin {
  /** 用系统 Intent 打开任意 URL（含 androidamap:// 等自定义 scheme） */
  launch(options: { url: string }): Promise<void>
}

export const AmapLauncher = registerPlugin<AmapLauncherPlugin>('AmapLauncher')
