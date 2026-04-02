@echo off
echo ============================================
echo   LOG WISE - Mobile Local Server
echo ============================================
echo.

:: Firewall kuralini ekle (Admin yetkisi gerektirir)
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Admin yetkisi gerekiyor. Sag tikla - Yonetici olarak calistir.
    echo.
    pause
    exit /b
)

:: Onceki kurali temizle ve yenisini ekle
netsh advfirewall firewall delete rule name="LogWise Local Server" >nul 2>&1
netsh advfirewall firewall add rule name="LogWise Local Server" dir=in action=allow protocol=tcp localport=8080 >nul 2>&1
echo [OK] Firewall kurali eklendi (port 8080).
echo.

:: IP adresini bul ve goster
echo ============================================
echo   TELEFONUNDAN ASAGIDAKI ADRESE GIT:
echo ============================================
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%
echo   http://%IP%:8080
echo.
echo ============================================
echo   Kapatmak icin bu pencereyi kapat.
echo ============================================
echo.

:: Sunucuyu baslat
cd /d "%~dp0"
python -m http.server 8080 --bind 0.0.0.0
pause
