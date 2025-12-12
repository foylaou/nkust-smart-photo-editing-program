# 圖片處理工具使用說明

這是一個基于 Electron + React + Python 的圖片處理桌面應用。

## 項目結構

```
electronjs_python_ipc_example-main/
├── .venv/                    # Python 虛擬環境（項目根目錄）
├── backend/                  # Python 后端
│   ├── ipc_server.py        # IPC 服務器（圖片處理）
│   ├── tools/               # 圖片處理工具類
│   └── requirements.txt     # Python 依賴
└── frontend/                # Electron + React 前端
    ├── src/                 # React 源代碼
    ├── electron/            # Electron 主進程和預加載腳本
    └── package.json         # Node.js 依賴
```

## 環境要求

- **Node.js**: v16 或更高版本
- **Python**: 3.8 或更高版本
- **虛擬環境**: 已在項目根目錄創建 `.venv`

## 安裝步驟

### 1. 確認 Python 虛擬環境已激活並安裝依賴

```bash
# 在項目根目錄
source .venv/bin/activate  # Linux/Mac
# 或
.venv\Scripts\activate     # Windows

# 安裝 Python 依賴（如果尚未安裝）
cd backend
pip install -r requirements.txt
cd ..
```

### 2. 安裝前端依賴

```bash
cd frontend
npm install
```

## 運行方法

### 方法一：開發模式（推薦）

打開兩個終端：

**終端 1 - 啟動 Vite 開發服務器：**
```bash
cd frontend
npm run dev
```

**終端 2 - 啟動 Electron：**
```bash
cd frontend
npm run electron:dev
```

### 方法二：一鍵啟動（需要安裝 concurrently）

```bash
cd frontend
npm run dev:full
```

## 功能說明

### 文件操作
- **上傳圖片**: 拖放圖片到預覽區域，或點擊選擇文件
- **保存圖片**: 處理完成后點擊"保存圖片"按鈕
- **復原原圖**: 重置所有修改，恢復到原始圖片

### 基本變換
- **旋轉**: 輸入角度並旋轉圖片
- **翻轉**: 水平或垂直翻轉
- **調整尺寸**: 修改圖片寬高（可選保持比例）
- **中心裁切**: 從中心裁切指定大小

### 顏色調整
- **亮度**: 0.0-2.0（1.0 為原始亮度）
- **對比度**: 0.0-2.0（1.0 為原始對比度）
- **飽和度**: 0.0-2.0（1.0 為原始飽和度）
- **色相偏移**: 0-360 度
- **色溫**: 2000K-10000K
- **特殊效果**: 灰階、負片、自動對比、直方圖等化
- **懷舊色調**: 0.0-1.0 強度

### 濾鏡效果
- **模糊**: 高斯模糊或方框模糊
- **銳化**: 0.0-3.0 強度
- **馬賽克**: 2-50 像素大小
- **暈影**: 0.0-1.0 強度
- **邊緣檢測**: 檢測圖片邊緣
- **浮雕**: 浮雕效果
- **藝術效果**: 海報風、素描、油畫、卡通
- **邊框**: 1-50 像素寬度

## 故障排除

### Python 模塊未找到錯誤

如果看到 "ModuleNotFoundError: No module named 'numpy'"，請執行：

```bash
# 激活虛擬環境
source .venv/bin/activate

# 進入 backend 目錄
cd backend

# 安裝依賴
pip install -r requirements.txt
```

### Electron 無法找到虛擬環境

更新后的 `main.ts` 會按以下順序查找 Python：

1. `backend/.venv/bin/python3`
2. `<項目根目錄>/.venv/bin/python3` ✓（您的虛擬環境位置）
3. `backend/venv/bin/python3`
4. `<項目根目錄>/venv/bin/python3`
5. 系統 Python（不推薦）

查看控制台日志確認找到了正確的 Python 路徑。

### 開發工具無法打開

在 `electron/main.ts` 第 265 行，注釋掉或刪除這行：
```typescript
// mainWindow.webContents.openDevTools();
```

## 技術棧

- **前端框架**: React 19 + TypeScript
- **桌面框架**: Electron 39
- **構建工具**: Vite 7
- **樣式**: Tailwind CSS 4
- **圖標**: Lucide React
- **后端**: Python 3 + PIL/Pillow

## 開發說明

- 修改 React 組件后，Vite 會自動熱重載
- 修改 Electron 主進程代碼后，需要重啟 Electron
- 修改 Python 后端代碼后，需要重啟 Electron（Python 進程會隨之重啟）

## 授權

NKUST Electronic Engineering - AI Security Group
作者: Foy
