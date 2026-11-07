import { useEffect, useState } from 'react'
import type { ExpressStation, RouteMode } from '../lib/data'
import { formatCoord, formatDistance, formatDuration } from '../lib/data'
import type { RouteResult } from '../lib/amap'
import { IconBack, IconWalk, IconDrive, IconTransit, IconCopy, IconTarget } from './icons'

interface Props {
  station: ExpressStation
  order: number
  routeResult: RouteResult | null
  routeMode: RouteMode | null
  planning: boolean
  originLabel: string | null
  onBack: () => void
  onPlan: (mode: RouteMode) => void
  onUseLocation: () => void
  onPickOrigin: () => void
  onOpenAmap: () => void
  onCopyCoord: () => void
}

const MODE_META: Array<{ key: RouteMode; label: string; Icon: typeof IconWalk }> = [
  { key: 'walk', label: '步行', Icon: IconWalk },
  { key: 'drive', label: '驾车', Icon: IconDrive },
  { key: 'transit', label: '公交', Icon: IconTransit },
]

const pad2 = (n: number) => String(n).padStart(2, '0')

export function DetailPanel({
  station,
  order,
  routeResult,
  routeMode,
  planning,
  originLabel,
  onBack,
  onPlan,
  onUseLocation,
  onPickOrigin,
  onOpenAmap,
  onCopyCoord,
}: Props) {
  const [imgIdx, setImgIdx] = useState(0)
  useEffect(() => setImgIdx(0), [station.id])

  const imgs = station.images.length
    ? station.images
    : []

  return (
    <section className="ark-panel ark-panel--full" aria-label={`站点详情：${station.name}`}>
      <header className="ark-panel__head">
        <button type="button" className="ark-back" onClick={onBack}>
          <IconBack width={13} height={13} />
          索引 INDEX
        </button>
        <div className="ark-dossier__idrow" style={{ marginTop: 10 }}>
          <span className="ark-panel__bignum">{pad2(order)}</span>
          <span className="ark-panel__title-meta">
            <span className="ark-kicker">STATION DOSSIER</span>
            <span className="ark-kicker" style={{ color: 'var(--ark-signal)' }}>
              {station.brandEn}
            </span>
          </span>
        </div>
        <h2 className="ark-dossier__name" style={{ margin: '10px 0 0' }}>
          {station.name}
        </h2>
      </header>

      <div className="ark-panel__body">
        <div className="ark-dossier">
          <div className="ark-meta-table" role="table" aria-label="站点信息">
            <div className="ark-meta-row" role="row">
              <span className="ark-meta-row__k" role="rowheader">
                品牌 BRAND
              </span>
              <span className="ark-meta-row__v" role="cell">
                {station.brand}
              </span>
            </div>
            <div className="ark-meta-row" role="row">
              <span className="ark-meta-row__k" role="rowheader">
                营业时间 HOURS
              </span>
              <span className="ark-meta-row__v ark-meta-row__v--mono" role="cell">
                {station.businessHours ?? '—（未登记）'}
              </span>
            </div>
            <div className="ark-meta-row" role="row">
              <span className="ark-meta-row__k" role="rowheader">
                坐标 GCJ-02
              </span>
              <span className="ark-meta-row__v ark-meta-row__v--mono" role="cell">
                {formatCoord(station.lng)}, {formatCoord(station.lat)}
              </span>
            </div>
            <div className="ark-meta-row" role="row">
              <span className="ark-meta-row__k" role="rowheader">
                校区 CAMPUS
              </span>
              <span className="ark-meta-row__v" role="cell">
                {station.campus}
              </span>
            </div>
          </div>

          {station.description && <p className="ark-dossier__desc">{station.description}</p>}

          {/* 编辑式图库：大图舞台 + 边缘胶片条 */}
          <figure className="ark-gallery" style={{ margin: 0 }}>
            {imgs.length > 0 ? (
              <div className="ark-gallery__stage ark-brackets">
                <img src={imgs[imgIdx] ?? imgs[0]} alt={`${station.name} 实拍 ${imgIdx + 1}`} loading="lazy" />
                <figcaption className="ark-gallery__caption">
                  <span className="ark-gallery__count">图 {pad2(imgIdx + 1)}</span>
                  <span>/ {pad2(imgs.length)}</span>
                  <span className="ark-kicker">FIELD PHOTO</span>
                </figcaption>
              </div>
            ) : (
              <div className="ark-gallery__empty">NO IMAGE · 待补充</div>
            )}
            {imgs.length > 1 && (
              <div className="ark-gallery__strip" role="tablist" aria-label="图片切换">
                {imgs.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    role="tab"
                    aria-selected={i === imgIdx}
                    className={`ark-gallery__thumb${i === imgIdx ? ' is-active' : ''}`}
                    onClick={() => setImgIdx(i)}
                    aria-label={`查看第 ${i + 1} 张图片`}
                  >
                    <span className="ark-gallery__thumb__idx">{pad2(i + 1)}</span>
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </figure>

          {/* 导航操作区 */}
          <div className="ark-actions">
            <div className="ark-panel__title-rule" style={{ margin: 0 }}>
              <span className="ark-kicker">ROUTE / 路线导航</span>
              <hr className="ark-rule-h" />
            </div>

            <div className="ark-actions__row" role="group" aria-label="出行方式">
              {MODE_META.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  className="ark-chip"
                  aria-pressed={routeMode === key}
                  disabled={planning}
                  onClick={() => onPlan(key)}
                >
                  <Icon width={14} height={14} />
                  {label}
                  {routeResult && routeMode === key && (
                    <span className="ark-mono" style={{ color: 'var(--ark-signal)' }}>
                      {formatDistance(routeResult.distanceM)}
                      {key === 'walk' ? 'm' : 'km'} · {formatDuration(routeResult.durationS)}min
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="ark-actions__row">
              <button type="button" className="ark-btn" onClick={onUseLocation} disabled={planning}>
                <IconTarget width={14} height={14} />
                定位为起点
              </button>
              <button type="button" className="ark-btn" onClick={onPickOrigin} disabled={planning}>
                地图选起点
              </button>
              {originLabel && (
                <span className="ark-kicker" style={{ alignSelf: 'center' }} title={originLabel}>
                  起点：{originLabel}
                </span>
              )}
            </div>

            <div className="ark-actions__row">
              <button type="button" className="ark-btn ark-btn--solid" onClick={onOpenAmap}>
                打开高德地图 App 导航 →
              </button>
              <button type="button" className="ark-btn" onClick={onCopyCoord}>
                <IconCopy width={14} height={14} />
                复制坐标
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
