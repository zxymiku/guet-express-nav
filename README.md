# 桂电快递导航

> **GUET EXPRESS NAV · HUAJIANG CAMPUS**
> 桂林电子科技大学花江校区 · 快递站索引 / 选点校准 / 双通道导航
> `family: ark` × `depth: maximal` — 近黑底 · 青色信号 · 直线导轨 · 方形控件

---

## ◤ 概览 OVERVIEW

地图即舞台，功能停靠周缘：全幅暗色高德底图上以 Ark 风格方盒 Marker 标注全部快递站，
左侧索引/详情档案面板、右上缩放仪表、左下实时坐标仪、底部路线档案与状态条。

| 能力 | Web | Android (Capacitor) |
| --- | :-: | :-: |
| 站点索引 / 详情 / 营业时间 / 多图编辑式图库 | ✅ | ✅（同源产物，视觉零损耗） |
| 应用内路线（步行 / 驾车 / 公交，渐进绘制 + 距离/时间） | ✅ | ✅ |
| 跳转高德 App（`androidamap://` Scheme） | ✅（移动端浏览器） | ✅（原生 Intent，未装高德回退网页版） |
| 地图选点 → 回填 lng / lat（GCJ-02，可拖拽微调） | ✅ | ✅ |
| 站点数据编辑器（拾取校准 → 导出 JSON 回写） | ✅ | ✅ |
| 友链：[桂电美食分享](https://food.zxymiku.top) | 新标签 | 系统浏览器（不破坏应用内栈） |
| 无密钥优雅降级（演示模式，界面完整可交互） | ✅ | ✅ |

## ◤ 快速开始 QUICK START

```bash
npm ci

# 本地前端开发
cp .env.example .env.local        # 填 VITE_AMAP_KEY / VITE_AMAP_SECURITY_CODE
npm run dev                       # http://localhost:5173

# 无密钥先看界面（演示模式）
npm run dev                       # 直接打开即可，提示框选「进入演示模式」

# 发布 Web（Cloudflare Workers + map.zxymiku.top）
npx wrangler secret put AMAP_JS_KEY
npx wrangler secret put AMAP_SECURITY_CODE
npm run deploy                    # vite build && wrangler deploy

# Android APK（仅云端构建，本地零 Gradle）
# → 推送 main 或手动触发 Actions「android-build」→ Releases 下载 APK
# → Secrets 清单见 docs/android-ci.md
```

## ◤ 目录结构 STRUCTURE

```
guet-express-nav/
├── README.md                     # 本文件
├── docs/                         # 文档系统（下方索引）
├── src/
│   ├── components/               # Ark 组件：顶栏/侧轨/索引/详情/图库/路线/编辑器
│   ├── lib/
│   │   ├── amap.ts               # 地图控制器（高德实现 + 演示模式 Mock，同接口）
│   │   ├── amap-uri.ts           # URI Scheme / uri.amap.com 构造与唤起策略
│   │   ├── config.ts             # 密钥解析（Worker 注入 → VITE 变量 → 演示模式）
│   │   ├── data.ts               # ExpressStation 模型 + 花江校区示例数据
│   │   ├── native.ts             # Capacitor 桥（Browser / AmapLauncher）
│   │   └── mode.ts               # 浏览 / 拾取 / 编辑 模式定义
│   ├── plugins/amap-launcher.ts  # 本地插件 TS 封装
│   ├── styles/                   # ark-tokens.css（令牌）+ ark.css（壳层/组件/响应式）
│   └── main.tsx
├── worker/index.ts               # Cloudflare Worker（静态资源 + 密钥运行时注入）
├── scripts/prepare-images.mjs    # 实拍照片压缩入库
├── wrangler.jsonc                # assets + routes(map.zxymiku.top)
├── capacitor.config.ts           # appId top.zxymiku.guetexpress
├── android/                      # Capacitor 工程（含本地插件与云端签名配置）
├── .github/workflows/android.yml # 云端构建签名 APK → GitHub Releases
└── public/stations/              # 快递站实拍照片（已压缩）
```

## ◤ 文档索引 DOCUMENTS

| 文档 | 内容 |
| --- | --- |
| [docs/web-deploy.md](docs/web-deploy.md) | Cloudflare Workers 部署、域名绑定、Secrets、本地 wrangler dev |
| [docs/android-ci.md](docs/android-ci.md) | Actions 构建原理、Secrets 清单、keystore 生成与编码、Release 流程 |
| [docs/amap-setup.md](docs/amap-setup.md) | Key 申请、域名白名单、jscode、URI Scheme 参数表 |
| [docs/ark-design.md](docs/ark-design.md) | Ark Depth 4 设计决策：令牌 / 构图 / 组件变体 / 动效 / 响应式 |
| [docs/data-model.md](docs/data-model.md) | 数据结构、GCJ-02 规范、坐标校准工作流、图片存储 |
| [docs/troubleshooting.md](docs/troubleshooting.md) | 地图不显示 / 跳转失败 / CI 失败 / Secrets 未生效 |

## ◤ 密钥边界 SECRETS

**任何密钥不进入源码与公开仓库。**

| 层 | Secret | 注入方式 |
| --- | --- | --- |
| Cloudflare | `AMAP_JS_KEY` `AMAP_SECURITY_CODE` | Worker 响应 HTML 时运行时注入 |
| GitHub Actions | `AMAP_ANDROID_KEY` `AMAP_SECURITY_CODE` `ANDROID_KEYSTORE_BASE64` `KEYSTORE_PASSWORD` `KEY_ALIAS` `KEY_PASSWORD` | 构建期注入 / keystore 解码 |

## ◤ 当前状态 STATUS

- [x] Web 全功能 + Ark Depth 4 视觉（桌面 / 竖屏重排版已实测）→ **https://map.zxymiku.top**
- [x] Cloudflare Workers 部署 + 自定义域绑定（`/api/health` 可自检）
- [x] 高德 Key / jscode 已注入（Web 经 Cloudflare Secrets 运行时下发；Android 经 GitHub Secrets 构建期注入）
      —— 真实暗色底图、路线规划、POI 均已在线上验证
- [x] Android 云端签名构建 → Release 自动发布 APK（本地零 Gradle）
- [ ] 站点坐标校准：应用内编辑器拾取 → 导出回写（docs/data-model.md §3，初始坐标为估计值）
