@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

:: ==============================================================
:: CORIDE DEVELOPMENT MENU
:: ==============================================================

title CoRide Development Menu
color 0b

:menu
cls
echo.
echo  ==============================================================
echo             CORIDE - HE THONG KHOI DONG UNG DUNG
echo  ==============================================================
echo.
echo    [1] CHAY BACKEND + WEB + PRISMA (Khong Mobile)
echo    [2] CHAY TOAN BO (Backend + Web + Prisma + Mobile)
echo    [3] Chi chay Backend (API Server)
echo    [4] Chi chay Web Frontend (Mo trinh duyet localhost:3000)
echo    [5] Mobile: Expo Web Preview
echo    [6] Mobile: Expo Start (QR Code cho Mobile App)
echo    [7] Prisma Studio (Quan ly Database - localhost:5555)
echo    [8] Cai dat lai thu vien (npm install)
echo    [0] Thoat
echo.
echo  ==============================================================
set /p choice=" Chon tuy chon cua ban (0-8): "

if "%choice%"=="1" goto backend_web_prisma
if "%choice%"=="2" goto all
if "%choice%"=="3" goto backend
if "%choice%"=="4" goto web
if "%choice%"=="5" goto mobile_web
if "%choice%"=="6" goto mobile_qr
if "%choice%"=="7" goto prisma
if "%choice%"=="8" goto reinstall
if "%choice%"=="0" exit
goto menu

:backend_web_prisma
echo.
echo [INFO] Dang khoi dong Backend + Web + Prisma...
start cmd /k "title Prisma Studio & cd packages\database & npx prisma studio"
start cmd /k "title Backend & cd apps\backend & npm run dev"
start cmd /k "title Web Frontend & cd apps\web & npm run dev"
timeout /t 3 /nobreak > nul
start "" http://localhost:5001/api/docs/
start "" http://localhost:3000
echo [SUCCESS] Da khoi dong Backend va Web.
pause
goto menu

:all
echo.
echo [INFO] Dang khoi dong tat ca cac dich vu...
start cmd /k "title Prisma Studio & cd packages\database & npx prisma studio"
start cmd /k "title Backend & cd apps\backend & npm run dev"
start cmd /k "title Web Frontend & cd apps\web & npm run dev"
start cmd /k "title Mobile & cd apps\mobile & npm run start"
timeout /t 3 /nobreak > nul
start "" http://localhost:5001/api/docs/
start "" http://localhost:3000
echo [SUCCESS] Da khoi dong tat ca dich vu.
pause
goto menu

:backend
echo.
echo [INFO] Dang khoi dong Backend...
start cmd /k "title Backend & cd apps\backend & npm run dev"
timeout /t 3 /nobreak > nul
start "" http://localhost:5001/api/docs/
echo [SUCCESS] Da khoi dong Backend.
pause
goto menu

:web
echo.
echo [INFO] Dang khoi dong Web Frontend...
start cmd /k "title Web Frontend & cd apps\web & npm run dev"
timeout /t 3 /nobreak > nul
start "" http://localhost:5001/api/docs/
start "" http://localhost:3000
echo [SUCCESS] Da khoi dong Web Frontend.
pause
goto menu

:mobile_web
echo.
echo [INFO] Dang khoi dong Mobile o che do Web Preview...
npx turbo run dev --filter=@repo/mobile -- --web
pause
goto menu

:mobile_qr
echo.
echo [INFO] Dang khoi dong Expo (Scan QR Code tren dien thoai)...
npx turbo run dev --filter=@repo/mobile
pause
goto menu

:prisma
echo.
echo [INFO] Dang khoi dong Prisma Studio...
start "" http://localhost:5555
pushd packages\database
npx prisma studio
popd
    pause
goto menu

:reinstall
echo.
echo [INFO] Dang cai dat lai thu vien (npm install)...
call npm install
echo [SUCCESS] Da hoan tat cai dat.
pause
goto menu
