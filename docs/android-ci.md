# Android CI — GitHub Actions 云端构建

> **硬性约束：本地不做任何 Gradle 编译。** 所有 APK 构建都在 GitHub Actions runner 上完成，
> 产物自动发布到 GitHub Releases。

## 1. 原理

```
push main / 手动触发
   └─ android.yml (ubuntu-latest)
        ├─ npm ci + vite build        ← GitHub Secrets 在此注入高德 Key（构建期）
        ├─ npx cap sync android       ← dist/ 拷入 android 工程（纯文件操作）
        ├─ 解码 ANDROID_KEYSTORE_BASE64 → android/keystore.jks + keystore.properties
        ├─ ./gradlew assembleRelease  ← 唯一的 Gradle 执行点（云端）
        └─ APK → Artifact + softprops/action-gh-release → GitHub Releases
```

- App 壳：Capacitor 7（`android/` 工程），WebView 直接加载 Web 构建产物，UI 与 Web 完全一致（Ark 视觉零损耗）
- 本地插件 `AmapLauncherPlugin`：`androidamap://` 自定义 scheme 经系统 Intent 唤起高德 App；
  未安装高德时 JS 侧回退 `https://uri.amap.com` 网页版
- `android/keystore.jks`、`android/keystore.properties` 均由 CI 生成，`.gitignore` 已排除

## 2. Repository Secrets 清单

| Secret 名称 | 用途 | 示例 / 获取方式 |
| --- | --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 编码的签名 keystore | 见 §3 生成后编码 |
| `KEYSTORE_PASSWORD` | keystore 密码 | keytool 生成时设定 |
| `KEY_ALIAS` | 签名别名 | 如 `guet-express-nav` |
| `KEY_PASSWORD` | 别名密码 | keytool 生成时设定 |
| `AMAP_ANDROID_KEY` | 高德 Key（WebView 内 JS API 使用） | 见 [amap-setup.md](amap-setup.md) §Android |
| `AMAP_SECURITY_CODE` | 上述 Key 的安全密钥 jscode | 高德控制台 |

设置路径：仓库 **Settings → Secrets and variables → Actions → New repository secret**。

## 3. 生成签名 keystore（本地生成文件 ≠ 本地编译）

> 生成 keystore 只是 `keytool` 生成一个密钥文件，不涉及任何 Gradle/Android 编译。

```bash
keytool -genkeypair -v \
  -keystore guet-express-nav.jks \
  -alias guet-express-nav \
  -keyalg RSA -keysize 2048 -validity 10000
```

无本地 JDK 时，可临时用任意一台有 JDK 的机器 / Docker 镜像 `eclipse-temurin:21` 执行，
或在 CI 里手动触发一次带 `workflow_dispatch` 的一次性任务生成（二选一即可）。

### 3.1 编码为 Base64

```bash
# macOS / Linux / Git Bash
base64 -w0 guet-express-nav.jks | clip    # Windows Git Bash 用 clip；mac 用 pbcopy
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("guet-express-nav.jks")) | Set-Clipboard
```

把输出整段粘贴到 Secret `ANDROID_KEYSTORE_BASE64`（单行，无换行）。

### 3.2 备份

**务必离线备份 `.jks` 与两组密码。** 丢失后无法以相同签名更新应用，只能换包名重发。

## 4. 触发与获取产物

- 触发：推送 `main` 分支，或 Actions 页手动 **Run workflow**
- 产物一：该次运行页的 **Artifacts**（`guet-express-nav-apk-<run_number>`）
- 产物二：**Releases** 页自动发布 `build-<run_number>` 标签，附 APK 与说明

## 5. Gradle 签名配置说明

`android/app/build.gradle`：

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
// CI 写入：storeFile=keystore.jks / storePassword / keyAlias / keyPassword
signingConfigs.release { ... }              // 仅当文件存在时读取
buildTypes.release { signingConfig signingConfigs.release }
```

文件不存在（如 PR fork 构建）时 release 退化为未签名，构建不会失败——签名材料只经 Secrets 注入。

## 6. 版本管理

- `versionCode` / `versionName`：`android/app/build.gradle` 内修改
- 每次 Release 以 `run_number` 递增命名（`build-12`），便于追溯
- 建议发版节奏：改代码 → push main → 下载 APK 冒烟 → 用 tag 归档

## 7. 常见失败

见 [troubleshooting.md](troubleshooting.md) §「CI 构建失败」。
