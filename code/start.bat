@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

if /i "%~1"=="--check-docker" (
    call :ensure_docker_stack
    exit /b !errorlevel!
)

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
echo    [1] CHAY DOCKER BACKEND + WEB + PRISMA (Khong Mobile)
echo    [2] CHAY TOAN BO (Docker Backend + Web + Mobile + Prisma)
echo    [3] CHAY DOCKER BACKEND + MOBILE + PRISMA (Khong Web)
echo    [8] Cai dat lai thu vien (pnpm install)
echo    [9] Dong Web/Mobile/Prisma va thoat (giu Docker chay ngam)
echo    [0] Thoat va dong Web/Mobile/Prisma (giu Docker chay ngam)
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
echo [INFO] Dang khoi dong Docker Backend + Web + Prisma...
call :ensure_docker_stack
if errorlevel 1 goto startup_failed
wt -w CoRideDev --title "CR_SVC_Prisma" -d "%~dp0packages\database" cmd /k "title CR_SVC_Prisma && pnpm.cmd exec prisma studio --port 5555 --browser none" ; new-tab --title "CR_SVC_Web" -d "%~dp0apps\web" cmd /k "title CR_SVC_Web && pnpm.cmd dev"
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
call :ensure_docker_stack
if errorlevel 1 goto startup_failed
wt -w CoRideDev --title "CR_SVC_Prisma" -d "%~dp0packages\database" cmd /k "title CR_SVC_Prisma && pnpm.cmd exec prisma studio --port 5555 --browser none" ; new-tab --title "CR_SVC_Web" -d "%~dp0apps\web" cmd /k "title CR_SVC_Web && pnpm.cmd dev" ; new-tab --title "CR_SVC_Mobile" -d "%~dp0apps\mobile" cmd /k "title CR_SVC_Mobile && pnpm.cmd start:expo -- --clear"
timeout /t 10 /nobreak > nul 2>&1
start "" http://localhost:5001/api/docs/
start "" http://localhost:3000
start "" http://localhost:5555
echo [SUCCESS] Da khoi dong tat ca dich vu.
pause
goto menu

:backend_mobile_prisma
echo.
echo [INFO] Dang khoi dong Docker Backend + Mobile + Prisma (Khong Web)...
call :ensure_docker_stack
if errorlevel 1 goto startup_failed
wt -w CoRideDev --title "CR_SVC_Prisma" -d "%~dp0packages\database" cmd /k "title CR_SVC_Prisma && pnpm.cmd exec prisma studio --port 5555 --browser none" ; new-tab --title "CR_SVC_Mobile" -d "%~dp0apps\mobile" cmd /k "title CR_SVC_Mobile && pnpm.cmd start:expo -- --clear"
timeout /t 10 /nobreak > nul 2>&1
start "" http://localhost:5001/api/docs/
start "" http://localhost:5555
echo [SUCCESS] Da khoi dong Backend + Mobile + Prisma.
pause
goto menu

:reinstall
echo.
echo [INFO] Dang cai dat lai thu vien (pnpm install)...
call pnpm.cmd install
echo [SUCCESS] Da hoan tat cai dat.
pause
goto menu

:kill_all_and_exit
call :cleanup_services
echo.
echo [SUCCESS] Da dong Web/Mobile/Prisma. Docker backend van chay ngam.
endlocal
exit 0

:startup_failed
echo.
echo [ERROR] Docker backend chua san sang.
echo [HINT] Hay bat Docker Desktop va chay: docker compose up -d
pause
goto menu

:ensure_docker_stack
echo [INFO] Dang kiem tra Docker backend dang chay ngam...
docker info > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop chua chay.
    exit /b 1
)

for %%S in (postgres_db redis_cache rabbitmq backend notification-service api-gateway) do (
    set "CONTAINER_ID="
    set "CONTAINER_STATE="
    set "HEALTH_STATE="
    for /f "delims=" %%C in ('docker compose ps -q %%S 2^>nul') do set "CONTAINER_ID=%%C"
    if not defined CONTAINER_ID (
        echo [ERROR] Container %%S chua chay.
        exit /b 1
    )
    for /f "delims=" %%R in ('docker inspect --format "{{.State.Status}}" "!CONTAINER_ID!" 2^>nul') do set "CONTAINER_STATE=%%R"
    for /f "delims=" %%H in ('docker inspect --format "{{.State.Health.Status}}" "!CONTAINER_ID!" 2^>nul') do set "HEALTH_STATE=%%H"
    if /i not "!CONTAINER_STATE!"=="running" (
        echo [ERROR] Container %%S khong running ^(state=!CONTAINER_STATE!^).
        exit /b 1
    )
    if /i not "!HEALTH_STATE!"=="healthy" (
        echo [ERROR] Container %%S chua healthy ^(health=!HEALTH_STATE!^).
        exit /b 1
    )
)

echo [SUCCESS] Docker backend dang running/healthy. Khong khoi dong lai container.
exit /b 0

:cleanup_services
echo.
echo [INFO] Dang dong Web, Mobile va Prisma Studio...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(3000, 5555, 8081, 8082, 19000, 19001, 19002, 19006); $pidsToKill = [System.Collections.Generic.HashSet[int]]::new(); $allProcs = Get-CimInstance Win32_Process; $procMap = @{}; foreach ($p in $allProcs) { $procMap[$p.ProcessId] = $p }; $cmdPid = $procMap[$PID].ParentProcessId; $excludePids = [System.Collections.Generic.HashSet[int]]::new(); [void]$excludePids.Add($PID); if ($cmdPid) { [void]$excludePids.Add($cmdPid); $parentCmd = $procMap[$cmdPid].ParentProcessId; if ($parentCmd) { [void]$excludePids.Add($parentCmd) } }; foreach ($port in $ports) { try { $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { $ownerPid = $c.OwningProcess; if ($ownerPid -and $ownerPid -gt 4 -and -not $excludePids.Contains($ownerPid)) { [void]$pidsToKill.Add($ownerPid); $parent = $procMap[$ownerPid].ParentProcessId; if ($parent -and $parent -gt 4 -and -not $excludePids.Contains($parent)) { [void]$pidsToKill.Add($parent) } } } } } catch {} }; foreach ($p in $allProcs) { $cmd = $p.CommandLine; if ($cmd -and -not $excludePids.Contains($p.ProcessId)) { if ($cmd -like '*CR_SVC_Prisma*' -or $cmd -like '*CR_SVC_Web*' -or $cmd -like '*CR_SVC_Mobile*' -or $cmd -like '*prisma studio*' -or $cmd -like '*expo start*' -or $cmd -like '*next dev*') { [void]$pidsToKill.Add($p.ProcessId); $parent = $p.ParentProcessId; if ($parent -and $parent -gt 4 -and -not $excludePids.Contains($parent)) { [void]$pidsToKill.Add($parent) } } } }; foreach ($targetPid in $pidsToKill) { if (-not $excludePids.Contains($targetPid)) { try { Start-Process -FilePath 'taskkill.exe' -ArgumentList '/F', '/T', '/PID', \"$targetPid\" -NoNewWindow -Wait -ErrorAction SilentlyContinue } catch {} } }"
taskkill /F /FI "WINDOWTITLE eq CR_SVC_*" > nul 2>&1
goto :eof
