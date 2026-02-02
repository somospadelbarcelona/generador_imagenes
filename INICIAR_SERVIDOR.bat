@echo off
echo ========================================
echo   SOMOSPADEL - Servidor Local
echo ========================================
echo.
echo Iniciando servidor en http://localhost:8080
echo.
echo IMPORTANTE: Deja esta ventana ABIERTA
echo Cierra el navegador cuando termines
echo.
echo ========================================
echo.

cd /d "%~dp0"
python -m http.server 8080

pause
