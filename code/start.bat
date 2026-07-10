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
echo    [4] Web Frontend + Backend
echo    [5] Mobile (Expo Web Preview) + Backend
echo    [6] Mobile (Expo Start - QR Code) + Backend
echo    [7] Prisma Studio (Quan ly Database - localhost:5555)
echo    [8] Cai dat lai thu vien (npm install)
echo    [9] Dong tat ca dich vu dang chay
echo    [0] Thoat
echo.
echo  ==============================================================
set /p choice=" Chon tuy chon cua ban (0-9): "

if "%choice%"=="1" goto backend_web_prisma
if "%choice%"=="2" goto all
if "%choice%"=="3" goto backend
if "%choice%"=="4" goto web
if "%choice%"=="5" goto mobile_web
if "%choice%"=="6" goto mobile_qr
if "%choice%"=="7" goto prisma
if "%choice%"=="8" goto reinstall
if "%choice%"=="9" goto kill_all
if "%choice%"=="0" goto kill_all_and_exit
goto menu

:backend_web_prisma
echo.
echo [INFO] Dang khoi dong Backend + Web + Prisma (5 Cua so)...
start cmd /c "title Prisma Studio & cd packages\database & npx prisma studio"
start cmd /c "title Backend & cd apps\backend & npm run dev"
start cmd /c "title API Gateway & cd apps\api-gateway & npm run dev"
start cmd /c "title Notification Service & cd apps\notification-service & npm run dev"
start cmd /c "title Web Frontend & cd apps\web & npm run dev"
timeout /t 10 /nobreak > nul
start "" http://localhost:5001/api/docs/
start "" http://localhost:3000
echo [SUCCESS] Da khoi dong xong.
pause
goto menu

:all
echo.
echo [INFO] Dang khoi dong tat ca cac dich vu...
start cmd /c "title Prisma Studio & cd packages\database & npx prisma studio"
start cmd /c "title Backend & cd apps\backend & npm run dev"
start cmd /c "title API Gateway & cd apps\api-gateway & npm run dev"
start cmd /c "title Notification Service & cd apps\notification-service & npm run dev"
start cmd /c "title Web Frontend & cd apps\web & npm run dev"
start cmd /c "title Mobile & cd apps\mobile & npm run start -- -c"
timeout /t 10 /nobreak > nul
start "" http://localhost:5001/api/docs/
start "" http://localhost:3000
echo [SUCCESS] Da khoi dong tat ca dich vu.
pause
goto menu

:backend
echo.
echo [INFO] Dang khoi dong Backend...
start cmd /c "title Backend & cd apps\backend & npm run dev"
start cmd /c "title Notification Service & cd apps\notification-service & npm run dev"
start cmd /c "title API Gateway & cd apps\api-gateway & npm run dev"
timeout /t 10 /nobreak > nul
start "" http://localhost:5001/api/docs/
echo [SUCCESS] Da khoi dong Backend.
pause
goto menu

:web
echo.
echo [INFO] Dang khoi dong Web Frontend va Backend...
start cmd /c "title Backend & cd apps\backend & npm run dev"
start cmd /c "title Notification Service & cd apps\notification-service & npm run dev"
start cmd /c "title API Gateway & cd apps\api-gateway & npm run dev"
start cmd /c "title Web Frontend & cd apps\web & npm run dev"
timeout /t 10 /nobreak > nul
start "" http://localhost:5001/api/docs/
start "" http://localhost:3000
echo [SUCCESS] Da khoi dong Web Frontend va Backend.
pause
goto menu

:mobile_web
echo.
echo [INFO] Dang khoi dong Mobile (Web Preview) va Backend...
start cmd /c "title Backend & cd apps\backend & npm run dev"
start cmd /c "title Notification Service & cd apps\notification-service & npm run dev"
start cmd /c "title API Gateway & cd apps\api-gateway & npm run dev"
start cmd /c "title Mobile & cd apps\mobile & pnpm run web"
echo [SUCCESS] Da khoi dong Mobile va Backend.
pause
goto menu

:mobile_qr
echo.
echo [INFO] Dang khoi dong Expo (Scan QR Code) va Backend...
start cmd /c "title Backend & cd apps\backend & npm run dev"
start cmd /c "title Notification Service & cd apps\notification-service & npm run dev"
start cmd /c "title API Gateway & cd apps\api-gateway & npm run dev"
start cmd /c "title Mobile & cd apps\mobile & pnpm expo start -c"
echo [SUCCESS] Da khoi dong Mobile va Backend.
pause
goto menu

:prisma
echo.
echo [INFO] Dang khoi dong Prisma Studio...
pushd packages\database
start cmd /c "title Prisma Studio & npx prisma studio"
popd
timeout /t 5 /nobreak > nul
start "" http://localhost:5555
pause
goto menu

:reinstall
echo.
echo [INFO] Dang cai dat lai thu vien (npm install)...
call npm install
echo [SUCCESS] Da hoan tat cai dat.
pause
goto menu

:kill_all
echo.
echo [INFO] Dang dong tat ca cac cua so CMD va Node.exe tren may tinh (Ngoai tru Menu)...
taskkill /F /IM node.exe /T > nul 2>&1
taskkill /F /FI "WINDOWTITLE neq CoRide Development Menu" /IM cmd.exe /T > nul 2>&1
echo [SUCCESS] Da dong tat ca dich vu thanh cong.
pause
goto menu

:kill_all_and_exit
echo.
echo [INFO] Dang dong tat ca cac cua so CMD va Node.exe tren may tinh...
taskkill /F /IM node.exe /T > nul 2>&1
taskkill /F /IM cmd.exe /T > nul 2>&1
echo [SUCCESS] Da dong tat ca dich vu va thoat.
endlocal
exit