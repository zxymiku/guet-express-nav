/**
 * 使用指南（Onboarding）— Ark 语法 coach marks
 * 全屏遮罩挖洞高亮目标元素 + 指向卡片步进说明；
 * 支持 Enter/→ 前进、Esc 跳过；prefers-reduced-motion 下自动降级。
 */
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { IconClose } from './icons'

export interface GuideStep {
  /** 高亮目标选择器 */
  selector: string
  title: string
  body: string
  /** 大目标收缩比例（如地图舞台取中心区域），0–0.5 */
  shrink?: number
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    selector: '.ark-panel',
    title: '站点索引',
    body: '全部快递站一览。点击任意一行：查看实拍照片、营业时间，并直接规划到该站的路线。',
  },
  {
    selector: '.ark-rail-btn[aria-label="站点索引"]',
    title: '仅地图模式',
    body: '再次点击同一图标即可收起当前面板，只保留地图舞台；需要时再点一次重新展开。',
  },
  {
    selector: '.ark-map-host',
    shrink: 0.32,
    title: '地图舞台',
    body: '拖动平移、双指或按钮缩放。点击地图上的编号方块，直达对应站点。',
  },
  {
    selector: '.ark-rail-btn[aria-label="定位当前位置"]',
    title: '定位起点',
    body: '以当前位置为路线起点；定位失败时可用「地图选起点」手动打点。',
  },
  {
    selector: '.ark-rail-btn[aria-label="拾取坐标"]',
    title: '拾取坐标',
    body: '在地图上点击任意位置获取 GCJ-02 坐标（可拖拽微调），用于校准站点位置。',
  },
  {
    selector: '.ark-rail-btn[aria-label="编辑站点数据"]',
    title: '编辑站点',
    body: '维护站点名称、坐标、营业时间与图片；「导出 JSON」回写数据源后即全端生效。',
  },
  {
    selector: '.ark-rail__friend',
    title: '友链',
    body: '桂电美食分享——找完快递去哪吃，新窗口打开，不离开当前页面。',
  },
]

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const PAD = 8

export function Onboarding({
  mobile,
  onDone,
}: {
  mobile: boolean
  onDone: () => void
}) {
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  const measure = useCallback(() => {
    const step = GUIDE_STEPS[idx]
    if (!step) return
    const el = document.querySelector(step.selector)
    let r: Rect
    if (el) {
      const b = el.getBoundingClientRect()
      r = { x: b.left, y: b.top, w: b.width, h: b.height }
    } else {
      // 目标不存在（如面板已关闭）：退化为屏幕中央区域
      r = {
        x: window.innerWidth * 0.22,
        y: window.innerHeight * 0.34,
        w: window.innerWidth * 0.56,
        h: window.innerHeight * 0.32,
      }
    }
    if (step.shrink) {
      const cx = r.x + r.w / 2
      const cy = r.y + r.h / 2
      r = {
        x: cx - (r.w * (1 - step.shrink)) / 2,
        y: cy - (r.h * (1 - step.shrink)) / 2,
        w: r.w * (1 - step.shrink),
        h: r.h * (1 - step.shrink),
      }
    }
    setRect({ x: r.x - PAD, y: r.y - PAD, w: r.w + PAD * 2, h: r.h + PAD * 2 })
  }, [idx])

  useLayoutEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const next = useCallback(() => {
    setIdx((i) => {
      const n = i + 1
      return n >= GUIDE_STEPS.length ? -1 : n
    })
  }, [])

  useEffect(() => {
    if (idx === -1) {
      onDone()
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
      if (e.key === 'Enter' || e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, next, onDone])

  if (idx === -1 || !rect) return null
  const step = GUIDE_STEPS[idx]
  const last = idx === GUIDE_STEPS.length - 1
  const pad2 = (n: number) => String(n).padStart(2, '0')

  // 卡片位置：移动端固定底部；桌面优先目标下方，空间不足移到上方并钳制边界
  const cardStyle: CSSProperties = mobile
    ? { left: 12, right: 12, bottom: 74 }
    : (() => {
        const W = 368
        const H = 190
        let top = rect.y + rect.h + 12
        if (top + H > window.innerHeight - 16) top = rect.y - H - 12
        if (top < 72) top = Math.min(window.innerHeight - H - 16, 80)
        const left = Math.min(Math.max(rect.x, 16), window.innerWidth - W - 16)
        return { top, left, width: W }
      })()

  return (
    <div className="ark-guide" role="dialog" aria-label="使用指南" aria-modal="true">
      <div
        className="ark-guide__hole"
        style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      />
      <aside className="ark-guide__card" style={cardStyle} key={idx}>
        <div className="ark-guide__head">
          <span className="ark-guide__kicker">
            GUIDE {pad2(idx + 1)} / {pad2(GUIDE_STEPS.length)}
          </span>
          <button type="button" className="ark-guide__close" aria-label="跳过指南" onClick={onDone}>
            <IconClose width={13} height={13} />
          </button>
        </div>
        <h3 className="ark-guide__title">{step.title}</h3>
        <p className="ark-guide__body">{step.body}</p>
        <div className="ark-guide__actions">
          <button type="button" className="ark-btn ark-guide__skip" onClick={onDone}>
            跳过 SKIP
          </button>
          <button type="button" className="ark-btn ark-btn--solid" onClick={next}>
            {last ? '开始使用 →' : '下一步 NEXT'}
          </button>
        </div>
      </aside>
    </div>
  )
}
