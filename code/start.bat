@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

:: ==============================================================
:: CORIDE DEVELOPMENT MENU
:: ==============================================================

title CoRide Control Center
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
echo    [3] CHAY BACKEND + MOBILE + PRISMA (Khong Web)
echo    [8] Cai dat lai thu vien (npm install)
echo    [9] Dong tat ca dich vu va thoat
echo    [0] Thoat va dong tat ca dich vu
echo.
echo  ==============================================================
choice /c 123890 /n /m " Chon tuy chon cua ban: "
if errorlevel 6 goto kill_all_and_exit
if errorlevel 5 goto kill_all_and_exit
if errorlevel 4 goto reinstall
if errorlevel 3 goto backend_mobile_prisma
if errorlevel 2 goto all
if errorlevel 1 goto backend_web_prisma
goto menu

:backend_web_prisma
echo.
echo [INFO] Dang khoi dong Backend + Web + Prisma (1 Cua so, nhieu tab)...
call :ensure_infrastructure
if errorlevel 1 goto startup_failed
wt -w CoRideDev --title "CR_SVC_Prisma" -d "%~dp0packages\database" cmd /c "title CR_SVC_Prisma && npx prisma studio --port 5555 --browser none" ; new-tab --title "CR_SVC_Backend" -d "%~dp0apps\backend" cmd /c "title CR_SVC_Backend && npm run dev" ; new-tab --title "CR_SVC_Gateway" -d "%~dp0apps\api-gateway" cmd /c "title CR_SVC_Gateway && npm run dev" ; new-tab --title "CR_SVC_Notification" -d "%~dp0apps\notification-service" cmd /c "title CR_SVC_Notification && npm run dev" ; new-tab --title "CR_SVC_Web" -d "%~dp0apps\web" cmd /c "title CR_SVC_Web && npm run dev"
timeout /t 10 /nobreak > nul 2>&1
start "" http://localhost:5001/api/docs/
start "" http://localhost:3000
start "" http://localhost:5555
echo [SUCCESS] Da khoi dong xong.
pause
goto menu

:all
echo.
echo [INFO] Dang khoi dong tat ca cac dich vu (1 Cua so, nhieu tab)...
call :ensure_infrastructure
if errorlevel 1 goto startup_failed
wt -w CoRideDev --title "CR_SVC_Prisma" -d "%~dp0packages\database" cmd /c "title CR_SVC_Prisma && npx prisma studio --port 5555 --browser none" ; new-tab --title "CR_SVC_Backend" -d "%~dp0apps\backend" cmd /c "title CR_SVC_Backend && npm run dev" ; new-tab --title "CR_SVC_Gateway" -d "%~dp0apps\api-gateway" cmd /c "title CR_SVC_Gateway && npm run dev" ; new-tab --title "CR_SVC_Notification" -d "%~dp0apps\notification-service" cmd /c "title CR_SVC_Notification && npm run dev" ; new-tab --title "CR_SVC_Web" -d "%~dp0apps\web" cmd /c "title CR_SVC_Web && npm run dev" ; new-tab --title "CR_SVC_Mobile" -d "%~dp0apps\mobile" cmd /c "title CR_SVC_Mobile && npm run start -- -c"
timeout /t 10 /nobreak > nul 2>&1
start "" http://localhost:5001/api/docs/
start "" http://localhost:3000
start "" http://localhost:5555
echo [SUCCESS] Da khoi dong tat ca dich vu.
pause
goto menu

:backend_mobile_prisma
echo.
echo [INFO] Dang khoi dong Backend + Mobile + Prisma (Khong Web)...
call :ensure_infrastructure
if errorlevel 1 goto startup_failed
wt -w CoRideDev --title "CR_SVC_Prisma" -d "%~dp0packages\database" cmd /c "title CR_SVC_Prisma && npx prisma studio --port 5555 --browser none" ; new-tab --title "CR_SVC_Backend" -d "%~dp0apps\backend" cmd /c "title CR_SVC_Backend && npm run dev" ; new-tab --title "CR_SVC_Gateway" -d "%~dp0apps\api-gateway" cmd /c "title CR_SVC_Gateway && npm run dev" ; new-tab --title "CR_SVC_Notification" -d "%~dp0apps\notification-service" cmd /c "title CR_SVC_Notification && npm run dev" ; new-tab --title "CR_SVC_Mobile" -d "%~dp0apps\mobile" cmd /c "title CR_SVC_Mobile && npm run start -- -c"
timeout /t 10 /nobreak > nul 2>&1
start "" http://localhost:5001/api/docs/
start "" http://localhost:5555
echo [SUCCESS] Da khoi dong Backend + Mobile + Prisma.
pause
goto menu

:reinstall
echo.
echo [INFO] Dang cai dat lai thu vien (npm install)...
call npm install
echo [SUCCESS] Da hoan tat cai dat.
pause
goto menu

:kill_all_and_exit
call :cleanup_services
echo.
echo [SUCCESS] Da dong toan bo cac dich vu va thoat.
endlocal
exit 0

:startup_failed
echo.
echo [ERROR] Khong the khoi dong ha tang. Hay mo Docker Desktop roi thu lai.
pause
goto menu

:ensure_infrastructure
echo [INFO] Dang kiem tra Docker, Redis va RabbitMQ...
docker info > nul 2>&1
if not errorlevel 1 goto docker_ready

set "DOCKER_DESKTOP=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if not exist "!DOCKER_DESKTOP!" set "DOCKER_DESKTOP=%LocalAppData%\Docker\Docker Desktop.exe"
if not exist "!DOCKER_DESKTOP!" exit /b 1

echo [INFO] Docker Desktop chua chay. Dang khoi dong Docker Desktop...
start "" "!DOCKER_DESKTOP!"
for /l %%i in (1,1,60) do (
    docker info > nul 2>&1
    if not errorlevel 1 goto docker_ready
    timeout /t 2 /nobreak > nul 2>&1
)
exit /b 1

:docker_ready
docker compose up -d --wait --wait-timeout 60 redis_cache rabbitmq
if errorlevel 1 exit /b 1
echo [SUCCESS] Redis va RabbitMQ da san sang.
exit /b 0

:cleanup_services
echo.
echo [INFO] Dang kiem tra va tat cac cong, dong cac cua so dich vu cua CoRide...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(3000, 5001, 5101, 5201, 5555, 8081, 8082, 19000, 19001, 19002, 19006); $pidsToKill = [System.Collections.Generic.HashSet[int]]::new(); $allProcs = Get-CimInstance Win32_Process; $procMap = @{}; foreach ($p in $allProcs) { $procMap[$p.ProcessId] = $p }; $cmdPid = $procMap[$PID].ParentProcessId; $excludePids = [System.Collections.Generic.HashSet[int]]::new(); [void]$excludePids.Add($PID); if ($cmdPid) { [void]$excludePids.Add($cmdPid); $parentCmd = $procMap[$cmdPid].ParentProcessId; if ($parentCmd) { [void]$excludePids.Add($parentCmd) } }; foreach ($port in $ports) { try { $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { $ownerPid = $c.OwningProcess; if ($ownerPid -and $ownerPid -gt 4 -and -not $excludePids.Contains($ownerPid)) { [void]$pidsToKill.Add($ownerPid); $parent = $procMap[$ownerPid].ParentProcessId; if ($parent -and $parent -gt 4 -and -not $excludePids.Contains($parent)) { [void]$pidsToKill.Add($parent) } } } } } catch {} }; foreach ($p in $allProcs) { $cmd = $p.CommandLine; if ($cmd -and -not $excludePids.Contains($p.ProcessId)) { if ($cmd -like '*CR_SVC_*' -or $cmd -like '*prisma studio*' -or $cmd -like '*tsx watch src/server.ts*' -or $cmd -like '*expo start*' -or $cmd -like '*next dev -p 3000*' -or ($cmd -like '*apps\backend*' -or $cmd -like '*apps\api-gateway*' -or $cmd -like '*apps\notification-service*' -or $cmd -like '*apps\mobile*' -or $cmd -like '*apps\web*' -or $cmd -like '*packages\database*')) { [void]$pidsToKill.Add($p.ProcessId); $parent = $p.ParentProcessId; if ($parent -and $parent -gt 4 -and -not $excludePids.Contains($parent)) { [void]$pidsToKill.Add($parent) } } } }; foreach ($targetPid in $pidsToKill) { if (-not $excludePids.Contains($targetPid)) { try { Start-Process -FilePath 'taskkill.exe' -ArgumentList '/F', '/T', '/PID', \"$targetPid\" -NoNewWindow -Wait -ErrorAction SilentlyContinue } catch {} } }"
taskkill /F /FI "WINDOWTITLE eq CR_SVC_*" > nul 2>&1
docker compose stop redis_cache rabbitmq > nul 2>&1
goto :eof
