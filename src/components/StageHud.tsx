import type { LatLng, ViewportInfo } from '../lib/amap'
import { formatCoord } from '../lib/data'
import { IconPlus, IconMinus, IconReset } from './icons'

interface Props {
  picking: boolean
  pickHint: string | null
  viewport: ViewportInfo | null
  cursor: LatLng | null
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

/** 舞台仪表：缩放组 / 实时坐标仪 / 拾取提示 / 十字导轨 */
export function StageHud({ picking, pickHint, viewport, cursor, onZoomIn, onZoomOut, onReset }: Props) {
  const lat = cursor?.lat ?? viewport?.lat
  const lng = cursor?.lng ?? viewport?.lng
  return (
    <>
      <div className="ark-stage__vignette" aria-hidden="true" />
      <div className="ark-crosshair" aria-hidden="true">
        <span className="ark-crosshair__x" />
        <span className="ark-crosshair__y" />
      </div>

      <div className="ark-zoom-stack">
        <button type="button" className="ark-zoom-btn" aria-label="放大" onClick={onZoomIn}>
          <IconPlus />
        </button>
        <button type="button" className="ark-zoom-btn" aria-label="缩小" onClick={onZoomOut}>
          <IconMinus />
        </button>
        <button type="button" className="ark-zoom-btn" aria-label="复位到校区中心" onClick={onReset}>
          <IconReset />
        </button>
      </div>

      <div className="ark-coord-hud" aria-hidden="true">
        <span className="ark-coord-hud__cell">
          <span className="ark-coord-hud__k">LNG</span>
          <span className="ark-coord-hud__v">{lng == null ? '—' : formatCoord(lng)}</span>
        </span>
        <span className="ark-coord-hud__cell">
          <span className="ark-coord-hud__k">LAT</span>
          <span className="ark-coord-hud__v">{lat == null ? '—' : formatCoord(lat)}</span>
        </span>
        <span className="ark-coord-hud__cell">
          <span className="ark-coord-hud__k">Z</span>
          <span className="ark-coord-hud__v" style={{ minWidth: 34 }}>
            {viewport?.zoom == null ? '—' : viewport.zoom.toFixed(1)}
          </span>
        </span>
      </div>

      {picking && pickHint && (
        <div className="ark-pick-hint" role="status">
          <span className="ark-pick-hint__sig" aria-hidden="true" />
          <span>{pickHint}</span>
          <span className="ark-pick-hint__kicker">PICK · GCJ-02</span>
        </div>
      )}
    </>
  )
}
