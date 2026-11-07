# Web 部署 — Cloudflare Workers

> 域名：**map.zxymiku.top** · 托管形态：静态资源（Vite 构建产物 `dist/`）+ Worker 注入层

## 1. 架构

```
浏览器 ──▶ Cloudflare Worker (guet-express-nav)
             ├── /api/health        → 部署自检（不回显密钥）
             ├── /api/amap-config   → window.__AMAP_CONFIG__ = { key, securityCode }
             │                        （来自 Secrets：AMAP_JS_KEY / AMAP_SECURITY_CODE）
             └── 其余路径            → [assets] 绑定 → dist/ 静态资源（SPA）
```

- `index.html` 以 `<script src="/api/amap-config">` 在模块脚本前同步加载配置；
  该路径不对应任何静态文件，必进 Worker（资源优先模式下同样成立）
- 高德 Key 与安全密钥（jscode）**不进入源码与构建产物**，运行时下发
- 前端 `src/lib/config.ts` 按 `window.__AMAP_CONFIG__` → `VITE_AMAP_*` 顺序解析配置；
  两者都缺失时自动进入演示模式（Mock 地图），界面完整可交互

## 2. 前置条件

- Cloudflare 账号，且 `zxymiku.top` 区域（Zone）已托管在该账号
- Node.js ≥ 20，npm ≥ 10
- 仓库已安装依赖：`npm ci`

## 3. 本地开发

### 3.1 纯前端开发（推荐日常使用）

```bash
cp .env.example .env.local   # 填入 VITE_AMAP_KEY / VITE_AMAP_SECURITY_CODE
npm run dev                  # http://localhost:5173
```

`.env.local` 已被 `.gitignore` 排除，不会提交。

### 3.2 验证 Worker 注入链路

```bash
npm run build                # 先产出 dist/
cp .dev.vars.example .dev.vars  # 填入 AMAP_JS_KEY / AMAP_SECURITY_CODE
npm run dev:worker           # wrangler dev，默认 http://localhost:8787
```

打开 `http://localhost:8787/api/health`，应返回：

```json
{ "ok": true, "amapKeyConfigured": true, "amapSecurityConfigured": true }
```

再打开 `http://localhost:8787/api/amap-config`，应返回
`window.__AMAP_CONFIG__={"key":"…","securityCode":"…"}`（密钥本体仅下发给同源浏览器）。

## 4. 设置生产 Secrets

```bash
npx wrangler login
npx wrangler secret put AMAP_JS_KEY          # 粘贴高德 Web端(JS API) Key
npx wrangler secret put AMAP_SECURITY_CODE   # 粘贴该 Key 的安全密钥 jscode
```

> Key 的申请与域名白名单见 [amap-setup.md](amap-setup.md)。

## 5. 部署与域名绑定

`wrangler.jsonc` 已配置：

```jsonc
{
  "name": "guet-express-nav",
  "main": "worker/index.ts",
  "assets": { "directory": "./dist", "binding": "ASSETS", "not_found_handling": "single-page-application" },
  "routes": [{ "pattern": "map.zxymiku.top", "custom_domain": true }]
}
```

一键部署（构建 + 发布 + 绑定自定义域）：

```bash
npm run deploy   # = vite build && wrangler deploy
```

首次执行 `custom_domain: true` 时，Wrangler 会在 `zxymiku.top` 区域自动创建
`map.zxymiku.top` 的 DNS 记录并绑定到 Worker（需账号具备该区域的 DNS 编辑权限）。

## 6. 部署后验收

1. `https://map.zxymiku.top` 打开：近黑底图 + 青色信号 UI 正常渲染
2. 地图瓦片加载（暗色高德底图），站点 Marker 显示
3. 详情 → 应用内路线绘制 / 跳转高德 App
4. `https://map.zxymiku.top/api/health` 返回两个 `true`
5. 友链「桂电美食分享」跳转 `https://food.zxymiku.top`

## 7. 更新密钥 / 回滚

```bash
npx wrangler secret put AMAP_JS_KEY        # 覆盖后立即生效（新请求）
npx wrangler rollback                      # 回滚到上一版本
npx wrangler deployments list              # 查看部署历史
```

## 8. 常见问题

见 [troubleshooting.md](troubleshooting.md) §「地图不显示」「Secrets 未生效」。
