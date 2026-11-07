/**
 * 地图控制器层
 * - AMapController：高德 JS API 2.0（暗色底图、Ark 自定义 Marker、路线渐进绘制）
 * - MockController：无密钥 / ?mock=1 时的演示模式（SVG 舞台），接口完全一致
 * App 只面向 MapController 编程，两端行为一致。
 */
import type { ExpressStation, RouteMode } from './data'
import { CAMPUS_CENTER, haversineM } from './data'
import { forceMock } from './config'
import type { AmapConfig } from './config'

export type LatLng = { lng: number; lat: number }
export interface RouteResult {
  distanceM: number
  durationS: number
  path: [number, number][]
}
export interface ViewportInfo {
  lng: number
  lat: number
  zoom: number
}

export interface MapController {
  /** 舞台左侧被面板占据的宽度（路线自动视野避让），App 按端型设置 */
  fitPadLeftPx: number
  destroy(): void
  setStations(stations: ExpressStation[], activeId: string | null): void
  setActive(id: string | null): void
  onStationClick(cb: (id: string) => void): void
  onMapClick(cb: (p: LatLng) => void): void
  /** 选点标记（可拖拽微调）；传 null 清除 */
  setPickPoint(p: LatLng | null, onDrag?: (p: LatLng) => void): void
  setOrigin(p: LatLng | null): void
  /** 规划路线并渐进绘制 */
  planRoute(origin: LatLng, dest: LatLng, mode: RouteMode): Promise<RouteResult>
  /** 直接绘制路径（编辑预览等场景） */
  drawRoute(path: [number, number][], mode: RouteMode): void
  clearRoute(): void
  fitPoints(points: LatLng[], padLeftPx?: number): void
  panTo(p: LatLng, zoom?: number): void
  geolocate(): Promise<LatLng>
  onViewChange(cb: (v: ViewportInfo) => void): void
  onCursorMove(cb: (p: LatLng | null) => void): void
  /** 注册回调后立即补发一次当前视野（地图 complete 可能早于回调注册） */
  snapshotView(): void
  zoomBy(delta: number): void
  resetView(): void
  readonly mock: boolean
}

export const ARK_SIGNAL = '#18d1ff'

/* ============================================================
   高德脚本加载
   ============================================================ */

let amapLoading: Promise<void> | null = null

function loadAMap(config: AmapConfig): Promise<void> {
  if (window.AMap) return Promise.resolve()
  if (amapLoading) return amapLoading

  if (config.securityCode) {
    // 安全密钥必须在脚本加载前设置
    window._AMapSecurityConfig = { securityJsCode: config.securityCode }
  }
  amapLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    const plugins = [
      'AMap.Geolocation',
      'AMap.Driving',
      'AMap.Walking',
      'AMap.Transfer',
    ].join(',')
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(config.key)}&plugin=${plugins}`
    s.async = true
    const timer = window.setTimeout(() => reject(new Error('高德脚本加载超时')), 15000)
    s.onload = () => {
      window.clearTimeout(timer)
      window.AMap ? resolve() : reject(new Error('高德脚本加载异常'))
    }
    s.onerror = () => {
      window.clearTimeout(timer)
      amapLoading = null
      reject(new Error('高德脚本加载失败（检查 Key 与网络）'))
    }
    document.head.appendChild(s)
  })
  return amapLoading
}

/* ============================================================
   DOM 工具：Ark 标记
   ============================================================ */

function stationMarkerEl(index2: string, active: boolean): HTMLElement {
  const root = document.createElement('div')
  root.className = `ark-marker${active ? ' is-active' : ''}`
  root.innerHTML = `
    ${active ? '<span class="ark-marker__pulse"></span>' : ''}
    <span class="ark-marker__box">${index2}</span>`
  return root
}

function pickMarkerEl(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'ark-marker ark-marker--pick'
  root.innerHTML = `
    <span class="ark-marker__diamond"></span>
    <span class="ark-marker__center"></span>
    <span class="ark-marker__coords" data-role="coords"></span>`
  return root
}

function originMarkerEl(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'ark-marker ark-marker--origin'
  root.innerHTML = `<span class="ark-marker__box">起</span>`
  return root
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/* ============================================================
   AMapController
   ============================================================ */

type AnyMap = Record<string, unknown>
declare const AMap: any

class AMapController implements MapController {
  readonly mock = false
  fitPadLeftPx = 0
  private map: any
  private pluginInst: Record<string, any> = {}
  private stationMarkers = new Map<string, { marker: any; el: HTMLElement }>()
  private pickMarker: any = null
  private originMarker: any = null
  private routeLines: any[] = []
  private raf = 0
  private stationClickCb: ((id: string) => void) | null = null
  private mapClickCb: ((p: LatLng) => void) | null = null
  private viewCb: ((v: ViewportInfo) => void) | null = null
  private cursorCb: ((p: LatLng | null) => void) | null = null

  private constructor(map: any) {
    this.map = map
    map.on('moveend', () => this.emitView())
    map.on('zoomend', () => this.emitView())
    map.on('complete', () => this.emitView())
    map.on('mousemove', (e: AnyMap) => {
      const ll = e['lnglat'] as { lng: number; lat: number }
      this.cursorCb?.({ lng: ll.lng, lat: ll.lat })
    })
    map.on('mouseout', () => this.cursorCb?.(null))
    map.on('click', (e: AnyMap) => {
      const ll = e['lnglat'] as { lng: number; lat: number }
      this.mapClickCb?.({ lng: ll.lng, lat: ll.lat })
    })
  }

  static async create(
    host: HTMLElement,
    config: AmapConfig,
  ): Promise<AMapController> {
    await loadAMap(config)
    const map = new AMap.Map(host, {
      viewMode: '2D',
      zoom: 16,
      zooms: [4, 20],
      center: [CAMPUS_CENTER.lng, CAMPUS_CENTER.lat],
      mapStyle: 'amap://styles/dark',
      // 关闭默认控件，使用 Ark 自定义仪表
      zoomEnable: true,
      dragEnable: true,
      showLabel: true,
    })
    map.clearMap()
    // 等待首帧瓦片就绪，无效 Key / 域名白名单问题在此暴露并回退演示模式
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(
        () => reject(new Error('底图加载超时（检查 Key 与域名白名单）')),
        10000,
      )
      map.on('complete', () => {
        window.clearTimeout(timer)
        resolve()
      })
    })
    return new AMapController(map)
  }

  private emitView() {
    const c = this.map.getCenter()
    this.viewCb?.({ lng: c.lng, lat: c.lat, zoom: this.map.getZoom() })
  }

  destroy(): void {
    cancelAnimationFrame(this.raf)
    this.map?.destroy()
  }

  setStations(stations: ExpressStation[], activeId: string | null): void {
    for (const { marker } of this.stationMarkers.values()) this.map.remove(marker)
    this.stationMarkers.clear()
    stations.forEach((st, i) => {
      const el = stationMarkerEl(pad2(i + 1), st.id === activeId)
      el.addEventListener('click', (ev) => {
        ev.stopPropagation()
        this.stationClickCb?.(st.id)
      })
      const marker = new AMap.Marker({
        position: [st.lng, st.lat],
        content: el,
        anchor: 'center',
        zIndex: st.id === activeId ? 130 : 120,
      })
      this.map.add(marker)
      this.stationMarkers.set(st.id, { marker, el })
    })
  }

  setActive(id: string | null): void {
    for (const [sid, { marker, el }] of this.stationMarkers) {
      const active = sid === id
      el.classList.toggle('is-active', active)
      el.querySelector('.ark-marker__pulse')?.remove()
      if (active) {
        el.insertAdjacentHTML('afterbegin', '<span class="ark-marker__pulse"></span>')
        marker.setzIndex?.(130)
      } else {
        marker.setzIndex?.(120)
      }
    }
  }

  onStationClick(cb: (id: string) => void): void {
    this.stationClickCb = cb
  }
  onMapClick(cb: (p: LatLng) => void): void {
    this.mapClickCb = cb
  }
  onViewChange(cb: (v: ViewportInfo) => void): void {
    this.viewCb = cb
  }
  onCursorMove(cb: (p: LatLng | null) => void): void {
    this.cursorCb = cb
  }

  snapshotView(): void {
    this.emitView()
  }

  setPickPoint(p: LatLng | null, onDrag?: (p: LatLng) => void): void {
    if (this.pickMarker) {
      this.map.remove(this.pickMarker)
      this.pickMarker = null
    }
    if (!p) return
    const el = pickMarkerEl()
    const coordsEl = el.querySelector('[data-role="coords"]') as HTMLElement
    const sync = (ll: LatLng) => {
      coordsEl.textContent = `${ll.lng.toFixed(6)}, ${ll.lat.toFixed(6)}`
    }
    sync(p)
    this.pickMarker = new AMap.Marker({
      position: [p.lng, p.lat],
      content: el,
      anchor: 'center',
      draggable: true,
      zIndex: 150,
    })
    this.pickMarker.on('dragend', () => {
      const ll = this.pickMarker.getPosition()
      const np = { lng: ll.lng, lat: ll.lat }
      sync(np)
      onDrag?.(np)
    })
    this.map.add(this.pickMarker)
  }

  setOrigin(p: LatLng | null): void {
    if (this.originMarker) {
      this.map.remove(this.originMarker)
      this.originMarker = null
    }
    if (!p) return
    this.originMarker = new AMap.Marker({
      position: [p.lng, p.lat],
      content: originMarkerEl(),
      anchor: 'center',
      zIndex: 140,
    })
    this.map.add(this.originMarker)
  }

  /* ---- 路线 ---- */

  private async searchRoute(
    origin: LatLng,
    dest: LatLng,
    mode: RouteMode,
  ): Promise<RouteResult> {
    const O = new AMap.LngLat(origin.lng, origin.lat)
    const D = new AMap.LngLat(dest.lng, dest.lat)
    const key = mode
    this.pluginInst[key] ??=
      mode === 'drive'
        ? new AMap.Driving({ hideMarkers: true, autoFitView: false })
        : mode === 'walk'
          ? new AMap.Walking({ hideMarkers: true, autoFitView: false })
          : new AMap.Transfer({ hideMarkers: true, autoFitView: false, city: '桂林' })
    const planner = this.pluginInst[key]
    return new Promise<RouteResult>((resolve, reject) => {
      planner.search(O, D, (status: string, result: AnyMap) => {
        if (status !== 'complete') {
          reject(new Error(`路线规划失败（${status}）`))
          return
        }
        try {
          resolve(parseRouteResult(mode, result))
        } catch (err) {
          reject(err as Error)
        }
      })
    })
  }

  /** 供 App 调用：规划并渐进绘制 */
  async planRoute(
    origin: LatLng,
    dest: LatLng,
    mode: RouteMode,
  ): Promise<RouteResult> {
    const r = await this.searchRoute(origin, dest, mode)
    this.drawRoute(r.path, mode)
    return r
  }

  drawRoute(path: [number, number][], mode: RouteMode): void {
    this.clearRoute()
    if (path.length < 2) return
    // 底衬线：近黑描边将青色路线从道路网中剥离
    const casing = new AMap.Polyline({
      path,
      strokeColor: '#040506',
      strokeWeight: mode === 'walk' ? 6 : 8,
      strokeOpacity: 0.85,
      zIndex: 49,
    })
    const line = new AMap.Polyline({
      path: [],
      strokeColor: ARK_SIGNAL,
      strokeWeight: mode === 'walk' ? 4 : 5,
      strokeOpacity: 0.95,
      strokeStyle: mode === 'walk' ? 'dashed' : 'solid',
      showDir: mode === 'drive',
      lineJoin: 'round',
      zIndex: 50,
    })
    this.routeLines = [casing, line]
    this.map.add([casing, line])
    // 渐进绘制：按帧扩展路径，形成“沿路径显示”的仪表感
    const total = path.length
    const dur = 1300
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur)
      const eased = 1 - Math.pow(1 - k, 3)
      const end = Math.max(2, Math.round(eased * total))
      line.setPath(path.slice(0, end))
      if (k < 1) {
        this.raf = requestAnimationFrame(tick)
      } else {
        this.fitPoints(path.map(([lng, lat]) => ({ lng, lat })), this.fitPadLeftPx)
      }
    }
    this.raf = requestAnimationFrame(tick)
  }

  clearRoute(): void {
    cancelAnimationFrame(this.raf)
    if (this.routeLines.length) {
      this.map.remove(this.routeLines)
      this.routeLines = []
    }
  }

  /* ---- 视野 ---- */

  fitPoints(points: LatLng[], padLeftPx = 0): void {
    if (!points.length) return
    const lngs = points.map((p) => p.lng)
    const lats = points.map((p) => p.lat)
    const minX = Math.min(...lngs)
    const maxX = Math.max(...lngs)
    const minY = Math.min(...lats)
    const maxY = Math.max(...lats)
    // 手动扩边：右侧/上下留常规缓冲；左侧额外为面板保留视野
    const size = this.map.getSize()
    const fx = padLeftPx / Math.max(1, size.width)
    const lngSpan = Math.max(1e-6, maxX - minX)
    const latSpan = Math.max(1e-6, maxY - minY)
    const west = minX - lngSpan * (0.18 + fx * 1.4)
    const east = maxX + lngSpan * 0.18
    const south = minY - latSpan * 0.22
    const north = maxY + latSpan * 0.22
    this.map.setBounds(new AMap.Bounds([west, south], [east, north]))
  }

  panTo(p: LatLng, zoom?: number): void {
    this.map.panTo([p.lng, p.lat])
    if (zoom != null) this.map.setZoom(zoom)
  }

  geolocate(): Promise<LatLng> {
    this.pluginInst['geo'] ??= new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 8000,
      showButton: false,
    })
    return new Promise((resolve, reject) => {
      this.pluginInst['geo'].getCurrentPosition((status: string, result: AnyMap) => {
        if (status === 'complete') {
          const pos = result['position'] as { lng: number; lat: number }
          resolve({ lng: pos.lng, lat: pos.lat })
        } else {
          reject(new Error('定位失败，请手动选取起点'))
        }
      })
    })
  }

  zoomBy(delta: number): void {
    this.map.setZoom(this.map.getZoom() + delta)
  }

  resetView(): void {
    this.panTo(CAMPUS_CENTER, 16)
  }
}

function parseRouteResult(mode: RouteMode, result: AnyMap): RouteResult {
  const collect = (path: unknown[]): [number, number][] =>
    (path as Array<{ lng: number; lat: number }>)
      .filter(Boolean)
      .map((p) => [p.lng, p.lat] as [number, number])

  if (mode === 'transit') {
    const plans = result['plans'] as AnyMap[] | undefined
    const plan = plans?.[0]
    if (!plan) throw new Error('未找到公交方案')
    const segments = (plan['segments'] ?? []) as AnyMap[]
    const path: [number, number][] = []
    for (const seg of segments) {
      const walk = (seg['walking'] as AnyMap | undefined)?.['path'] as unknown[] | undefined
      if (walk) path.push(...collect(walk))
      const buslines = (seg['buslines'] ?? []) as AnyMap[]
      for (const bus of buslines) {
        const bp = bus['path'] as unknown[] | undefined
        if (bp) path.push(...collect(bp))
      }
    }
    return { distanceM: Number(plan['distance'] ?? 0), durationS: Number(plan['time'] ?? 0), path }
  }

  const routes = result['routes'] as AnyMap[] | undefined
  const route = routes?.[0]
  if (!route) throw new Error('未找到路线方案')
  const steps = (route['steps'] ?? []) as AnyMap[]
  const path: [number, number][] = []
  for (const step of steps) {
    const sp = step['path'] as unknown[] | undefined
    if (sp) path.push(...collect(sp))
  }
  return {
    distanceM: Number(route['distance'] ?? 0),
    durationS: Number(route['time'] ?? 0),
    path,
  }
}

/* ============================================================
   MockController — 演示模式（无密钥 / ?mock=1 / 脚本加载失败回退）
   ============================================================ */

class MockController implements MapController {
  readonly mock = true
  fitPadLeftPx = 0
  private host: HTMLElement
  private layer: HTMLElement
  private svg: SVGSVGElement
  private routePath: SVGPathElement | null = null
  private lastPath: [number, number][] | null = null
  private center = { ...CAMPUS_CENTER }
  private spanLng = 0.016
  private stations: ExpressStation[] = []
  private pickEl: HTMLElement | null = null
  private originEl: HTMLElement | null = null
  private markerEls = new Map<string, HTMLElement>()
  private stationClickCb: ((id: string) => void) | null = null
  private mapClickCb: ((p: LatLng) => void) | null = null
  private viewCb: ((v: ViewportInfo) => void) | null = null
  private raf = 0

  constructor(host: HTMLElement) {
    this.host = host
    host.innerHTML = ''
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    svg.style.display = 'block'
    svg.style.position = 'absolute'
    svg.style.inset = '0'
    svg.innerHTML = mockBackdrop()
    svg.addEventListener('click', (ev) => {
      const rect = host.getBoundingClientRect()
      const p = this.toLngLat(ev.clientX - rect.left, ev.clientY - rect.top)
      this.mapClickCb?.(p)
    })
    const layer = document.createElement('div')
    // 标记层不拦截点击：空白区域点击落到 svg（地图点击），标记自身恢复 pointer-events
    layer.style.cssText = 'position:absolute;inset:0;z-index:5;pointer-events:none;'
    host.append(svg, layer)
    this.svg = svg
    this.layer = layer
    this.emitView()
  }

  private get spanLat(): number {
    const rect = this.host.getBoundingClientRect()
    const aspect = rect.height / Math.max(1, rect.width)
    return this.spanLng * aspect * 1.1
  }

  private toXY(p: LatLng): { x: number; y: number } {
    const rect = this.host.getBoundingClientRect()
    const x = 50 + ((p.lng - this.center.lng) / this.spanLng) * 100
    const y = 50 - ((p.lat - this.center.lat) / this.spanLat) * 100
    return { x: (x / 100) * rect.width, y: (y / 100) * rect.height }
  }

  private toLngLat(px: number, py: number): LatLng {
    const rect = this.host.getBoundingClientRect()
    const fx = px / Math.max(1, rect.width)
    const fy = py / Math.max(1, rect.height)
    return {
      lng: this.center.lng + (fx - 0.5) * this.spanLng,
      lat: this.center.lat - (fy - 0.5) * this.spanLat,
    }
  }

  private emitView() {
    this.viewCb?.({ ...this.center, zoom: 16 + Math.log2(0.016 / this.spanLng) })
  }

  private relayout() {
    for (const [id, el] of this.markerEls) {
      const st = this.stations.find((s) => s.id === id)
      if (!st) continue
      const { x, y } = this.toXY(st)
      el.style.left = `${x}px`
      el.style.top = `${y}px`
    }
    if (this.pickEl && this.pickPoint) {
      const { x, y } = this.toXY(this.pickPoint)
      this.pickEl.style.left = `${x}px`
      this.pickEl.style.top = `${y}px`
    }
    if (this.originEl && this.originPoint) {
      const { x, y } = this.toXY(this.originPoint)
      this.originEl.style.left = `${x}px`
      this.originEl.style.top = `${y}px`
    }
    this.syncRouteGeometry()
  }

  /** 投影变化后重算路线几何（不重播动画） */
  private syncRouteGeometry() {
    if (!this.routePath || !this.lastPath) return
    const pts = this.lastPath.map(([lng, lat]) => this.toXY({ lng, lat }))
    this.routePath.setAttribute(
      'd',
      pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' '),
    )
  }

  private pickPoint: LatLng | null = null
  private originPoint: LatLng | null = null

  destroy(): void {
    cancelAnimationFrame(this.raf)
    this.host.innerHTML = ''
  }

  setStations(stations: ExpressStation[], activeId: string | null): void {
    this.stations = stations
    this.layer.innerHTML = ''
    this.markerEls.clear()
    stations.forEach((st, i) => {
      const el = stationMarkerEl(pad2(i + 1), st.id === activeId)
      el.style.cssText =
        'position:absolute;transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto;'
      el.addEventListener('click', (ev) => {
        ev.stopPropagation()
        this.stationClickCb?.(st.id)
      })
      this.layer.appendChild(el)
      this.markerEls.set(st.id, el)
    })
    // 重挂选点 / 起点标记
    if (this.pickPoint) {
      const el = pickMarkerEl()
      ;(el.querySelector('[data-role="coords"]') as HTMLElement).textContent =
        `${this.pickPoint.lng.toFixed(6)}, ${this.pickPoint.lat.toFixed(6)}`
      el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);pointer-events:auto;'
      this.layer.appendChild(el)
      this.pickEl = el
    }
    if (this.originPoint) {
      const el = originMarkerEl()
      el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);'
      this.layer.appendChild(el)
      this.originEl = el
    }
    this.relayout()
  }

  setActive(id: string | null): void {
    for (const [sid, el] of this.markerEls) {
      el.classList.toggle('is-active', sid === id)
      el.querySelector('.ark-marker__pulse')?.remove()
      if (sid === id) el.insertAdjacentHTML('afterbegin', '<span class="ark-marker__pulse"></span>')
    }
  }

  onStationClick(cb: (id: string) => void): void {
    this.stationClickCb = cb
  }
  onMapClick(cb: (p: LatLng) => void): void {
    this.mapClickCb = cb
  }
  onViewChange(cb: (v: ViewportInfo) => void): void {
    this.viewCb = cb
  }
  onCursorMove(_cb: (p: LatLng | null) => void): void {
    /* 演示模式不提供光标跟踪 */
  }

  snapshotView(): void {
    this.emitView()
  }

  setPickPoint(p: LatLng | null, onDrag?: (p: LatLng) => void): void {
    this.pickEl?.remove()
    this.pickEl = null
    this.pickPoint = p
    if (!p) return
    const el = pickMarkerEl()
    const coordsEl = el.querySelector('[data-role="coords"]') as HTMLElement
    coordsEl.textContent = `${p.lng.toFixed(6)}, ${p.lat.toFixed(6)}`
    el.style.cssText =
      'position:absolute;transform:translate(-50%,-50%);cursor:move;pointer-events:auto;'
    // 演示模式拖拽：按住拖动
    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      const move = (e2: PointerEvent) => {
        const rect = this.host.getBoundingClientRect()
        const np = this.toLngLat(e2.clientX - rect.left, e2.clientY - rect.top)
        this.pickPoint = np
        coordsEl.textContent = `${np.lng.toFixed(6)}, ${np.lat.toFixed(6)}`
        const { x, y } = this.toXY(np)
        el.style.left = `${x}px`
        el.style.top = `${y}px`
      }
      const up = (e2: PointerEvent) => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        const rect = this.host.getBoundingClientRect()
        const np = this.toLngLat(e2.clientX - rect.left, e2.clientY - rect.top)
        onDrag?.(np)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    })
    this.layer.appendChild(el)
    this.pickEl = el
    this.relayout()
  }

  setOrigin(p: LatLng | null): void {
    this.originEl?.remove()
    this.originEl = null
    this.originPoint = p
    if (!p) return
    const el = originMarkerEl()
    el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);pointer-events:auto;'
    this.layer.appendChild(el)
    this.originEl = el
    this.relayout()
  }

  async planRoute(origin: LatLng, dest: LatLng, mode: RouteMode): Promise<RouteResult> {
    // 直线 + 轻微曲率的模拟路径
    const mid = { lng: (origin.lng + dest.lng) / 2, lat: (origin.lat + dest.lat) / 2 }
    const k = 0.12
    const dx = dest.lat - origin.lat
    const dy = dest.lng - origin.lng
    const path: [number, number][] = [
      [origin.lng, origin.lat],
      [mid.lng - dx * k, mid.lat + dy * k],
      [dest.lng, dest.lat],
    ]
    const dist = haversineM(origin, dest) * 1.3
    const speed = mode === 'walk' ? 1.25 : mode === 'transit' ? 3.4 : 6.2
    const r: RouteResult = {
      distanceM: dist,
      durationS: dist / speed + (mode === 'transit' ? 300 : 0),
      path,
    }
    this.drawRoute(path, mode)
    return r
  }

  drawRoute(path: [number, number][], mode: RouteMode): void {
    this.routePath?.remove()
    this.routePath = null
    this.lastPath = path
    const pts = path.map(([lng, lat]) => this.toXY({ lng, lat }))
    const d = pts
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(' ')
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    pathEl.setAttribute('d', d)
    pathEl.setAttribute('fill', 'none')
    pathEl.setAttribute('stroke', ARK_SIGNAL)
    pathEl.setAttribute('stroke-width', mode === 'walk' ? '3' : '4')
    if (mode === 'walk') pathEl.setAttribute('stroke-dasharray', '8 6')
    pathEl.setAttribute('pathLength', '1')
    pathEl.style.strokeDasharray = mode === 'walk' ? '' : '1 1'
    pathEl.style.strokeDashoffset = '1'
    pathEl.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.22,.8,.2,1)'
    this.svg.appendChild(pathEl)
    this.routePath = pathEl
    requestAnimationFrame(() => {
      pathEl.style.strokeDashoffset = '0'
    })
    window.setTimeout(
      () => this.fitPoints(path.map(([lng, lat]) => ({ lng, lat })), this.fitPadLeftPx),
      1300,
    )
  }

  clearRoute(): void {
    this.routePath?.remove()
    this.routePath = null
    this.lastPath = null
  }

  fitPoints(points: LatLng[], _padLeftPx = 0): void {
    if (!points.length) return
    const lngs = points.map((p) => p.lng)
    const lats = points.map((p) => p.lat)
    this.center = {
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    }
    const needLng = Math.max(...lngs) - Math.min(...lngs)
    const needLat = Math.max(...lats) - Math.min(...lats)
    this.spanLng = Math.min(0.08, Math.max(0.003, needLng * 2.2, needLat * 1.8))
    this.emitView()
    this.relayout()
  }

  panTo(p: LatLng, _zoom?: number): void {
    this.center = { ...p }
    this.emitView()
    this.relayout()
  }

  geolocate(): Promise<LatLng> {
    return Promise.reject(new Error('演示模式不支持定位，请手动选取起点'))
  }

  zoomBy(delta: number): void {
    const k = Math.pow(2, -delta)
    this.spanLng = Math.min(0.08, Math.max(0.003, this.spanLng * k))
    this.emitView()
    this.relayout()
  }

  resetView(): void {
    this.center = { ...CAMPUS_CENTER }
    this.spanLng = 0.016
    this.emitView()
    this.relayout()
  }
}

/** 装饰性底图（演示模式）：静态道路网 + 建筑体块，低透明度中性色 */
function mockBackdrop(): string {
  const road = 'rgba(244,246,246,0.1)'
  const roadMinor = 'rgba(244,246,246,0.055)'
  const block = 'rgba(244,246,246,0.03)'
  return `
  <g stroke="${road}" stroke-width="3" fill="none">
    <path d="M -50 62 H 150" />
    <path d="M 30 -5 V 105" />
    <path d="M -50 30 C 20 28 55 44 150 40" />
  </g>
  <g stroke="${roadMinor}" stroke-width="1.6" fill="none">
    <path d="M -50 78 H 150" />
    <path d="M 55 -5 V 105" />
    <path d="M 12 -5 V 105" />
    <path d="M -50 46 H 150" />
  </g>
  <g fill="${block}" stroke="${roadMinor}" stroke-width="1">
    <rect x="16" y="14" width="13" height="9" />
    <rect x="34" y="10" width="9" height="12" />
    <rect x="60" y="48" width="16" height="9" />
    <rect x="18" y="66" width="10" height="8" />
    <rect x="66" y="70" width="12" height="7" />
    <rect x="38" y="84" width="14" height="8" />
  </g>`
}

/* ============================================================
   工厂：配置缺失 / ?mock=1 / 高德加载失败 → 演示模式
   ============================================================ */

export async function createMapController(
  host: HTMLElement,
  config: AmapConfig | null,
): Promise<{ controller: MapController; warning?: string }> {
  if (config && !forceMock()) {
    try {
      const controller = await AMapController.create(host, config)
      return { controller }
    } catch (err) {
      return {
        controller: new MockController(host),
        warning: (err as Error).message + ' — 已切换演示模式',
      }
    }
  }
  return { controller: new MockController(host) }
}
