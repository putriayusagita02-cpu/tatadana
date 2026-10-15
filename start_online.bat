@echo off
chcp 65001 >nul
title TataDana — Akses Online & Gerbang Publik

echo =========================================================================
echo               TATADANA FINTECH APP — RUNNER AKSES ONLINE
echo =========================================================================
echo.
echo Memastikan dependensi Python tersedia...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python tidak ditemukan di PATH sistem. Mohon install Python 3.
    pause
    exit /b 1
)

echo.
echo Memulai backend TataDana dan membuka gerbang akses publik HTTPS...
python -u scripts\tunnel_runner.py --auto
pause
