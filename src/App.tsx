import { useCallback, useEffect, useRef, useState } from 'react'
import { createMapController } from './lib/amap'
import type { LatLng, MapController, RouteResult, ViewportInfo } from './lib/amap'
import { resolveAmapConfig } from './lib/config'
import type { ExpressStation, RouteMode } from './lib/data'
import {
  CAMPUS_CENTER,
  CAMPUS_NAME,
  STATIONS,
  formatCoord,
} from './lib/data'
import { launchNavi } from './lib/amap-uri'
import type { Mode, PanelView, PickTarget } from './lib/mode'
import { MODE_LABEL } from './lib/mode'

import { TopRail } from './components/TopRail'
import { SideRail } from './components/SideRail'
import { StatusBar } from './components/StatusBar'
import { StageHud } from './components/StageHud'
import { IndexPanel } from './components/IndexPanel'
import { DetailPanel } from './components/DetailPanel'
import { EditorPanel } from './components/EditorPanel'
import { RouteDossier } from './components/RouteDossier'
import { ConfigAlert } from './components/ConfigAlert'

function useIsMobile(): boolean {
  const [m, setM] = useState(() => window.matchMedia('(max-width: 880px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 880px)')
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

const WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function emptyDraft(): ExpressStation {
  return {
    id: '',
    name: '',
    brand: '',
    brandEn: '',
    campus: CAMPUS_NAME,
    lng: CAMPUS_CENTER.lng,
    lat: CAMPUS_CENTER.lat,
    images: [],
    businessHours: '',
    description: '',
  }
}

export default function App() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const ctlRef = useRef<MapController | null>(null)
  const [ctlReady, setCtlReady] = useState(false)
  const [configMissing, setConfigMissing] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)

  const [mode, setMode] = useState<Mode>('browse')
  const [pickTarget, setPickTarget] = useState<PickTarget>({ kind: 'free' })
  const [panelView, setPanelView] = useState<PanelView>('index')
  const [panelOpen, setPanelOpen] = useState(true)

  const [stations, setStations] = useState<ExpressStation[]>(() => STATIONS.map((s) => ({ ...s })))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ExpressStation | null>(null)
  const [isNewDraft, setIsNewDraft] = useState(false)

  const [origin, setOrigin] = useState<LatLng | null>(null)
  const [originLabel, setOriginLabel] = useState<string | null>(null)
  const [route, setRoute] = useState<{
    destId: string
    destName: string
    mode: RouteMode
    result: RouteResult
  } | null>(null)
  const [planning, setPlanning] = useState(false)

  const [viewport, setViewport] = useState<ViewportInfo | null>(null)
  const [cursor, setCursor] = useState<LatLng | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())

  const isMobile = useIsMobile()

  /* ---- 时钟 ---- */
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  /* ---- Toast 自动消失 ---- */
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(t)
  }, [toast])

  /* ---- 地图点击 → 拾取分流（用 ref 持有最新回调） ---- */
  const handleMapClickRef = useRef<(p: LatLng) => void>(() => {})

  /* ---- 控制器初始化（一次） ---- */
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const cfg = resolveAmapConfig()
    setConfigMissing(!cfg)
    let disposed = false
    void createMapController(host, cfg).then(({ controller, warning }) => {
      if (disposed) {
        controller.destroy()
        return
      }
      ctlRef.current = controller
      controller.fitPadLeftPx = window.matchMedia('(max-width: 880px)').matches ? 0 : 456
      controller.setStations(STATIONS.map((s) => ({ ...s })), null)
      controller.onStationClick((id) => selectStationRef.current(id))
      controller.onMapClick((p) => handleMapClickRef.current(p))
      controller.onViewChange(setViewport)
      controller.onCursorMove(setCursor)
      controller.snapshotView()
      setCtlReady(true)
      if (warning) setToast(warning)
    })
    return () => {
      disposed = true
      ctlRef.current?.destroy()
      ctlRef.current = null
    }
  }, [])

  const showToast = useCallback((msg: string) => setToast(msg), [])

  /* ---- 站点选择 ---- */
  const selectStation = useCallback(
    (id: string, opts?: { openDetail?: boolean }) => {
      const st = stations.find((s) => s.id === id)
      setSelectedId(id)
      ctlRef.current?.setActive(id)
      if (st) ctlRef.current?.panTo({ lng: st.lng, lat: st.lat })
      if (opts?.openDetail !== false) {
        setPanelView('detail')
        setPanelOpen(true)
      }
    },
    [stations],
  )
  const selectStationRef = useRef(selectStation)
  selectStationRef.current = selectStation

  /* ---- 模式切换 ---- */
  const applyMode = useCallback(
    (m: Mode) => {
      const ctl = ctlRef.current
      if (m !== 'pick') ctl?.setPickPoint(null)
      if (m === 'browse') {
        setMode('browse')
        setPickTarget({ kind: 'free' })
        setPanelView(selectedId ? 'detail' : 'index')
        return
      }
      if (m === 'pick') {
        setMode('pick')
        setPickTarget(draft && panelView === 'editor' ? { kind: 'editor' } : { kind: 'free' })
        return
      }
      // edit
      setMode('edit')
      setPanelView('editor')
      setPanelOpen(true)
      if (!draft) {
        if (selectedId) {
          const st = stations.find((s) => s.id === selectedId)
          if (st) {
            setDraft({ ...st, images: [...st.images] })
            setIsNewDraft(false)
            ctl?.setPickPoint({ lng: st.lng, lat: st.lat })
            return
          }
        }
        setDraft(emptyDraft())
        setIsNewDraft(true)
      }
    },
    [draft, panelView, selectedId, stations],
  )

  /* ---- 拾取点击 ---- */
  handleMapClickRef.current = (p: LatLng) => {
    if (mode !== 'pick') return
    if (pickTarget.kind === 'editor') {
      setDraft((d) => (d ? { ...d, lng: p.lng, lat: p.lat } : d))
      ctlRef.current?.setPickPoint(p, (np) =>
        setDraft((d) => (d ? { ...d, lng: np.lng, lat: np.lat } : d)),
      )
      showToast(`已拾取：${formatCoord(p.lng)}, ${formatCoord(p.lat)}（可拖拽微调）`)
      return
    }
    if (pickTarget.kind === 'origin') {
      setOrigin(p)
      setOriginLabel(`${p.lng.toFixed(5)}, ${p.lat.toFixed(5)}`)
      ctlRef.current?.setOrigin(p)
      ctlRef.current?.setPickPoint(null)
      setMode('browse')
      setPickTarget({ kind: 'free' })
      showToast('起点已设置，可继续选择出行方式')
      return
    }
    // 自由拾取
    ctlRef.current?.setPickPoint(p, (np) => showToast(`${formatCoord(np.lng)}, ${formatCoord(np.lat)}`))
    showToast(`已拾取：${formatCoord(p.lng)}, ${formatCoord(p.lat)}（可拖拽微调）`)
  }

  const pickHint =
    pickTarget.kind === 'editor'
      ? '点击地图设置站点坐标'
      : pickTarget.kind === 'origin'
        ? '点击地图设置路线起点'
        : '点击地图拾取任意坐标'

  /* ---- 定位 / 起点 ---- */
  const useLocationAsOrigin = useCallback(async () => {
    const ctl = ctlRef.current
    if (!ctl) return
    try {
      setPlanning(true)
      const p = await ctl.geolocate()
      setOrigin(p)
      setOriginLabel('当前定位')
      ctl.setOrigin(p)
      showToast('已定位当前位置为起点')
    } catch (err) {
      showToast((err as Error).message)
      setMode('pick')
      setPickTarget({ kind: 'origin', stationId: selectedId ?? '' })
    } finally {
      setPlanning(false)
    }
  }, [selectedId, showToast])

  const pickOrigin = useCallback(() => {
    setMode('pick')
    setPickTarget({ kind: 'origin', stationId: selectedId ?? '' })
    showToast('拾取模式：点击地图设置起点')
  }, [selectedId, showToast])

  /* ---- 路线规划 ---- */
  const planRoute = useCallback(
    async (destId: string, m: RouteMode) => {
      const ctl = ctlRef.current
      const dest = stations.find((s) => s.id === destId)
      if (!ctl || !dest) return
      try {
        setPlanning(true)
        let o = origin
        if (!o) {
          try {
            o = await ctl.geolocate()
            setOrigin(o)
            setOriginLabel('当前定位')
          } catch {
            showToast('无法定位：请先点击「地图选起点」手动设置')
            setMode('pick')
            setPickTarget({ kind: 'origin', stationId: destId })
            return
          }
        }
        const result = await ctl.planRoute(o, { lng: dest.lng, lat: dest.lat }, m)
        setRoute({ destId, destName: dest.name, mode: m, result })
      } catch (err) {
        showToast((err as Error).message)
      } finally {
        setPlanning(false)
      }
    },
    [origin, stations, showToast],
  )

  const openAmap = useCallback(
    (st: ExpressStation, m: RouteMode) => {
      void launchNavi({ lng: st.lng, lat: st.lat, name: st.name }, m)
    },
    [],
  )

  const copyText = useCallback(
    async (text: string, okMsg: string) => {
      try {
        await navigator.clipboard.writeText(text)
        showToast(okMsg)
      } catch {
        showToast('复制失败：浏览器未授权剪贴板')
      }
    },
    [showToast],
  )

  /* ---- 编辑器 ---- */
  const patchDraft = useCallback((patch: Partial<ExpressStation>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d))
  }, [])

  const saveDraft = useCallback(() => {
    if (!draft) return
    if (!draft.name.trim()) {
      showToast('请先填写站点名称')
      return
    }
    const id = draft.id || draft.name.trim().replace(/\s+/g, '-').toLowerCase()
    const saved: ExpressStation = { ...draft, id }
    setStations((list) => {
      const exists = list.some((s) => s.id === id)
      return exists ? list.map((s) => (s.id === id ? saved : s)) : [...list, saved]
    })
    setSelectedId(id)
    setIsNewDraft(false)
    ctlRef.current?.setStations(
      stations.some((s) => s.id === id)
        ? stations.map((s) => (s.id === id ? saved : s))
        : [...stations, saved],
      id,
    )
    showToast(`已保存：${saved.name}`)
  }, [draft, stations, showToast])

  const exportJson = useCallback(
    (how: 'copy' | 'download') => {
      const json = JSON.stringify(stations, null, 2)
      if (how === 'copy') {
        void copyText(json, '已复制站点列表 JSON，可粘贴回 src/lib/data.ts')
        return
      }
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'guet-stations.json'
      a.click()
      URL.revokeObjectURL(url)
      showToast('已下载 guet-stations.json')
    },
    [stations, copyText, showToast],
  )

  /* ---- 渲染 ---- */
  const selected = stations.find((s) => s.id === selectedId) ?? null
  const selectedOrder = selected ? stations.findIndex((s) => s.id === selected.id) + 1 : 0
  const picking = mode === 'pick'
  // 移动端拾取时收起面板，把舞台让给地图
  const panelVisible = panelOpen && !(isMobile && picking)

  const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
  const date = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${WEEK[now.getDay()]}`

  const railCommon = {
    panelOpen: panelVisible,
    mode,
    onToggleIndex: () => {
      if (panelVisible && panelView === 'index') {
        setPanelOpen(false)
        return
      }
      setPanelView('index')
      setPanelOpen(true)
      setMode('browse')
      setPickTarget({ kind: 'free' })
      if (mode === 'pick') ctlRef.current?.setPickPoint(null)
    },
    onLocate: () => void useLocationAsOrigin(),
    onPick: () => applyMode(mode === 'pick' ? 'browse' : 'pick'),
    onEdit: () => applyMode(mode === 'edit' ? 'browse' : 'edit'),
  }

  return (
    <div className="ark-shell">
      <TopRail time={time} date={date} mode={mode} onMode={applyMode} />
      <SideRail {...railCommon} />

      <main className={`ark-stage${picking ? ' is-picking' : ''}`} aria-label="地图舞台">
        <div className="ark-map-host" ref={hostRef} />
        <StageHud
          picking={picking}
          pickHint={pickHint}
          viewport={viewport}
          cursor={cursor}
          onZoomIn={() => ctlRef.current?.zoomBy(1)}
          onZoomOut={() => ctlRef.current?.zoomBy(-1)}
          onReset={() => ctlRef.current?.resetView()}
        />

        {route && (
          <RouteDossier
            destName={route.destName}
            mode={route.mode}
            result={route.result}
            onClose={() => {
              ctlRef.current?.clearRoute()
              setRoute(null)
            }}
            onOpenAmap={() => {
              const st = stations.find((s) => s.id === route.destId)
              if (st) openAmap(st, route.mode)
            }}
          />
        )}

        {!ctlReady && (
          <div className="ark-coord-hud" style={{ left: '50%', bottom: '50%', transform: 'translate(-50%,-50%)' }}>
            <span className="ark-coord-hud__k">LOADING MAP / 初始化地图引擎</span>
          </div>
        )}

        {panelVisible && panelView === 'index' && (
        <IndexPanel stations={stations} selectedId={selectedId} onSelect={(id) => selectStation(id)} />
      )}
      {panelVisible && panelView === 'detail' && selected && (
        <DetailPanel
          station={selected}
          order={selectedOrder}
          routeResult={route?.destId === selected.id ? route.result : null}
          routeMode={route?.destId === selected.id ? route.mode : null}
          planning={planning}
          originLabel={originLabel}
          onBack={() => setPanelView('index')}
          onPlan={(m) => void planRoute(selected.id, m)}
          onUseLocation={() => void useLocationAsOrigin()}
          onPickOrigin={pickOrigin}
          onOpenAmap={() => openAmap(selected, route?.mode ?? 'drive')}
          onCopyCoord={() =>
            void copyText(`${formatCoord(selected.lng)}, ${formatCoord(selected.lat)}`, '已复制坐标（GCJ-02）')
          }
        />
      )}
      {panelVisible && panelView === 'editor' && draft && (
        <EditorPanel
          draft={draft}
          pickActive={picking && pickTarget.kind === 'editor'}
          isNew={isNewDraft}
          onChange={patchDraft}
          onPickRequest={() => {
            if (picking && pickTarget.kind === 'editor') {
              applyMode('edit')
              return
            }
            setMode('pick')
            setPickTarget({ kind: 'editor' })
            if (draft.lng && draft.lat) {
              ctlRef.current?.setPickPoint({ lng: draft.lng, lat: draft.lat }, (np) =>
                setDraft((d) => (d ? { ...d, lng: np.lng, lat: np.lat } : d)),
              )
            }
          }}
          onSave={saveDraft}
          onNew={() => {
            setDraft(emptyDraft())
            setIsNewDraft(true)
            ctlRef.current?.setPickPoint(null)
          }}
          onLoadSelected={() => {
            if (!selected) {
              showToast('尚未选中的站点')
              return
            }
            setDraft({ ...selected, images: [...selected.images] })
            setIsNewDraft(false)
            showToast(`已载入：${selected.name}`)
          }}
          onExport={(how) => exportJson(how)}
        />
      )}

      {configMissing && !alertDismissed && (
        <ConfigAlert onDemo={() => setAlertDismissed(true)} onClose={() => setAlertDismissed(true)} />
      )}
      </main>

      <StatusBar
        mode={mode}
        pickTargetLabel={
          picking
            ? pickTarget.kind === 'editor'
              ? '站点坐标'
              : pickTarget.kind === 'origin'
                ? '路线起点'
                : '自由拾取'
            : null
        }
        routeActive={!!route}
        viewport={viewport}
        cursor={cursor}
      />

      {toast && (
        <div className="ark-toast" role="status">
          {toast}
        </div>
      )}

      {/* 屏幕阅读器用的模式说明 */}
      <p className="ark-kicker" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
        当前模式：{MODE_LABEL[mode]}
      </p>
    </div>
  )
}
