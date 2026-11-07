import type { Mode } from '../lib/mode'

interface Props {
  time: string
  date: string
  mode: Mode
  onMode: (m: Mode) => void
}

const CHIPS: Array<{ key: Mode; cn: string; en: string }> = [
  { key: 'browse', cn: '浏览', en: 'BROWSE' },
  { key: 'pick', cn: '拾取', en: 'PICK' },
  { key: 'edit', cn: '编辑', en: 'EDIT' },
]

export function TopRail({ time, date, mode, onMode }: Props) {
  return (
    <header className="ark-topbar">
      <div className="ark-mark" aria-hidden="true">
        桂
      </div>
      <div className="ark-brand">
        <div className="ark-brand__name">
          桂电<em>快递导航</em>
        </div>
        <div className="ark-brand__sub">GUET EXPRESS NAV · HUAJIANG</div>
      </div>

      <div className="ark-topbar__spacer" />

      <nav className="ark-mode-switch" aria-label="模式切换">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            className="ark-chip"
            aria-pressed={mode === c.key}
            onClick={() => onMode(c.key)}
          >
            {c.cn}
            <span className="ark-kicker" style={{ fontSize: 8.5 }}>
              {c.en}
            </span>
          </button>
        ))}
      </nav>

      <div className="ark-clock" aria-hidden="true">
        <span className="ark-clock__time">{time}</span>
        <span className="ark-clock__date">{date}</span>
      </div>
    </header>
  )
}
