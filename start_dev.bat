@echo off
echo ============================================
echo   Stock Predictor - Starting Dev Servers
echo ============================================
echo.

:: Start Backend
echo [1/2] Starting Backend (FastAPI) on port 8000...
start "Stock Predictor - Backend" cmd /k "cd /d %~dp0backend && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && uvicorn main:app --reload --port 8000"

:: Start Frontend
echo [2/2] Starting Frontend (Vite) on port 5173...
start "Stock Predictor - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo.
pause
