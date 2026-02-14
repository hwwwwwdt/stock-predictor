"""
測試 /api/stock/{ticker} 端點
使用 2330.TW (台積電) 作為測試標的
驗證即時報價 + 歷史資料 + 預測資料
"""

import sys
from pathlib import Path

# 確保 backend/ 在 sys.path 中，讓 import 正確解析
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ---------- 正常查詢測試 ----------

def test_get_stock_2330_tw_status_code() -> None:
    """GET /api/stock/2330.TW 應回傳 200"""
    response = client.get("/api/stock/2330.TW")
    assert response.status_code == 200


def test_get_stock_2330_tw_top_level_format() -> None:
    """回傳 JSON 結構必須符合 { status, data }"""
    response = client.get("/api/stock/2330.TW")
    json_data: dict = response.json()

    assert json_data["status"] == "success"
    assert "data" in json_data
    assert "stock" in json_data["data"]
    assert "prediction" in json_data["data"]


def test_get_stock_2330_tw_stock_fields() -> None:
    """data.stock 應包含所有必要欄位"""
    response = client.get("/api/stock/2330.TW")
    stock: dict = response.json()["data"]["stock"]

    required_fields = ["ticker", "name", "price", "currency", "change", "change_percent"]
    for field in required_fields:
        assert field in stock, f"缺少欄位: {field}"


def test_get_stock_2330_tw_stock_types() -> None:
    """驗證 stock 各欄位資料型別"""
    response = client.get("/api/stock/2330.TW")
    stock: dict = response.json()["data"]["stock"]

    assert isinstance(stock["ticker"], str)
    assert isinstance(stock["name"], str)
    assert isinstance(stock["price"], (int, float))
    assert isinstance(stock["currency"], str)
    assert isinstance(stock["change"], (int, float))
    assert isinstance(stock["change_percent"], (int, float))


def test_get_stock_2330_tw_ticker_uppercase() -> None:
    """回傳的 ticker 應為大寫"""
    response = client.get("/api/stock/2330.TW")
    stock: dict = response.json()["data"]["stock"]
    assert stock["ticker"] == "2330.TW"


def test_get_stock_2330_tw_currency_is_twd() -> None:
    """台積電報價貨幣應為 TWD"""
    response = client.get("/api/stock/2330.TW")
    stock: dict = response.json()["data"]["stock"]
    assert stock["currency"] == "TWD"


def test_get_stock_2330_tw_price_positive() -> None:
    """股價應為正數"""
    response = client.get("/api/stock/2330.TW")
    stock: dict = response.json()["data"]["stock"]
    assert stock["price"] > 0


# ---------- 預測資料測試 ----------

def test_prediction_historical_data_exists() -> None:
    """prediction.historical_data 應為非空 list"""
    response = client.get("/api/stock/2330.TW")
    prediction: dict = response.json()["data"]["prediction"]

    assert isinstance(prediction["historical_data"], list)
    assert len(prediction["historical_data"]) > 0


def test_prediction_historical_data_has_30_points() -> None:
    """historical_data 應有最多 30 筆交易日資料"""
    response = client.get("/api/stock/2330.TW")
    historical: list = response.json()["data"]["prediction"]["historical_data"]

    assert len(historical) <= 30
    assert len(historical) >= 20  # 至少 20 筆（假日影響）


def test_prediction_predicted_data_has_5_points() -> None:
    """predicted_data 應恰好有 5 筆"""
    response = client.get("/api/stock/2330.TW")
    predicted: list = response.json()["data"]["prediction"]["predicted_data"]

    assert len(predicted) == 5


def test_prediction_data_point_format() -> None:
    """每個資料點應包含 date (str) 與 price (float)"""
    response = client.get("/api/stock/2330.TW")
    prediction: dict = response.json()["data"]["prediction"]

    for point in prediction["historical_data"]:
        assert "date" in point
        assert "price" in point
        assert isinstance(point["date"], str)
        assert isinstance(point["price"], (int, float))

    for point in prediction["predicted_data"]:
        assert "date" in point
        assert "price" in point
        assert isinstance(point["date"], str)
        assert isinstance(point["price"], (int, float))


def test_prediction_predicted_prices_are_positive() -> None:
    """預測價格應為正數"""
    response = client.get("/api/stock/2330.TW")
    predicted: list = response.json()["data"]["prediction"]["predicted_data"]

    for point in predicted:
        assert point["price"] > 0, f"預測日期 {point['date']} 的價格不應為負"


# ---------- 錯誤處理測試 ----------

def test_get_stock_invalid_ticker_returns_404() -> None:
    """查詢不存在的股票應回傳 404"""
    response = client.get("/api/stock/INVALIDTICKER999")
    assert response.status_code == 404


# ---------- 根路徑測試 ----------

def test_root_endpoint() -> None:
    """GET / 應回傳健康檢查訊息"""
    response = client.get("/")
    assert response.status_code == 200
    json_data: dict = response.json()
    assert json_data["status"] == "success"
