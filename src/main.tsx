import ReactDOM from 'react-dom/client'
import App from './App'

// Ark 家族字体：Space Grotesk（技术拉丁展示）/ IBM Plex Mono（数据）/ Noto Sans SC（CJK UI）
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-sans-sc/700.css'

import './styles/ark-tokens.css'
import './styles/ark.css'

// 地图引擎单例：不启用 StrictMode 双调用，避免开发模式重复初始化底图
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
