/**
 * PriceChart.jsx — Canvas 股價趨勢圖
 *
 * 使用原生 Canvas API 繪製：
 * - 藍色實線：近 30 個交易日歷史收盤價
 * - 紅色虛線：未來 5 個交易日預測價格
 * - 垂直分隔虛線標示歷史與預測的交界點
 *
 * 支援 HiDPI（devicePixelRatio）以確保高解析度顯示。
 */

import { useRef, useEffect } from "react";

/** Canvas 內部繪圖區域的邊距（px） */
const CHART_PADDING = { top: 20, right: 20, bottom: 50, left: 60 };

/** 顏色常數 */
const COLOR_HISTORICAL = "#6366f1"; // indigo-500（歷史線）
const COLOR_PREDICTED = "#ef4444";  // red-500（預測線）
const COLOR_GRID = "#e5e7eb";       // gray-200（格線）
const COLOR_LABEL = "#9ca3af";      // gray-400（軸標籤）
const COLOR_DIVIDER = "#d1d5db";    // gray-300（分隔線）

const PriceChart = ({ historicalData, predictedData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // 設定 HiDPI canvas 尺寸
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const chartW = width - CHART_PADDING.left - CHART_PADDING.right;
    const chartH = height - CHART_PADDING.top - CHART_PADDING.bottom;

    // 合併所有資料點，計算 Y 軸價格範圍
    const allPoints = [...historicalData, ...predictedData];
    const allPrices = allPoints.map((p) => p.price);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;
    const pricePadding = priceRange * 0.08; // 上下留 8% 緩衝

    const yMin = minPrice - pricePadding;
    const yMax = maxPrice + pricePadding;

    /** 將資料索引轉換為 canvas X 座標 */
    const toX = (i) => CHART_PADDING.left + (i / (allPoints.length - 1)) * chartW;

    /** 將價格轉換為 canvas Y 座標（Y 軸反轉） */
    const toY = (price) =>
      CHART_PADDING.top + chartH - ((price - yMin) / (yMax - yMin)) * chartH;

    // --- 清除畫布 ---
    ctx.clearRect(0, 0, width, height);

    // --- 繪製水平格線與 Y 軸標籤 ---
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 0.5;
    const gridLines = 5;

    for (let i = 0; i <= gridLines; i++) {
      const y = CHART_PADDING.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(CHART_PADDING.left, y);
      ctx.lineTo(width - CHART_PADDING.right, y);
      ctx.stroke();

      const labelValue = yMax - ((yMax - yMin) / gridLines) * i;
      ctx.fillStyle = COLOR_LABEL;
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(labelValue.toFixed(1), CHART_PADDING.left - 8, y + 4);
    }

    // --- 繪製歷史/預測分隔虛線 ---
    const splitIdx = historicalData.length - 1;
    const splitX = toX(splitIdx);

    ctx.strokeStyle = COLOR_DIVIDER;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(splitX, CHART_PADDING.top);
    ctx.lineTo(splitX, CHART_PADDING.top + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    // 分隔線旁的「歷史」/「預測」標註
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = COLOR_HISTORICAL;
    ctx.textAlign = "right";
    ctx.fillText("歷史", splitX - 6, CHART_PADDING.top + 14);
    ctx.fillStyle = COLOR_PREDICTED;
    ctx.textAlign = "left";
    ctx.fillText("預測", splitX + 6, CHART_PADDING.top + 14);

    // --- 繪製折線的共用函式 ---
    const drawLine = (points, startIdx, color, isDashed) => {
      if (points.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(isDashed ? [6, 3] : []);
      ctx.beginPath();
      ctx.moveTo(toX(startIdx), toY(points[0].price));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(toX(startIdx + i), toY(points[i].price));
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // 歷史走勢線（藍色實線）
    drawLine(historicalData, 0, COLOR_HISTORICAL, false);

    // 預測趨勢線（紅色虛線）— 從歷史最後一點銜接
    const predictionWithBridge = [
      historicalData[historicalData.length - 1],
      ...predictedData,
    ];
    drawLine(predictionWithBridge, splitIdx, COLOR_PREDICTED, true);

    // --- 繪製資料圓點的共用函式 ---
    const drawDots = (points, startIdx, fillColor) => {
      points.forEach((point, i) => {
        const x = toX(startIdx + i);
        const y = toY(point.price);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    };

    drawDots(historicalData, 0, COLOR_HISTORICAL);
    drawDots(predictedData, historicalData.length, COLOR_PREDICTED);

    // --- X 軸日期標籤（間隔顯示以避免重疊） ---
    ctx.fillStyle = COLOR_LABEL;
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";

    const labelStep = Math.max(1, Math.floor(allPoints.length / 7));
    allPoints.forEach((point, i) => {
      if (i % labelStep === 0 || i === allPoints.length - 1) {
        const x = toX(i);
        const label = point.date.slice(5); // 顯示 MM-DD
        ctx.save();
        ctx.translate(x, CHART_PADDING.top + chartH + 14);
        ctx.rotate(-Math.PI / 6); // 傾斜 30° 避免重疊
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    });
  }, [historicalData, predictedData]);

  return (
    <canvas
      ref={canvasRef}
      className="h-64 w-full rounded-xl border border-gray-200 bg-white"
      style={{ width: "100%", height: "256px" }}
      aria-label="股價歷史走勢與預測趨勢圖：藍色實線為近 30 日歷史收盤價，紅色虛線為未來 5 日預測價格"
      role="img"
      tabIndex="0"
    />
  );
};

export default PriceChart;
