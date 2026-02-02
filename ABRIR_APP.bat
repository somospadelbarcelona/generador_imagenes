@echo off
echo ========================================
echo   INICIANDO AMERICANAS APP
echo ========================================
echo.
echo Abriendo servidor y navegador...
echo.

cd /d "%~dp0"

REM Iniciar servidor en segundo plano
start /B python -m http.server 8000

REM Esperar 2 segundos para que el servidor inicie
timeout /t 2 /nobreak >nul

REM Abrir navegador
start http://localhost:8000

echo.
echo ========================================
echo   SERVIDOR ACTIVO EN http://localhost:8000
echo ========================================
echo.
echo IMPORTANTE: NO CIERRES ESTA VENTANA
echo Para detener, presiona Ctrl+C
echo.

REM Mantener ventana abierta
python -m http.server 8000
