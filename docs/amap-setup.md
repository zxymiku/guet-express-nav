# 高德开放平台配置

> 本项目使用高德 **JS API 2.0**（Web 与 Android WebView 共用）+ **URI Scheme**（唤起 App 导航）。

## 1. 申请 Key

1. 前往 [高德开放平台控制台](https://console.amap.com/dev/key/app) → 应用管理 → 创建新应用
2. 为应用添加 Key：
   - **Web 端（JS API）** —— 用于 map.zxymiku.top
   - **Web 端（JS API）** —— 用于 Android WebView（建议单独一枚，便于区分统计与吊销）
3. 每个 Key 会同时给出一对：**Key** + **安全密钥（jscode）**，两者必须配套使用

## 2. 安全密钥（jscode）说明

JS API 2.0 起强制安全校验，两种方式：

| 方式 | 说明 | 本项目采用 |
| --- | --- | --- |
| 安全密钥明文注入 | `_AMapSecurityConfig = { securityJsCode }` 需在 JS API 脚本加载**之前**设置 | ✅ Web：Worker 注入；Android：构建期注入 |
| 代理转发 | `_AMapSecurityConfig = { serviceHost: 'https://xx/_amapProxy' }` + 自建代理服务 | 备选（更安全，运维成本高） |

注入时序已由 `src/lib/amap.ts#loadAMap` 保证；Web 端注入内容来自 `window.__AMAP_CONFIG__`（Worker 写入）。

## 3. 域名白名单

| 环境 | Key | 白名单建议 |
| --- | --- | --- |
| map.zxymiku.top | Web Key A | 绑定 `map.zxymiku.top`（控制台 → Key 设置 → 域名白名单） |
| Android WebView | Web Key B | **留空**（Capacitor 域为 `https://localhost`，不可绑定校园网外域名；白名单留空表示不校验来源，Key 泄露风险由 jscode + 渠道隔离缓解） |

> 两个 Key 不要复用同一枚：Web Key A 配置白名单后，Android 端 `https://localhost` 会被拒绝。

## 4. 变量映射

| 环境 | Key 来源 | 注入路径 |
| --- | --- | --- |
| Web 生产 | Cloudflare Secret `AMAP_JS_KEY` / `AMAP_SECURITY_CODE` | Worker 运行时注入 |
| Web 本地 | `.dev.vars` 或 `.env.local` | wrangler dev / Vite 构建期 |
| Android | GitHub Secret `AMAP_ANDROID_KEY` / `AMAP_SECURITY_CODE` | Actions 构建期 → `VITE_AMAP_*` |

## 5. URI Scheme 参数表

### 5.1 Android 主通道：`androidamap://navi`

```
androidamap://navi?sourceApplication=guet_express_nav&lat={lat}&lon={lng}&poiname={name}&dev=0
```

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `lat` / `lon` | ✅ | 目的地坐标，**GCJ-02** |
| `poiname` | ✅ | 目的地名称（URL 编码），导航结束页展示 |
| `dev` | ✅ | 坐标系标记：`0` = GCJ-02（本项目数据即此系） |
| `sourceApplication` | 建议 | 调用方标识，填 `guet_express_nav` |

- 备用 scheme：`amapuri://route/plan/?dlat={lat}&dlon={lng}&dname={name}&dev=0&t=0`
  （`t`：0 驾车 / 2 步行 / 1 公交）
- WebView 内由本地插件 `AmapLauncherPlugin` 以 `Intent.ACTION_VIEW` 分发；未安装高德时 JS 回退 5.2

### 5.2 兜底通道：`https://uri.amap.com/navigation`

```
https://uri.amap.com/navigation?to={lng},{lat},{name}&mode={mode}&src=guet_express_nav&coordinate=gaode&callnative=1
```

| 参数 | 说明 |
| --- | --- |
| `to` | `经度,纬度,名称`（名称 URL 编码，逗号分隔） |
| `mode` | `car` / `walk` / `bus` |
| `coordinate` | `gaode`（= GCJ-02，勿传 wgs84） |
| `callnative` | `1` = 页面内尝试直接唤起高德 App |
| `src` | 调用方标识 |

使用场景：桌面 Web（新标签打开网页版导航）、移动端浏览器 scheme 跳转失败时、Android 未安装高德。

## 6. 坐标系（GCJ-02）

- 高德 JS API、`androidamap://`、`uri.amap.com` 全链路使用 **GCJ-02**
- 应用内「拾取坐标」得到的值即 GCJ-02，直接入库，**不要**做 WGS-84 转换
- 若从 GPS 模块 / Google Earth 取点，需先转 GCJ-02（见 [data-model.md](data-model.md) §坐标系）

## 7. 配额与合规

- 个人开发者 Key 有日调用量限制（地图加载 / 路线规划分项计费），校园量级通常充裕
- JS API 免费配额与商用政策见 [高德价格说明](https://lbs.amap.com/docs//quota)
- 地图页需保留高德 logo / 版权标识（本项目保留默认元素，仅降低透明度）
