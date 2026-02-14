/**
 * PredictionTable.jsx — 未來 5 日預測價格表格
 *
 * 以表格形式列出 Linear Regression 模型預測的未來交易日價格。
 * 奇偶行交替背景色以提升可讀性。
 */

const PredictionTable = ({ predictedData, currency }) => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm" aria-label="未來五日預測價格表格">
        <thead>
          <tr className="border-b border-gray-100 bg-red-50 text-left">
            <th scope="col" className="px-4 py-3 font-semibold text-red-700">
              預測日期
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold text-red-700">
              預測價格 ({currency})
            </th>
          </tr>
        </thead>
        <tbody>
          {predictedData.map((point, idx) => (
            <tr
              key={point.date}
              className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="px-4 py-2.5 text-gray-700">{point.date}</td>
              <td className="px-4 py-2.5 text-right font-medium text-red-600">
                {point.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PredictionTable;
