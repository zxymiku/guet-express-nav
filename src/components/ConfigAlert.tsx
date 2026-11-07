interface Props {
  onDemo: () => void
  onClose: () => void
}

/**
 * 未配置高德密钥时的说明面板。
 * 修复路径见 docs/web-deploy.md（Cloudflare Secrets）/ docs/android-ci.md（GitHub Secrets）。
 */
export function ConfigAlert({ onDemo, onClose }: Props) {
  return (
    <div className="ark-alert" role="alertdialog" aria-label="配置提示">
      <p className="ark-kicker ark-alert__kicker">CONFIG REQUIRED / 演示模式可用</p>
      <h2 className="ark-alert__title">尚未检测到高德地图密钥</h2>
      <p className="ark-alert__body">
        地图密钥不进代码仓库：生产环境由 Cloudflare Worker 运行时注入
        （<code>AMAP_JS_KEY</code> / <code>AMAP_SECURITY_CODE</code>），Android 端由 GitHub Actions
        构建期注入。本地开发请配置 <code>.dev.vars</code> 或 <code>.env.local</code>。
        现在可以先用<b style={{ color: 'var(--ark-paper)' }}> 演示模式 </b>浏览完整界面与交互。
      </p>
      <div className="ark-alert__actions">
        <button type="button" className="ark-btn ark-btn--solid" onClick={onDemo}>
          进入演示模式
        </button>
        <button type="button" className="ark-btn" onClick={onClose}>
          知道了
        </button>
      </div>
    </div>
  )
}
