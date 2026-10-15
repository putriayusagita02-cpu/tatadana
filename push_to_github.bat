@echo off
chcp 65001 >nul
title TataDana — Push ke GitHub

echo =========================================================================
echo               TATADANA — ONE-CLICK PUSH KE GITHUB
echo =========================================================================
echo.
echo Repositori lokal Git sudah siap dengan branch 'main'.
echo.
set /p REPO_URL="Masukkan URL Repository GitHub Anda (contoh: https://github.com/username/tatadana.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] URL repository tidak boleh kosong.
    pause
    exit /b 1
)

echo.
echo Menghubungkan remote origin ke %REPO_URL%...
"C:\Program Files\Git\cmd\git.exe" remote remove origin 2>nul
"C:\Program Files\Git\cmd\git.exe" remote add origin %REPO_URL%

echo.
echo Melakukan push ke branch main di GitHub...
"C:\Program Files\Git\cmd\git.exe" push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUKSES] Seluruh kode TataDana berhasil diunggah ke GitHub!
    echo Sekarang Anda siap melakukan import proyek ini di Vercel.com.
) else (
    echo [CATATAN] Jika push gagal karena autentikasi, pastikan Anda sudah login ke akun GitHub Anda.
)

echo.
pause
