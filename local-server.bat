@echo off
REM LogWise - yerel test sunucusu (Faz 1-5 onizleme). Kapatmak icin bu pencereyi kapat.
cd /d "%~dp0"
set PY=python
where python >nul 2>&1 || set PY=py
echo.
echo   LogWise yerel sunucu calisiyor:
echo   http://localhost:8080/app.html
echo.
%PY% -m http.server 8080
pause
