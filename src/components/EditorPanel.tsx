import type { ExpressStation } from '../lib/data'
import { formatCoord } from '../lib/data'
import { IconBack, IconPick, IconCopy, IconTarget, IconEdit } from './icons'

interface Props {
  draft: ExpressStation
  pickActive: boolean
  isNew: boolean
  onChange: (patch: Partial<ExpressStation>) => void
  onPickRequest: () => void
  onSave: () => void
  onNew: () => void
  onLoadSelected: () => void
  onExport: (mode: 'copy' | 'download') => void
  onBack: () => void
}

export function EditorPanel({
  draft,
  pickActive,
  isNew,
  onChange,
  onPickRequest,
  onSave,
  onNew,
  onLoadSelected,
  onExport,
  onBack,
}: Props) {
  return (
    <section className="ark-panel ark-panel--full" aria-label="站点数据编辑">
      <header className="ark-panel__head">
        <button type="button" className="ark-back" onClick={onBack}>
          <IconBack width={13} height={13} />
          {isNew ? '索引 INDEX' : '站点 STATION'}
        </button>
        <p className="ark-kicker" style={{ marginTop: 10 }}>
          DATA EDITOR / GCJ-02
        </p>
        <div className="ark-panel__title-row" style={{ marginTop: 8 }}>
          <span className="ark-panel__bignum">
            <em>#</em>
          </span>
          <span className="ark-panel__title-meta">
            <span className="ark-panel__title">{isNew ? '新建站点' : '编辑站点'}</span>
            <span className="ark-kicker">PICK → FILL → EXPORT</span>
          </span>
        </div>
        <div className="ark-panel__title-rule" aria-hidden="true">
          <hr className="ark-rule-h" />
          <span className="ark-kicker">LOCAL DRAFT</span>
        </div>
      </header>

      <div className="ark-panel__body">
        <div className="ark-editor">
          <div>
            <label className="ark-label" htmlFor="ed-name">
              <span className="ark-kicker">名称 NAME</span>
            </label>
            <input
              id="ed-name"
              className="ark-input"
              value={draft.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="如：阳光广场菜鸟驿站"
            />
          </div>

          <div className="ark-editor__grid2">
            <div>
              <label className="ark-label" htmlFor="ed-brand">
                <span className="ark-kicker">品牌 BRAND</span>
              </label>
              <input
                id="ed-brand"
                className="ark-input"
                value={draft.brand}
                onChange={(e) => onChange({ brand: e.target.value })}
                placeholder="顺丰 · 京东 · 极兔"
              />
            </div>
            <div>
              <label className="ark-label" htmlFor="ed-brand-en">
                <span className="ark-kicker">品牌 EN（微标签）</span>
              </label>
              <input
                id="ed-brand-en"
                className="ark-input"
                value={draft.brandEn}
                onChange={(e) => onChange({ brandEn: e.target.value.toUpperCase() })}
                placeholder="SF · JD · J&T"
              />
            </div>
          </div>

          <div className="ark-editor__grid2">
            <div>
              <label className="ark-label" htmlFor="ed-lng">
                <span className="ark-kicker">经度 LNG</span>
              </label>
              <input
                id="ed-lng"
                className="ark-input"
                inputMode="decimal"
                value={String(draft.lng)}
                onChange={(e) => onChange({ lng: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="ark-label" htmlFor="ed-lat">
                <span className="ark-kicker">纬度 LAT</span>
              </label>
              <input
                id="ed-lat"
                className="ark-input"
                inputMode="decimal"
                value={String(draft.lat)}
                onChange={(e) => onChange({ lat: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          <button
            type="button"
            className={`ark-btn${pickActive ? ' ark-btn--primary' : ''}`}
            onClick={onPickRequest}
            aria-pressed={pickActive}
          >
            <IconPick width={14} height={14} />
            {pickActive ? '拾取中…点击地图打点' : '在地图上拾取坐标'}
          </button>

          <div className="ark-editor__grid2">
            <div>
              <label className="ark-label" htmlFor="ed-hours">
                <span className="ark-kicker">营业时间（可选）</span>
              </label>
              <input
                id="ed-hours"
                className="ark-input"
                value={draft.businessHours ?? ''}
                onChange={(e) => onChange({ businessHours: e.target.value || undefined })}
                placeholder="08:30 – 21:00"
              />
            </div>
            <div>
              <label className="ark-label" htmlFor="ed-campus">
                <span className="ark-kicker">校区 CAMPUS</span>
              </label>
              <input
                id="ed-campus"
                className="ark-input"
                value={draft.campus}
                onChange={(e) => onChange({ campus: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="ark-label" htmlFor="ed-desc">
              <span className="ark-kicker">描述 DESCRIPTION（可选）</span>
            </label>
            <textarea
              id="ed-desc"
              className="ark-input"
              rows={3}
              value={draft.description ?? ''}
              onChange={(e) => onChange({ description: e.target.value || undefined })}
            />
          </div>

          <div>
            <label className="ark-label" htmlFor="ed-imgs">
              <span className="ark-kicker">图片 URL（每行一张）</span>
            </label>
            <textarea
              id="ed-imgs"
              className="ark-input"
              rows={3}
              value={draft.images.join('\n')}
              onChange={(e) =>
                onChange({ images: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })
              }
              placeholder="/stations/20261107-164357.jpg"
            />
          </div>

          <div className="ark-editor__actions">
            <button type="button" className="ark-btn ark-btn--primary" onClick={onSave}>
              <IconEdit width={14} height={14} />
              保存到当前列表
            </button>
            <button type="button" className="ark-btn" onClick={onNew}>
              <IconTarget width={14} height={14} />
              新建草稿
            </button>
            <button type="button" className="ark-btn" onClick={onLoadSelected}>
              载入选中站点
            </button>
          </div>

          <div className="ark-editor__actions">
            <button type="button" className="ark-btn" onClick={() => onExport('copy')}>
              <IconCopy width={14} height={14} />
              复制列表 JSON
            </button>
            <button type="button" className="ark-btn" onClick={() => onExport('download')}>
              下载 data.json
            </button>
          </div>

          <p className="ark-editor__note" style={{ margin: 0 }}>
            编辑结果保存在本地会话；导出 JSON 后粘贴回 <code>src/lib/data.ts</code> 并重新部署即可生效。
            坐标拾取基于高德底图，直接得到 GCJ-02，无需转换。当前草稿坐标：
            <code>
              {' '}
              {formatCoord(draft.lng)}, {formatCoord(draft.lat)}
            </code>
          </p>
        </div>
      </div>
    </section>
  )
}
