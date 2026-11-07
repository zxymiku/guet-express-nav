# 数据模型与坐标规范

## 1. ExpressStation 结构（src/lib/data.ts）

```ts
interface ExpressStation {
  id: string              // 唯一 id，小写短横线，如 'express-center'
  name: string            // 展示名（CJK）
  brand: string           // 品牌中文串，如 '顺丰 · 京东 · 极兔 · 丰巢'
  brandEn: string         // 品牌 EN 微标签（大写），如 'SF EXPRESS · JD · J&T'
  campus: string          // 校区名，如 '花江校区'
  lng: number             // GCJ-02 经度，6 位小数
  lat: number             // GCJ-02 纬度，6 位小数
  images: string[]        // 多张图片，第一张为默认舞台图
  businessHours?: string  // 营业时间（可选），如 '08:30 – 21:00'
  description?: string    // 描述（可选）
}
```

初始数据（花江校区 4 站点 + 实拍照片 `public/stations/*.jpg`）的坐标
**已于 2026-11-07 现场校准**（编辑器拾取 → 导出 JSON 回写）。
后续新增站点直接重复 §3 流程即可。

## 2. 坐标系：GCJ-02

- 本项目全链路（高德 JS API、选点拾取、`androidamap://`、`uri.amap.com`）统一 **GCJ-02**（火星坐标）
- 应用内「拾取坐标」在高德底图上打点，所得即 GCJ-02，直接入库，**无需转换**
- ⚠ 若从 GPS 硬件 / Google Earth / WGS-84 数据取点，必须先转换为 GCJ-02
  （可借高德坐标拾取器 https://lbs.amap.com/tools/picker 人工核对）
- 精度建议：小数 6 位 ≈ 0.1m；面板与导出统一 `toFixed(6)`

## 3. 坐标校准工作流（内置编辑器）

1. Web 打开应用 → 顶栏「编辑」→ 编辑面板
2. 「新建草稿」或「载入选中站点」
3. 「在地图上拾取坐标」→ 舞台进入拾取态（十字导轨）→ 在真实位置点击；Marker 可**拖拽微调**，经纬度实时回填
4. 「保存到当前列表」→ Marker 即时更新
5. 「复制列表 JSON」/「下载 data.json」
6. 把导出 JSON 覆盖 `src/lib/data.ts` 的 `STATIONS` 数组 → `npm run deploy` 重新发布

> 校准只需做一次；之后新增站点重复 2–5。

## 4. 图片存储建议

| 方案 | 做法 | 适配场景 |
| --- | --- | --- |
| 仓库内（当前） | `public/stations/<slug>.jpg`，构建时进入 `dist/stations/`，Workers 静态托管 | 少量固定图片（现状 7 张 ≈ 1.9MB） |
| 对象存储 / 图床 | 阿里 OSS / Cloudflare R2 / 图床 URL，`images` 直接填外链 | 图片多、频繁更新；注意跨域与防盗链 |
| Cloudflare Images | Workers 侧绑定，URL 稳定 | 与部署同生态，免运维 |

压缩：仓库脚本 `scripts/prepare-images.mjs`（sharp，长边 1600px / q78 mozjpeg），
新照片命名 `IMG_YYYYMMDD_HHMMSS.jpg` 放仓库根目录后执行 `node scripts/prepare-images.mjs`。

`images[0]` 为详情页默认舞台图，建议选择门头/全景；2–4 张为宜。

## 5. 友链与常量

- `FRIEND_LINK`：`https://food.zxymiku.top`（Web 新标签 / Android 系统浏览器）
- `CAMPUS_CENTER`：地图初始视野中心（花江校区，GCJ-02）
- `AMAP_SOURCE_APP`：URI Scheme 来源标识

## 6. 扩展建议（非当前实现）

- 数据量增长后可将 `data.ts` 抽为 `public/stations.json` 运行时 fetch（Worker 可加缓存头）
- 需要 CMS/多人协作时，接入 Workers KV 或 D1，Worker 暴露只读 API + 管理端鉴权
- `businessHours` 结构化为 `{open, close}` 可支持「营业中」状态灯（当前为纯文本展示）
