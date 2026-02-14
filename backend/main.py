"""
Stock Predictor API — 應用程式進入點

啟動 FastAPI 伺服器，設定 CORS 中介軟體與路由掛載。
使用 lifespan context manager 管理應用程式生命週期。
"""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.stock import router as stock_router

# 允許跨域請求的前端來源清單（支援透過環境變數 ALLOWED_ORIGINS 新增額外來源，以逗號分隔）
ALLOWED_ORIGINS: list[str] = [
    "http://localhost:5173",
    *[o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()],
]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """應用程式啟動與關閉的生命週期管理器"""
    # --- 啟動階段 ---
    print("Stock Predictor API 啟動中...")
    yield
    # --- 關閉階段 ---
    print("Stock Predictor API 已關閉")


app = FastAPI(
    title="Stock Predictor API",
    description="提供股票即時報價、歷史走勢與線性迴歸預測功能",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS 中介軟體 — 允許前端 Vite dev server 跨域存取
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 掛載股票相關路由
app.include_router(stock_router)


@app.get("/")
async def root() -> dict[str, str]:
    """健康檢查端點，確認 API 服務正常運行"""
    return {"status": "success", "data": "Stock Predictor API is running"}
