import type { ExpressStation } from '../lib/data'
import { CAMPUS_NAME } from '../lib/data'

interface Props {
  stations: ExpressStation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function IndexPanel({ stations, selectedId, onSelect }: Props) {
  return (
    <section className="ark-panel" aria-label="快递站索引">
      <header className="ark-panel__head">
        <p className="ark-kicker">STATION INDEX / HUAJIANG</p>
        <div className="ark-panel__title-row" style={{ marginTop: 8 }}>
          <span className="ark-panel__bignum">
            {pad2(stations.length)}
            <em>.</em>
          </span>
          <span className="ark-panel__title-meta">
            <span className="ark-panel__title">快递驿站索引</span>
            <span className="ark-kicker">CAMPUS COURIER NETWORK</span>
          </span>
        </div>
        <div className="ark-panel__title-rule" aria-hidden="true">
          <span className="ark-tag ark-tag--signal">{CAMPUS_NAME}</span>
          <hr className="ark-rule-h" />
          <span className="ark-kicker">{pad2(stations.length)} STATIONS</span>
        </div>
      </header>

      <div className="ark-panel__body">
        <ul className="ark-index-list" role="list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {stations.map((st, i) => (
            <li key={st.id}>
              <button
                type="button"
                className="ark-index-row"
                aria-current={st.id === selectedId}
                onClick={() => onSelect(st.id)}
              >
                <span className="ark-index-row__idx">{pad2(i + 1)}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="ark-index-row__name">{st.name}</span>
                  <span className="ark-index-row__meta">
                    <span>{st.brandEn}</span>
                    {st.businessHours && <span>⌀ {st.businessHours}</span>}
                  </span>
                </span>
                <span className="ark-index-row__arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <footer className="ark-panel__foot">
        <p className="ark-editor__note" style={{ margin: 0 }}>
          坐标为 GCJ-02，可在<span style={{ color: 'var(--ark-paper)' }}> 编辑 </span>模式中用「拾取坐标」校准；
          图片与营业时间同面板维护。
        </p>
      </footer>
    </section>
  )
}
