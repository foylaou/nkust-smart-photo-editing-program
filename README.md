# Electron + Python IPC 範例 (簡化版)

這是一個極簡的 Electron 與 Python 整合範例，演示了如何使用 IPC (進程間通信) 在 Electron 前端 (React) 和 Python 後端之間交換數據。

此範例是從一個較複雜的應用程式簡化而來，旨在作為新專案的乾淨起點。

## 專案結構

```
.
├── frontend/             # Electron + React 前端
│   ├── electron/         # Electron 主進程與 Preload 腳本
│   │   ├── main.ts       # 主進程 (啟動 Python、處理 IPC)
│   │   └── preload.ts    # 預加載腳本 (暴露 API 給前端)
│   └── src/              # React 源代碼
│       ├── components/   # UI 組件 (SimpleIpcExample.tsx)
│       ├── App.tsx       # 主應用組件
│       └── types/        # TypeScript 類型定義
├── backend/              # Python 後端
│   ├── ipc_server.py     # IPC 伺服器 (通過 stdin/stdout 通信)
│   ├── agent/            # 業務邏輯 (agent.py)
│   └── requirements.txt  # Python 依賴
└── ...
```

## 功能演示

此範例包含一個簡單的介面，演示兩個核心 IPC 功能：
1.  **Chat (聊天)：** 前端發送字串給後端，後端回傳包含該字串的訊息。
2.  **Get Info (獲取資訊)：** 前端請求後端狀態，後端回傳結構化的 JSON 數據。

## 快速開始

### 1. 安裝依賴

首先，確保您的系統已安裝 Node.js 和 Python 3。

**安裝前端依賴：**
```bash
cd frontend
npm install
# 或者使用 pnpm
# pnpm install
```

**安裝後端依賴：**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 啟動開發模式

在專案根目錄執行啟動腳本 (確保已安裝依賴)：

**Mac/Linux:**
```bash
./start-dev.sh
```

**Windows:**
```powershell
./start-dev.ps1
```

或者手動啟動：
1.  在一個終端機中啟動前端開發伺服器：
    ```bash
    cd frontend
    npm run dev
    ```
2.  在另一個終端機中啟動 Electron (它會自動啟動 Python 後端)：
    ```bash
    cd frontend
    npm run start:electron
    ```

## IPC 工作原理

1.  **前端 (React):** 調用 `window.agent.chat('Hello')`。
2.  **Electron (Preload):** 透過 `ipcRenderer.invoke('agent:chat', ...)` 轉發請求。
3.  **Electron (Main):** 收到請求，將其封裝為 JSON `{ "action": "ai_chat", "query": "Hello" }`，並寫入 Python 子進程的 `stdin`。
4.  **Python (IPC Server):** 從 `stdin` 讀取 JSON，處理請求，並將結果寫回 `stdout`。
5.  **Electron (Main):** 監聽 Python 的 `stdout`，解析 JSON 回應，並將結果回傳給前端 Promise。

## 自定義

- 修改 `backend/agent/agent.py` 以添加您的 Python 業務邏輯。
- 修改 `frontend/src/components/SimpleIpcExample.tsx` 以構建您的 UI。
- 在 `frontend/electron/preload.ts` 和 `main.ts` 中添加新的 IPC 通道以支持更多功能。
