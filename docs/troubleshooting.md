# 故障排查

## 1. 地图不显示（演示模式横幅出现）

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 打开即有「尚未检测到高德地图密钥」提示 | 生产：Secrets 未设置或部署在设置前 | `wrangler secret put AMAP_JS_KEY` / `AMAP_SECURITY_CODE` 后**重新部署**或等待新请求生效 |
| 本地 dev 无地图 | `.env.local` / `.dev.vars` 未配置 | 对照 `.env.example` / `.dev.vars.example` 建文件后重启 dev |
| INVALID_USER_KEY 报错 | Key 类型错误（须为 **Web 端 JS API**）或粘贴带空格 | 控制台重建/复制，注意 Web Key 与 Android Key 分开 |
| 控制台 `USERKEY_PLAT_NOMATCH` | Key 与平台类型不符 | 用 Web端(JS API) 类型 Key |
| 加载超时（10s 后自动进演示模式） | 域名白名单拦了当前域 / 校园网拦截 | Web Key 白名单加 `map.zxymiku.top`；Android 用**白名单留空**的独立 Key |
| 底图灰白 / 脚本报错 | jscode 未注入或顺序错误 | 访问 `/api/health` 验证 Worker 注入；确认 `securityJsCode` 在 JS API 脚本前设置（`lib/amap.ts` 已处理） |

> 演示模式（Mock）为有意的优雅降级：无 Key / `?mock=1` / 加载失败时可用，界面完整。

### 手机端地图加载失败

| 场景 | 判断与处理 |
| --- | --- |
| **APK 内**提示「底图 20s 未就绪…已切换演示模式」 | Key 域名白名单拦了 `https://localhost` → 控制台把该 Key 白名单**留空**，无需重装 APK（Key 已打进包内，改白名单即生效） |
| 手机浏览器打开 map.zxymiku.top 失败，但桌面正常 | 通常是网络慢触发旧版 10s 超时（v1.0.1 已放宽到 20s）；刷新重试，仍失败看提示文案区分白名单/网络 |
| 微信/QQ 内置浏览器打开异常 | 内置 WebView 对 WebGL 支持参差 → 右上角「…」选系统浏览器打开 |
| 老旧手机白屏无瓦片 | JSAPI 2.0 依赖 WebGL；换系统浏览器 / 更新 WebView（Android System WebView） |

## 2. 应用内路线规划失败

| 报错 | 处理 |
| --- | --- |
| `路线规划失败（No data）` | 起终点过近或不可达；换出行方式试 |
| 公交无方案 | 起终点跨城/无线路；校园内短途建议步行/驾车 |
| 定位失败 | WebView/浏览器拒绝地理权限 → 用「地图选起点」手动打点 |

## 3. 导航跳转（高德 App）失败

| 场景 | 行为与处理 |
| --- | --- |
| 桌面浏览器 | 设计行为：新标签打开 `uri.amap.com` 网页版导航 |
| Android 浏览器 | 先尝试 `androidamap://`，1.2s 未离开页面自动落到网页版；确认手机装有高德 App |
| Android App 内 | `AmapLauncherPlugin` Intent 分发；若拒绝 scheme not allowed 检查 scheme 是否在白名单（http/https/androidamap/amapuri/iosamap）；未安装高德 → 回退网页版 |
| 坐标偏移 | 数据源坐标系错误（WGS-84 当 GCJ-02 用了），按 data-model.md §2 重新校准 |

## 4. CI 构建失败（android.yml）

| 报错 | 原因 | 处理 |
| --- | --- | --- |
| `ANDROID_KEYSTORE_BASE64 未配置` | Secret 缺失 | docs/android-ci.md §2 逐项补齐 |
| `gradle: Permission denied` | gradlew 未有执行位 | workflow 已含 `chmod +x gradlew`；若自定义步骤注意保留 |
| 签名失败 / `Keystore was tampered` | Base64 编码带换行、密码不符 | 重新 `base64 -w0`（单行）编码；核对两组密码与 alias |
| `Invalid keystore format` | 编码损坏（复制时截断） | 重新编码粘贴，Secret 值必须是一整行 |
| npm ci 失败 | package-lock.json 与 package.json 不同步 | 本地 `npm install` 后提交 lockfile |
| Release 发布 403 | 缺 `contents: write` | workflow 已内置 `permissions: contents: write`，勿删 |

## 5. Secrets 未生效

- Cloudflare：`wrangler secret put` 只影响**之后的**部署请求——重新 `npm run deploy`；用 `/api/health` 验证
- GitHub Actions：Secret 更新后需**重新触发 workflow**（push 或手动 Run）
- Vite 构建期变量（`VITE_*`）是**打进产物**的——改了 Secret 必须重新构建，改浏览器设置无效
- 检查拼写：`AMAP_JS_KEY` / `AMAP_SECURITY_CODE` / `AMAP_ANDROID_KEY` 严格区分大小写

## 6. 其他

| 问题 | 处理 |
| --- | --- |
| 首屏字体闪烁/未加载 | 字体经 fontsource 本地打包（按 unicode-range 分片），确认 `dist/assets/*.woff2` 随部署上传；勿改用外部 CDN（校园网不稳定） |
| 站点照片显示破图 | `public/stations/` 文件名与 `images` URL 不一致；跑 `node scripts/prepare-images.mjs` 重建 |
| `wrangler deploy` 域名绑定失败 | 账号无 `zxymiku.top` 区域权限 → 在 CF 面板手动添加 Worker 自定义域，或去掉 `routes` 用默认 `*.workers.dev` |
| 移动端底部被浏览器工具栏遮挡 | 已用 `100%` + safe-area；若仍遮挡确认 `viewport-fit=cover` 存在于 index.html |
| 拾取模式下点击无反应 | 确认处于「拾取」态（顶部提示条出现）；编辑器拾取需先点「在地图上拾取坐标」 |
