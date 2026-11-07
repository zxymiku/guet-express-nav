import type { RouteResult } from '../lib/amap'
import type { RouteMode } from '../lib/data'
import { formatDistance, formatDuration } from '../lib/data'
import { IconClose } from './icons'

interface Props {
  destName: string
  mode: RouteMode
  result: RouteResult
  onClose: () => void
  onOpenAmap: () => void
}

const MODE_CN: Record<RouteMode, string> = {
  walk: '步行路线',
  drive: '驾车路线',
  transit: '公交路线',
}
const MODE_EN: Record<RouteMode, string> = {
  walk: 'WALKING',
  drive: 'DRIVING',
  transit: 'TRANSIT',
}

export function RouteDossier({ destName, mode, result, onClose, onOpenAmap }: Props) {
  return (
    <aside className="ark-route" aria-label="路线档案">
      <div className="ark-route__head">
        <span className="ark-route__sig" aria-hidden="true" />
        <span className="ark-route__title">{destName}</span>
        <span className="ark-route__mode">
          {MODE_EN[mode]} · {MODE_CN[mode]}
        </span>
        <button type="button" className="ark-route__close" aria-label="清除路线" onClick={onClose}>
          <IconClose width={13} height={13} />
        </button>
      </div>
      <div className="ark-route__metrics">
        <div className="ark-route__cell">
          <span className="ark-route__k">距离 DIST</span>
          <span className="ark-route__v">
            {formatDistance(result.distanceM)}
            <small>{result.distanceM < 1000 ? 'm' : 'km'}</small>
          </span>
        </div>
        <div className="ark-route__cell">
          <span className="ark-route__k">预计用时 ETA</span>
          <span className="ark-route__v">
            {formatDuration(result.durationS)}
            <small>min</small>
          </span>
        </div>
        <div className="ark-route__cell">
          <span className="ark-route__k">路径 POINTS</span>
          <span className="ark-route__v">
            {result.path.length}
            <small>pts</small>
          </span>
        </div>
      </div>
      <div className="ark-route__foot">
        <button type="button" className="ark-btn ark-btn--solid" onClick={onOpenAmap}>
          转高德 App 导航 →
        </button>
        <button type="button" className="ark-btn" onClick={onClose}>
          清除路线
        </button>
      </div>
    </aside>
  )
}
