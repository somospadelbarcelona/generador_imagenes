@echo off
echo ========================================
echo   SERVIDOR LOCAL - AMERICANAS APP
echo ========================================
echo.
echo Iniciando servidor en http://localhost:8000
echo.
echo IMPORTANTE: Deja esta ventana abierta mientras uses la app
echo Para detener el servidor, cierra esta ventana o presiona Ctrl+C
echo.
echo ========================================
echo.

cd /d "%~dp0"
python -m http.server 8000

pause
