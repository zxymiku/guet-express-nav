import type { Mode } from '../lib/mode'
import { MODE_EN, MODE_LABEL } from '../lib/mode'
import type { LatLng, ViewportInfo } from '../lib/amap'

interface Props {
  mode: Mode
  pickTargetLabel: string | null
  routeActive: boolean
  viewport: ViewportInfo | null
  cursor: LatLng | null
}

function fmt(v: number | undefined): string {
  return v == null ? '—.——————' : v.toFixed(6)
}

export function StatusBar({ mode, pickTargetLabel, routeActive, viewport, cursor }: Props) {
  const lat = cursor?.lat ?? viewport?.lat
  const lng = cursor?.lng ?? viewport?.lng
  const zoom = viewport?.zoom
  return (
    <footer className="ark-status" role="status">
      <span className="ark-status__group">
        <span
          className={`ark-status__dot${mode === 'browse' && !routeActive ? ' ark-status__dot--idle' : ''}`}
          aria-hidden="true"
        />
        <span style={{ color: 'var(--ark-paper)' }}>
          {MODE_LABEL[mode]}
          {pickTargetLabel ? ` → ${pickTargetLabel}` : ''}
        </span>
        <span className="ark-kicker">{MODE_EN[mode]}</span>
      </span>

      <span className="ark-status__sep">|</span>

      <span className="ark-status__group">
        {routeActive && (
          <>
            <span style={{ color: 'var(--ark-signal)' }}>ROUTE ACTIVE</span>
            <span className="ark-status__sep">|</span>
          </>
        )}
        <span>
          LNG {fmt(lng)} <span className="ark-status__sep">/</span> LAT {fmt(lat)}
        </span>
        <span className="ark-status__sep">/</span>
        <span>Z {zoom == null ? '—' : zoom.toFixed(1)}</span>
        {cursor && <span className="ark-kicker" style={{ color: 'var(--ark-signal)' }}>CURSOR</span>}
      </span>

      <span className="ark-status__spacer" />

      <span className="ark-status__group">
        <span>HUAJIANG CAMPUS</span>
        <span className="ark-status__sep">·</span>
        <span>GCJ-02</span>
        <span className="ark-status__sep">·</span>
        <span>V1.0</span>
      </span>
    </footer>
  )
}
