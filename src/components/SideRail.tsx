import type { MouseEvent as ReactMouseEvent } from 'react'
import type { Mode } from '../lib/mode'
import { FRIEND_LINK, CAMPUS_NAME_EN } from '../lib/data'
import { openExternal } from '../lib/native'
import { IconList, IconLocate, IconPick, IconEdit, IconHelp, IconLink } from './icons'

interface Props {
  panelOpen: boolean
  mode: Mode
  onToggleIndex: () => void
  onLocate: () => void
  onPick: () => void
  onEdit: () => void
  onGuide: () => void
}

export function SideRail({ panelOpen, mode, onToggleIndex, onLocate, onPick, onEdit, onGuide }: Props) {
  const friend = (ev: ReactMouseEvent) => {
    ev.preventDefault()
    void openExternal(FRIEND_LINK.url)
  }
  return (
    <aside className="ark-rail" aria-label="功能轨">
      <div className="ark-rail__group">
        <button
          type="button"
          className="ark-rail-btn"
          aria-pressed={panelOpen}
          aria-label="站点索引"
          title="站点索引"
          onClick={onToggleIndex}
        >
          <IconList />
        </button>
        <button
          type="button"
          className="ark-rail-btn"
          aria-label="定位当前位置"
          title="定位当前位置"
          onClick={onLocate}
        >
          <IconLocate />
        </button>
        <button
          type="button"
          className="ark-rail-btn"
          aria-pressed={mode === 'pick'}
          aria-label="拾取坐标"
          title="拾取坐标"
          onClick={onPick}
        >
          <IconPick />
        </button>
        <button
          type="button"
          className="ark-rail-btn"
          aria-pressed={mode === 'edit'}
          aria-label="编辑站点数据"
          title="编辑站点数据"
          onClick={onEdit}
        >
          <IconEdit />
        </button>
        <button
          type="button"
          className="ark-rail-btn"
          aria-label="使用指南"
          title="使用指南"
          onClick={onGuide}
        >
          <IconHelp />
        </button>
      </div>

      <a
        className="ark-rail__friend"
        href={FRIEND_LINK.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`友链：${FRIEND_LINK.name}（新窗口打开）`}
        title={`友链：${FRIEND_LINK.name}`}
        onClick={friend}
      >
        <IconLink className="ark-rail__friend-icon" />
        <span className="ark-rail__friend-text">{FRIEND_LINK.name}</span>
      </a>

      <span className="ark-kicker" style={{ writingMode: 'vertical-rl', fontSize: 8, letterSpacing: '0.3em' }} aria-hidden="true">
        {CAMPUS_NAME_EN}
      </span>
    </aside>
  )
}
