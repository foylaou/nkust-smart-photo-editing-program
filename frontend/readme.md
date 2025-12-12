# Frontend - Electron + React 前端

智慧商用計算機的桌面應用程式前端，使用 Electron 搭配 React + TypeScript。

## 目錄結構

```
frontend/
├── README.md               # 本文件
├── package.json
├── tsconfig.json
├── vite.config.ts          # Vite 設定
├── electron.vite.config.ts # Electron Vite 設定
├── main.js                 # Electron 主程序
├── preload.js              # 預載腳本 (IPC 橋接)
├── src/
│   ├── main.tsx            # React 入口
│   ├── App.tsx             # 主元件
│   ├── components/
│   │   ├── Calculator/     # 傳統計算機 UI
│   │   │   ├── Calculator.tsx
│   │   │   ├── Display.tsx
│   │   │   └── Keypad.tsx
│   │   ├── Agent/          # AI Agent 介面
│   │   │   ├── AgentChat.tsx
│   │   │   └── MessageBubble.tsx
│   │   └── common/
│   │       └── Button.tsx
│   ├── hooks/
│   │   ├── useCalculator.ts
│   │   └── useAgent.ts
│   ├── services/
│   │   └── ipc.ts          # IPC 通訊封裝
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
└── public/
    └── icon.png
```

## 安裝

```bash
# 安裝依賴
npm install

# 或使用 pnpm
pnpm install
```

## 開發

### 啟動開發伺服器

```bash
# 方式一：僅前端 (需要後端已啟動)
npm run dev

# 方式二：前後端同時啟動
npm run dev:full
```

### 開發模式說明

| 模式 | 指令 | 說明 |
|------|------|------|
| Vite Only | `npm run dev` | 僅啟動 Vite，用瀏覽器開發 UI |
| Electron Dev | `npm run electron:dev` | 啟動 Electron 開發模式 |
| Full Stack | `npm run dev:full` | 同時啟動前後端 |

## 專案架構說明

### Electron 主程序 (main.js)

負責：
- 建立應用程式視窗
- 啟動並管理 Python 後端進程
- 處理 IPC 通訊

```javascript
// main.js 核心邏輯
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');

let pythonProcess = null;

// 啟動 Python 後端
function startPythonBackend() {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    pythonProcess = spawn(pythonCmd, ['ipc_server.py'], {
        cwd: path.join(__dirname, '..', 'backend'),
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true  // Windows 不顯示 cmd 視窗
    });
    
    // 監聽 Python 輸出
    pythonProcess.stdout.on('data', handlePythonResponse);
}
```

### 預載腳本 (preload.js)

在渲染進程中暴露安全的 API：

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('calculator', {
    // 傳統計算機
    pressDigit: (digit) => ipcRenderer.invoke('calc:digit', digit),
    pressOperator: (op) => ipcRenderer.invoke('calc:operator', op),
    pressEquals: () => ipcRenderer.invoke('calc:equals'),
    clear: () => ipcRenderer.invoke('calc:clear'),
    
    // AI Agent
    askAgent: (query) => ipcRenderer.invoke('agent:query', query),
    
    // 訂閱即時回應
    onAgentResponse: (callback) => {
        ipcRenderer.on('agent:response', (_, data) => callback(data));
    }
});
```

### React 元件使用 IPC

```typescript
// src/hooks/useCalculator.ts
import { useState, useCallback } from 'react';

export function useCalculator() {
    const [display, setDisplay] = useState('0');
    
    const pressDigit = useCallback(async (digit: string) => {
        const result = await window.calculator.pressDigit(digit);
        setDisplay(result.display);
    }, []);
    
    const pressOperator = useCallback(async (op: string) => {
        const result = await window.calculator.pressOperator(op);
        setDisplay(result.display);
    }, []);
    
    return { display, pressDigit, pressOperator, ... };
}
```

```typescript
// src/hooks/useAgent.ts
import { useState, useCallback } from 'react';

export function useAgent() {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState('');
    
    const ask = useCallback(async (query: string) => {
        setLoading(true);
        try {
            const result = await window.calculator.askAgent(query);
            setResponse(result.response);
        } finally {
            setLoading(false);
        }
    }, []);
    
    return { loading, response, ask };
}
```

## TypeScript 類型定義

```typescript
// src/types/index.ts

// 計算機操作
export interface CalcResult {
    display: string;
}

// Agent 回應
export interface AgentResponse {
    success: boolean;
    response: string;
    breakdown?: PriceBreakdown;
}

// 價格明細
export interface PriceBreakdown {
    original_price: string;
    discount_rate?: string;
    discounted_price?: string;
    tax_rate?: string;
    tax_amount?: string;
    final_price: string;
}

// 擴展 Window 類型
declare global {
    interface Window {
        calculator: {
            pressDigit: (digit: string) => Promise<CalcResult>;
            pressOperator: (op: string) => Promise<CalcResult>;
            pressEquals: () => Promise<CalcResult>;
            clear: () => Promise<CalcResult>;
            askAgent: (query: string) => Promise<AgentResponse>;
            onAgentResponse: (callback: (data: AgentResponse) => void) => void;
        };
    }
}
```

## 元件設計

### Calculator 元件

```
┌────────────────────────────┐
│         Display            │  ← 顯示區
│           157.50           │
├────────────────────────────┤
│  7  │  8  │  9  │    ÷    │
├─────┼─────┼─────┼─────────┤
│  4  │  5  │  6  │    ×    │  ← 數字鍵盤
├─────┼─────┼─────┼─────────┤
│  1  │  2  │  3  │    −    │
├─────┼─────┼─────┼─────────┤
│  0  │  .  │  =  │    +    │
└────────────────────────────┘
```

### Agent Chat 元件

```
┌────────────────────────────┐
│  智慧助手                   │
├────────────────────────────┤
│                            │
│  User: $200打75折加5%稅    │
│                            │
│  AI: 計算結果如下：         │
│      原價: $200            │
│      75折: $150            │
│      稅金: $7.50           │
│      最終: $157.50         │
│                            │
├────────────────────────────┤
│  [輸入問題...        ] [送] │
└────────────────────────────┘
```

## 樣式方案

使用 Tailwind CSS：

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```typescript
// tailwind.config.js
export default {
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                calculator: {
                    bg: '#1a1a2e',
                    display: '#16213e',
                    button: '#0f3460',
                    operator: '#e94560',
                }
            }
        }
    }
}
```

## 打包

### 開發版本測試

```bash
npm run build
npm run electron:preview
```

### 生產版本打包

```bash
# 打包所有平台
npm run build:all

# 打包特定平台
npm run build:win     # Windows
npm run build:mac     # macOS
npm run build:linux   # Linux
```

### Electron Builder 設定

```json
// package.json
{
    "build": {
        "appId": "com.nkust.calculator",
        "productName": "智慧商用計算機",
        "directories": {
            "output": "release"
        },
        "files": [
            "dist/**/*",
            "main.js",
            "preload.js"
        ],
        "extraResources": [
            {
                "from": "../backend/dist/",
                "to": "backend/",
                "filter": ["**/*"]
            }
        ],
        "win": {
            "target": "nsis",
            "icon": "public/icon.ico"
        },
        "mac": {
            "target": "dmg",
            "icon": "public/icon.icns"
        },
        "linux": {
            "target": "AppImage",
            "icon": "public/icon.png"
        }
    }
}
```

## 開發注意事項

### ⚠️ 重要提醒

1. **Context Isolation**
   ```javascript
   // 必須啟用 contextIsolation
   webPreferences: {
       contextIsolation: true,  // 安全性必要
       nodeIntegration: false,  // 禁用 Node
       preload: path.join(__dirname, 'preload.js')
   }
   ```

2. **IPC 錯誤處理**
   ```typescript
   // 前端呼叫時要處理錯誤
   try {
       const result = await window.calculator.askAgent(query);
   } catch (error) {
       console.error('IPC Error:', error);
       // 顯示錯誤訊息給用戶
   }
   ```

3. **Python 進程管理**
   ```javascript
   // 確保在所有退出情境都清理
   app.on('before-quit', () => pythonProcess?.kill());
   app.on('window-all-closed', () => pythonProcess?.kill());
   process.on('exit', () => pythonProcess?.kill());
   
   // 處理 Python 崩潰
   pythonProcess.on('close', (code) => {
       if (code !== 0) {
           // 通知用戶或嘗試重啟
       }
   });
   ```

4. **跨平台路徑**
   ```javascript
   // ✅ 正確
   const backendPath = path.join(__dirname, '..', 'backend');
   
   // ❌ 錯誤
   const backendPath = __dirname + '/../backend';
   ```

5. **Windows CMD 視窗**
   ```javascript
   // spawn 時隱藏 Windows 命令視窗
   spawn(command, args, { windowsHide: true });
   ```

### 常見問題

<details>
<summary>Q: Electron 無法啟動 Python？</summary>

檢查：
1. Python 是否在 PATH 中
2. 路徑是否正確（使用 `path.join`）
3. 工作目錄是否正確

```javascript
// 除錯用
pythonProcess.stderr.on('data', (data) => {
    console.error('Python Error:', data.toString());
});
```
</details>

<details>
<summary>Q: 打包後找不到 Python 執行檔？</summary>

確保 `extraResources` 設定正確，並使用 `process.resourcesPath` 取得路徑：

```javascript
const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'calculator-backend')
    : path.join(__dirname, '..', 'backend', 'ipc_server.py');
```
</details>

<details>
<summary>Q: Hot Reload 不work？</summary>

Electron 開發模式需要特別設定：

```javascript
// 開發模式載入 Vite 開發伺服器
if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
} else {
    mainWindow.loadFile('dist/index.html');
}
```
</details>

<details>
<summary>Q: IPC 呼叫沒有回應？</summary>

1. 檢查 `ipcMain.handle` 是否正確註冊
2. 檢查 `preload.js` 是否正確載入
3. 檢查 Python 是否正確輸出 JSON

```javascript
// main.js 除錯
ipcMain.handle('agent:query', async (event, query) => {
    console.log('Received query:', query);
    const result = await sendToPython({ action: 'agent', query });
    console.log('Python result:', result);
    return result;
});
```
</details>

## 依賴說明

| 套件 | 用途 |
|------|------|
| electron | 桌面應用框架 |
| react | UI 框架 |
| typescript | 類型系統 |
| vite | 建構工具 |
| tailwindcss | CSS 框架 |
| electron-builder | 打包工具 |
| concurrently | 同時執行多指令 |
| wait-on | 等待服務啟動 |

## Scripts 說明

```json
{
    "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview",
        "electron:dev": "electron .",
        "electron:preview": "npm run build && electron .",
        "dev:full": "concurrently \"npm run backend\" \"wait-on http://localhost:8000 && npm run electron:dev\"",
        "backend": "cd ../backend && python -m uvicorn main:app --port 8000",
        "build:win": "electron-builder --win",
        "build:mac": "electron-builder --mac",
        "build:linux": "electron-builder --linux",
        "build:all": "electron-builder --win --mac --linux"
    }
}
```