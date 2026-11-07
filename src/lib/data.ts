/**
 * 快递站数据模型与花江校区示例数据
 * 坐标系：GCJ-02（高德 / 火星坐标），与高德 JS API 一致
 *
 * ⚠ 初始坐标为近似估计值。请在应用内进入「编辑」模式，用「拾取坐标」
 *   在真实位置打点校准，然后通过「导出 JSON」回写本文件。
 */

export type RouteMode = 'walk' | 'drive' | 'transit'

export interface ExpressStation {
  /** 唯一 id（短横线小写） */
  id: string
  name: string
  /** 品牌中文串，如 “顺丰 · 京东 · 极兔” */
  brand: string
  /** 品牌 EN 微标签（大写拉丁），如 “SF · JD · J&T” */
  brandEn: string
  campus: string
  /** GCJ-02 经度 */
  lng: number
  /** GCJ-02 纬度 */
  lat: number
  /** 多张图片，第一张为默认舞台图 */
  images: string[]
  businessHours?: string
  description?: string
}

/** 校区中心（地图初始视野）——花江校区，GCJ-02 */
export const CAMPUS_CENTER = { lng: 110.423, lat: 25.3085 }
/** 校区名称 */
export const CAMPUS_NAME = '花江校区'
export const CAMPUS_NAME_EN = 'GUET HUAJIANG CAMPUS'

/** 友链（Web 直接跳转 / Android 经系统浏览器打开） */
export const FRIEND_LINK = {
  name: '桂电美食分享',
  nameEn: 'GUET FOOD',
  url: 'https://food.zxymiku.top',
} as const

/** 高德 App 唤起来源标识 */
export const AMAP_SOURCE_APP = 'guet_express_nav'

export const STATIONS: ExpressStation[] = [
  {
    id: 'express-center',
    name: '快递综合服务发展中心',
    brand: '顺丰 · 京东 · 极兔 · 丰巢',
    brandEn: 'SF EXPRESS · JD · J&T · FENGNIAO',
    campus: CAMPUS_NAME,
    lng: 110.4243,
    lat: 25.3094,
    images: [
      '/stations/20261107-164357.jpg',
      '/stations/20261107-164355.jpg',
      '/stations/20261107-165514.jpg',
    ],
    businessHours: '08:30 – 21:00',
    description:
      '花江校区快递主枢纽。楼内集顺丰速运、京东快递、极兔速递等多品牌网点，门前设丰巢智能柜与京东快递柜，支持寄取件一站式办理。',
  },
  {
    id: 'sunshine-cainiao',
    name: '阳光广场菜鸟驿站',
    brand: '菜鸟 · 中通',
    brandEn: 'CAINIAO · ZTO',
    campus: CAMPUS_NAME,
    lng: 110.4186,
    lat: 25.3032,
    images: ['/stations/20261107-165456.jpg'],
    businessHours: '09:00 – 21:30',
    description:
      '位于南门外阳光广场的菜鸟驿站综合服务中心，与中通快递共址经营；凭取件码入库取件，支持上门寄递。',
  },
  {
    id: 'post-service',
    name: '花江校区综合便民服务站',
    brand: '中国邮政',
    brandEn: 'CHINA POST',
    campus: CAMPUS_NAME,
    lng: 110.416,
    lat: 25.3058,
    images: ['/stations/20261107-171811.jpg', '/stations/20261107-171817.jpg'],
    businessHours: '09:00 – 18:00',
    description:
      '中国邮政承运的校区综合便民服务站，收寄 EMS、平邮与报刊订阅，兼顾便民零售服务。',
  },
  {
    id: 'east-pickup',
    name: '东门临时取包点',
    brand: '多品牌代收',
    brandEn: 'MULTI-BRAND PICKUP',
    campus: CAMPUS_NAME,
    lng: 110.4262,
    lat: 25.3062,
    images: ['/stations/20261107-170115.jpg'],
    businessHours: '10:00 – 20:00',
    description:
      '东门商业街沿线的临时集中取包点，多品牌包裹摊位分发。位置与人流随季节调整，以现场为准。',
  },
]

/** 两点间近似球面距离（米） */
export function haversineM(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const R = 6371000
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}`
  return (m / 1000).toFixed(m < 10000 ? 1 : 0)
}

export function formatDuration(s: number): string {
  const min = Math.round(s / 60)
  if (min < 60) return `${min}`
  return `${Math.floor(min / 60)}h${min % 60}`
}

export function formatCoord(v: number): string {
  return v.toFixed(6)
}
