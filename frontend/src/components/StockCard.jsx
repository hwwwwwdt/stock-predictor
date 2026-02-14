/**
 * StockCard.jsx — 即時股價資訊卡片
 *
 * 顯示股票代碼、公司名稱、目前市價與漲跌幅。
 * 漲跌以綠色（正）/ 紅色（負）區分。
 */

const StockCard = ({ ticker, name, price, currency, change, changePercent }) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? "text-green-600" : "text-red-600";
  const changeBg = isPositive ? "bg-green-50" : "bg-red-50";
  const arrow = isPositive ? "▲" : "▼";

  return (
    <article
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm
                 transition-shadow hover:shadow-md w-full max-w-sm"
      aria-label={`${name} 即時股價資訊`}
    >
      {/* 標頭：代碼 + 幣別 */}
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-lg bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
          {ticker}
        </span>
        <span className="text-xs text-gray-400">{currency}</span>
      </div>

      {/* 公司名稱 */}
      <h2 className="mb-1 text-lg font-semibold text-gray-800 truncate" title={name}>
        {name}
      </h2>

      {/* 目前市價 */}
      <p className="mb-3 text-3xl font-bold text-gray-900">
        {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>

      {/* 漲跌幅標籤 */}
      <div
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${changeBg} ${changeColor}`}
        aria-label={`漲跌 ${change >= 0 ? "上漲" : "下跌"} ${Math.abs(change).toFixed(2)}，幅度 ${Math.abs(changePercent).toFixed(2)}%`}
      >
        <span aria-hidden="true">{arrow}</span>
        <span>{Math.abs(change).toFixed(2)}</span>
        <span>({Math.abs(changePercent).toFixed(2)}%)</span>
      </div>
    </article>
  );
};

export default StockCard;
