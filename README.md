# Stock Predictor — 股票報價與趨勢預測系統

<p align="center">
  <strong>即時股價查詢 ｜ 30 日歷史趨勢 ｜ 5 日線性迴歸預測</strong>
</p>

---

## 專案簡介

**Stock Predictor** 是一套全端（Full-Stack）股票分析應用程式，使用者只需輸入股票代碼（如 `AAPL`、`2330.TW`），即可取得：

1. **即時報價** — 當前股價、漲跌金額與漲跌幅
2. **歷史走勢** — 近 30 個交易日收盤價趨勢圖
3. **價格預測** — 基於 Linear Regression 模型預測未來 5 個交易日的價格走勢

本專案嚴格遵循 **RESTful API** 設計原則，前後端完全分離，所有資料交換皆透過 JSON 格式進行。

---

## 技術棧 (Tech Stack)

| 層級 | 技術 | 說明 |
|------|------|------|
| **Backend** | FastAPI, Pydantic v2, Uvicorn | 高效能非同步 API 框架，搭配型別安全的請求/回應驗證 |
| **Data** | yfinance, pandas, NumPy | 即時股價抓取與歷史資料處理 |
| **ML Model** | NumPy (polyfit Linear Regression) | 以日期序數為特徵、收盤價為目標的線性迴歸預測模型 |
| **Frontend** | React 19, Vite 6, TailwindCSS v4 | 現代化 SPA 架構，零 CSS 檔案的原子化樣式系統 |
| **Testing** | pytest, httpx, FastAPI TestClient | 14 項自動化測試涵蓋報價、預測、錯誤處理 |

---

## 系統架構

```
┌─────────────────┐         HTTP (JSON)         ┌─────────────────────┐
│                 │  GET /api/stock/{ticker}     │                     │
│   React SPA     │ ──────────────────────────>  │   FastAPI Backend   │
│   (port 5173)   │ <──────────────────────────  │   (port 8000)       │
│                 │   { status, data }           │                     │
└─────────────────┘                              └────────┬────────────┘
                                                          │
                                                          │ yfinance
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Yahoo Finance  │
                                                 │  (External API) │
                                                 └─────────────────┘
```

### RESTful API 設計

本專案嚴格遵循 REST 規範：

- **GET** 用於資料查詢（股價、歷史、預測）
- **統一回應格式**：所有端點回傳 `{ "status": "success", "data": { ... } }`
- **語義化 HTTP 狀態碼**：`200` 成功、`404` 找不到股票代碼
- **CORS** 明確允許前端 `http://localhost:5173` 跨域請求

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 健康檢查 (Health Check) |
| GET | `/api/stock/{ticker}` | 即時報價 + 歷史資料 + 5 日預測 |

### Linear Regression 預測模型

```
輸入特徵 (X)：日期序數 (date.toordinal())  →  shape: (30, 1)
目標變數 (y)：每日收盤價 (Close)           →  shape: (30,)

                    ┌──────────────────┐
  30 天歷史資料 ──> │ LinearRegression  │ ──> 未來 5 個交易日預測價格
  (X_train, y)      │   model.fit()    │     (自動跳過週末)
                    └──────────────────┘
```

**實作邏輯：**

1. 透過 `yfinance` 下載近 3 個月歷史資料，截取最近 30 個交易日
2. 將日期轉換為序數（`datetime.toordinal()`）作為模型特徵
3. 使用 `numpy.polyfit` 擬合一次多項式（線性迴歸）
4. 向未來推算 5 個交易日的日期序數，透過 `model.predict()` 取得預測價格
5. 自動排除週末（weekday >= 5），確保預測日期皆為交易日

---

## 專案結構

```
stock-predictor/
├── backend/
│   ├── main.py                      # FastAPI 進入點（CORS、lifespan）
│   ├── index.py                     # Vercel Serverless 入口點（re-export app）
│   ├── requirements.txt             # Python 相依套件
│   ├── routers/
│   │   └── stock.py                 # GET /api/stock/{ticker} 路由與預測邏輯
│   ├── schemas/
│   │   └── stock_schema.py          # Pydantic v2 回應模型（RORO 模式）
│   ├── utils/                       # 工具函式（預留擴充）
│   └── tests/
│       └── test_stock.py            # 14 項 pytest 自動化測試
├── frontend/
│   ├── index.html                   # SPA 入口
│   ├── package.json                 # Node.js 相依套件
│   ├── vite.config.js               # Vite 建置設定
│   ├── .env.example                 # 環境變數範例（Vercel 部署用）
│   └── src/
│       ├── main.jsx                 # React 掛載點
│       ├── index.css                # TailwindCSS v4 入口
│       ├── App.jsx                  # 主應用元件（搜尋、狀態管理、API 呼叫）
│       └── components/
│           ├── StockCard.jsx        # 即時報價卡片
│           ├── PriceChart.jsx       # Canvas 趨勢圖（歷史藍線 + 預測紅虛線）
│           └── PredictionTable.jsx  # 5 日預測價格表格
├── .cursorrules                     # AI 開發規範
├── .gitignore                       # Git 排除規則
├── start_dev.bat                    # 一鍵啟動前後端（Windows）
├── stop_dev.bat                     # 一鍵停止前後端（Windows）
└── README.md
```

---

## 安裝與啟動

### 環境需求

- **Python** 3.11+
- **Node.js** 20+
- **npm** 10+

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API 啟動於 `http://localhost:8000`，可造訪 `http://localhost:8000/docs` 查看自動生成的 Swagger 文件。

### Frontend

```bash
cd frontend
npm install
npm run dev
```

前端啟動於 `http://localhost:5173`。

### 一鍵啟動 / 停止（Windows）

```bash
start_dev.bat          # 同時啟動 Backend + Frontend
stop_dev.bat           # 乾淨關閉所有服務並釋放 Port
```

---

## API 回應範例

```json
{
  "status": "success",
  "data": {
    "stock": {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "price": 255.78,
      "currency": "USD",
      "change": -5.95,
      "change_percent": -2.27
    },
    "prediction": {
      "historical_data": [
        { "date": "2026-01-02", "price": 270.76 },
        { "date": "2026-01-05", "price": 267.01 }
      ],
      "predicted_data": [
        { "date": "2026-02-17", "price": 258.12 },
        { "date": "2026-02-18", "price": 257.85 },
        { "date": "2026-02-19", "price": 257.58 },
        { "date": "2026-02-20", "price": 257.31 },
        { "date": "2026-02-23", "price": 257.04 }
      ]
    }
  }
}
```

---

## 測試

```bash
cd backend
pytest tests/test_stock.py -v
```

共 **14 項測試**，涵蓋範圍：

| 分類 | 測試項目 |
|------|---------|
| 即時報價 | HTTP 200、回應格式、欄位存在性、型別驗證、ticker 大寫、幣別 TWD、價格正數 |
| 預測資料 | historical_data 非空、最多 30 筆、predicted_data 恰好 5 筆、資料點格式、預測價格正數 |
| 錯誤處理 | 無效 ticker 回傳 404 |
| 健康檢查 | 根路徑回傳 success |

---

## Vercel 部署

本專案支援部署至 **Vercel**，前端與後端分別建立兩個 Vercel 專案，指向同一個 GitHub 倉庫的不同根目錄。

```
┌──────────────────┐                        ┌──────────────────────┐
│  Vercel Project A │  ── API requests ──>  │  Vercel Project B    │
│  Frontend (Vite)  │                        │  Backend (FastAPI)   │
│  Root: frontend/  │  <── JSON response ── │  Root: backend/      │
└──────────────────┘                        └──────────────────────┘
```

> **部署順序**：先後端 → 再前端 → 最後回補後端環境變數。
> 因為前端需要後端的 URL，後端需要前端的 URL，所以第一次部署後端時可以先不設環境變數。

### 步驟一：部署後端（Backend）

1. 前往 [vercel.com/new](https://vercel.com/new)，匯入此 GitHub 倉庫
2. **Project Name** 設為 `stock-predictor-api`（不可與前端重複）
3. **Root Directory** 點 Edit，輸入 `backend`
4. **Framework Preset** 選擇 **FastAPI**
5. 環境變數先不用設，直接點 **Deploy**
6. 部署完成後，記下後端 URL（例如 `https://stock-predictor-api.vercel.app`）

### 步驟二：部署前端（Frontend）

1. 回到 Dashboard，再次點 **Add New > Project**，匯入同一個 GitHub 倉庫
2. **Project Name** 設為 `stock-predictor`
3. **Root Directory** 點 Edit，輸入 `frontend`
4. **Framework Preset** 自動偵測為 **Vite**
5. 展開 **Environment Variables**，新增：

   | Key | Value | 說明 |
   |-----|-------|------|
   | `VITE_API_BASE` | `https://stock-predictor-api.vercel.app` | 後端 URL，**結尾不加斜線** |

6. 點擊 **Deploy**
7. 部署完成後，記下前端 URL（例如 `https://stock-predictor.vercel.app`）

### 步驟三：回補後端 CORS 設定

1. 回到 Vercel Dashboard，進入**後端專案**（`stock-predictor-api`）
2. 點上方 **Settings** → 左側 **Environment Variables**
3. 新增：

   | Key | Value | 說明 |
   |-----|-------|------|
   | `ALLOWED_ORIGINS` | `https://stock-predictor.vercel.app` | 前端 URL，**結尾不加斜線** |

4. 回到 **Deployments** 頁籤，點最新部署旁的 **⋮ > Redeploy**，讓環境變數生效

### 環境變數總覽

| 變數名稱 | 設定位置 | 用途 |
|----------|---------|------|
| `VITE_API_BASE` | 前端專案 | 告訴前端「後端 API 在哪裡」（build 時注入，改完需 Redeploy） |
| `ALLOWED_ORIGINS` | 後端專案 | 告訴後端「允許哪個前端來源跨域存取」（CORS 白名單） |

> **注意**：`VITE_` 開頭的環境變數是在 **build 時**寫入前端程式碼的，修改後必須 **Redeploy** 才會生效。

### 其他注意事項

- **冷啟動延遲**：後端以 Serverless Function 運行，首次請求可能需 3-5 秒
- **Bundle 大小**：使用 NumPy 取代 scikit-learn 後，總 bundle 約 80MB，遠低於 250MB 上限
- **自動部署**：每次 `git push` 會同時觸發兩個專案的部署，Vercel 自動偵測變更範圍

