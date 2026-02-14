"""
Pydantic v2 回應模型定義

採用 RORO（Receive an Object, Return an Object）模式，
統一 API 回傳格式為 { status: str, data: StockResponseData }。
"""

from pydantic import BaseModel, Field


class StockData(BaseModel):
    """即時股價資訊"""
    ticker: str = Field(description="股票代碼（大寫）")
    name: str = Field(description="公司名稱")
    price: float = Field(description="目前市價")
    currency: str = Field(description="報價幣別（如 USD、TWD）")
    change: float = Field(description="漲跌金額（與前一收盤價之差）")
    change_percent: float = Field(description="漲跌百分比")


class PricePoint(BaseModel):
    """單一日期的價格資料點"""
    date: str = Field(description="日期（YYYY-MM-DD 格式）")
    price: float = Field(description="收盤價或預測價")


class PredictionInfo(BaseModel):
    """歷史走勢與預測資料"""
    historical_data: list[PricePoint] = Field(description="近 30 個交易日收盤價")
    predicted_data: list[PricePoint] = Field(description="未來 5 個交易日預測價")


class StockResponseData(BaseModel):
    """API 回應的 data 欄位"""
    stock: StockData = Field(description="即時報價資訊")
    prediction: PredictionInfo = Field(description="歷史與預測資料")


class StockResponse(BaseModel):
    """API 統一回應格式"""
    status: str = Field(description="回應狀態（success / error）")
    data: StockResponseData = Field(description="回應資料")
