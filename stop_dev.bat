@echo off
echo ============================================
echo   Stock Predictor - Stopping Dev Servers
echo ============================================
echo.

:: Stop Backend (port 8000)
echo [1/2] Stopping Backend (port 8000)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)

:: Stop Frontend (port 5173)
echo [2/2] Stopping Frontend (port 5173)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)

:: Close the named cmd windows
taskkill /FI "WINDOWTITLE eq Stock Predictor - Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Stock Predictor - Frontend*" /F >nul 2>&1

echo.
echo All servers stopped.
echo.
pause
