/**
 * App.jsx — 主應用元件
 *
 * 職責：
 * 1. 管理搜尋狀態（ticker、loading、error）
 * 2. 呼叫 Backend API（GET /api/stock/{ticker}）
 * 3. 將回應資料分發給子元件（StockCard、PriceChart、PredictionTable）
 */

import { useState } from "react";
import StockCard from "./components/StockCard.jsx";
import PriceChart from "./components/PriceChart.jsx";
import PredictionTable from "./components/PredictionTable.jsx";

/** 後端 API 基礎位址 */
const API_BASE = "http://localhost:8000";

const App = () => {
  /* ---------- 狀態管理 ---------- */
  const [ticker, setTicker] = useState("");
  const [stockData, setStockData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* ---------- 事件處理 ---------- */

  /** 呼叫後端 API 取得股票報價與預測資料 */
  const handleSearch = async () => {
    const trimmed = ticker.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    setStockData(null);
    setPrediction(null);

    try {
      const response = await fetch(`${API_BASE}/api/stock/${trimmed}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.detail || "無法取得股票資料");
      }

      setStockData(json.data.stock);
      setPrediction(json.data.prediction);
    } catch (err) {
      setHasError(true);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /** 監聽 Enter 鍵觸發搜尋 */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  /* ---------- 渲染 ---------- */
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center px-4 py-12">
      {/* 標題區塊 */}
      <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-gray-900">
        Stock Predictor
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        輸入股票代碼，查看即時報價與 AI 趨勢預測
      </p>

      {/* 搜尋輸入框 */}
      <div className="mb-8 w-full max-w-md">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="輸入股票代碼後按 Enter 搜尋，例如 AAPL"
          aria-label="股票代碼輸入欄，按 Enter 搜尋"
          tabIndex="0"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm
                     shadow-sm transition-colors placeholder:text-gray-400
                     focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* 載入狀態 */}
      {isLoading && (
        <p className="text-sm text-gray-500 animate-pulse" role="status">
          正在取得股價資料與預測中...
        </p>
      )}

      {/* 錯誤訊息 */}
      {hasError && (
        <p className="text-sm text-red-500" role="alert">
          {errorMessage}
        </p>
      )}

      {/* 查詢結果 */}
      {stockData && prediction && (
        <div className="flex w-full flex-col items-center gap-6">
          {/* 即時報價卡片 */}
          <StockCard
            ticker={stockData.ticker}
            name={stockData.name}
            price={stockData.price}
            currency={stockData.currency}
            change={stockData.change}
            changePercent={stockData.change_percent}
          />

          {/* 趨勢圖表 */}
          <section className="w-full" aria-label="股價趨勢圖表區塊">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              趨勢圖
              <span className="ml-2 text-xs font-normal text-gray-400">
                <span className="inline-block h-2 w-4 rounded bg-indigo-500 align-middle" aria-hidden="true" /> 歷史
                <span className="ml-2 inline-block h-2 w-4 rounded bg-red-500 align-middle" aria-hidden="true" /> 預測
              </span>
            </h2>
            <PriceChart
              historicalData={prediction.historical_data}
              predictedData={prediction.predicted_data}
            />
          </section>

          {/* 預測價格表格 */}
          <section className="w-full" aria-label="未來五日預測價格區塊">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              未來 5 日預測價格
            </h2>
            <PredictionTable
              predictedData={prediction.predicted_data}
              currency={stockData.currency}
            />
          </section>
        </div>
      )}
    </main>
  );
};

export default App;
