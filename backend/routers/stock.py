"""
股票路由模組

提供 GET /api/stock/{ticker} 端點：
1. 透過 yfinance 取得即時報價
2. 下載近 30 個交易日收盤價作為歷史資料
3. 使用 NumPy 線性迴歸預測未來 5 個交易日價格
"""

from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import APIRouter, HTTPException

from schemas.stock_schema import (
    PredictionInfo,
    PricePoint,
    StockData,
    StockResponse,
    StockResponseData,
)

router = APIRouter(prefix="/api", tags=["stock"])

# 模型參數常數
HISTORICAL_DAYS: int = 30   # 歷史資料天數（交易日）
PREDICTION_DAYS: int = 5    # 預測天數（交易日）


def _fetch_history(ticker: str) -> pd.DataFrame:
    """從 Yahoo Finance 下載歷史收盤價。

    下載近 3 個月資料以確保有足夠的交易日（排除假日後），
    再截取最近 HISTORICAL_DAYS 筆作為模型訓練資料。

    Args:
        ticker: 股票代碼（如 AAPL、2330.TW）

    Returns:
        包含最近 30 個交易日的 DataFrame

    Raises:
        HTTPException: 當找不到歷史資料時回傳 404
    """
    stock = yf.Ticker(ticker)
    df: pd.DataFrame = stock.history(period="3mo")

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"找不到股票代碼的歷史資料: {ticker}",
        )

    return df.tail(HISTORICAL_DAYS)


def _predict_prices(
    dates_ordinal: np.ndarray,
    prices: np.ndarray,
    last_date: datetime,
) -> list[PricePoint]:
    """使用線性迴歸模型預測未來交易日的股價。

    以 numpy.polyfit 擬合一次多項式（y = slope * x + intercept），
    模型特徵為日期序數（date.toordinal()），將日期轉為連續整數，
    使模型能捕捉線性時間趨勢。

    Args:
        dates_ordinal: 歷史日期序數陣列，shape (n,)
        prices: 對應的收盤價陣列，shape (n,)
        last_date: 歷史資料的最後一天（用於推算未來日期）

    Returns:
        包含 PREDICTION_DAYS 個預測價格點的列表（自動跳過週末）
    """
    # np.polyfit(x, y, deg=1) 回傳 [slope, intercept]
    slope: float
    intercept: float
    slope, intercept = np.polyfit(dates_ordinal, prices, 1)

    future_points: list[PricePoint] = []
    business_day_count: int = 0
    day_offset: int = 1

    while business_day_count < PREDICTION_DAYS:
        future_date: datetime = last_date + timedelta(days=day_offset)

        # 跳過週末（weekday: 0=一 ~ 4=五, 5=六, 6=日）
        if future_date.weekday() < 5:
            future_ordinal: int = future_date.toordinal()
            predicted_price: float = round(float(slope * future_ordinal + intercept), 2)

            future_points.append(
                PricePoint(
                    date=future_date.strftime("%Y-%m-%d"),
                    price=predicted_price,
                )
            )
            business_day_count += 1

        day_offset += 1

    return future_points


@router.get("/stock/{ticker}", response_model=StockResponse)
async def get_stock(ticker: str) -> StockResponse:
    """取得股票即時報價、30 天歷史走勢與未來 5 天價格預測。

    處理流程：
    1. Guard Clause — 驗證 ticker 有效性
    2. 取得即時報價（regularMarketPrice）
    3. 下載歷史收盤價並建構 PricePoint 列表
    4. 擬合 LinearRegression 模型並預測未來 5 個交易日
    5. 組裝統一回應格式回傳

    Args:
        ticker: 股票代碼（如 AAPL、2330.TW、TSLA）

    Returns:
        StockResponse: 包含 stock（即時報價）與 prediction（歷史+預測）
    """

    # --- Guard Clause: 驗證股票代碼有效性 ---
    stock = yf.Ticker(ticker)
    info: dict = stock.info

    if not info or info.get("regularMarketPrice") is None:
        raise HTTPException(
            status_code=404,
            detail=f"找不到股票代碼: {ticker}",
        )

    # --- 即時報價計算 ---
    price: float = info.get("regularMarketPrice", 0.0)
    previous_close: float = info.get("regularMarketPreviousClose", 0.0)
    change: float = round(price - previous_close, 2)
    change_percent: float = (
        round((change / previous_close) * 100, 2) if previous_close else 0.0
    )

    stock_data = StockData(
        ticker=ticker.upper(),
        name=info.get("shortName", ticker.upper()),
        price=price,
        currency=info.get("currency", "USD"),
        change=change,
        change_percent=change_percent,
    )

    # --- 歷史資料建構 ---
    df: pd.DataFrame = _fetch_history(ticker)
    dates: pd.DatetimeIndex = df.index
    close_prices: np.ndarray = df["Close"].values

    historical_data: list[PricePoint] = [
        PricePoint(
            date=dates[i].strftime("%Y-%m-%d"),
            price=round(float(close_prices[i]), 2),
        )
        for i in range(len(dates))
    ]

    # --- Linear Regression 預測 ---
    dates_ordinal: np.ndarray = np.array([d.toordinal() for d in dates])
    last_date: datetime = dates[-1].to_pydatetime()

    predicted_data: list[PricePoint] = _predict_prices(
        dates_ordinal, close_prices, last_date
    )

    # --- 組裝回應 ---
    prediction = PredictionInfo(
        historical_data=historical_data,
        predicted_data=predicted_data,
    )

    return StockResponse(
        status="success",
        data=StockResponseData(stock=stock_data, prediction=prediction),
    )
