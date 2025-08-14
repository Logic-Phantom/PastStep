@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo    PastStep 3D 서버 실행 스크립트
echo ========================================
echo.

:: 프로젝트 루트 디렉토리
set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%"

:: 포트 설정
set "FRONTEND_PORT=5173"
set "BACKEND_PORT=8000"

:: 색상 코드
set "GREEN=[92m"
set "YELLOW=[93m"
set "CYAN=[96m"
set "RED=[91m"
set "RESET=[0m"

echo %CYAN%서버들을 시작하는 중...%RESET%
echo.

:: 백엔드 서버 시작
echo %YELLOW%백엔드 서버(FastAPI) 시작 중...%RESET%
cd /d "%BACKEND_DIR%"

:: Python 가상환경 확인 및 활성화
if exist "venv\Scripts\activate.bat" (
    echo %YELLOW%가상환경을 활성화합니다...%RESET%
    call venv\Scripts\activate.bat
)

:: 백엔드 서버를 백그라운드에서 시작
start "Backend Server" cmd /c "python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: 프론트엔드 서버 시작
echo %YELLOW%프론트엔드 서버(Vite) 시작 중...%RESET%
cd /d "%FRONTEND_DIR%"

:: 프론트엔드 서버를 백그라운드에서 시작
start "Frontend Server" cmd /c "npm run dev"

:: 서버 시작 대기
echo %CYAN%서버들이 시작되는 것을 기다리는 중...%RESET%
timeout /t 5 /nobreak >nul

:: 서버 상태 확인
set "maxAttempts=30"
set "attempts=0"

:check_servers
set /a attempts+=1
echo %YELLOW%서버 시작 대기 중... (!attempts!/%maxAttempts%)%RESET%

:: 포트 확인 (간단한 방법)
netstat -an | findstr ":%FRONTEND_PORT%" >nul 2>&1
set "frontend_ready=%errorlevel%"

netstat -an | findstr ":%BACKEND_PORT%" >nul 2>&1
set "backend_ready=%errorlevel%"

if !frontend_ready!==0 if !backend_ready!==0 (
    echo.
    echo %GREEN%✅ 모든 서버가 성공적으로 시작되었습니다!%RESET%
    echo %CYAN%🌐 프론트엔드: http://localhost:%FRONTEND_PORT%%RESET%
    echo %CYAN%🔧 백엔드 API: http://localhost:%BACKEND_PORT%%RESET%
    echo %CYAN%📚 API 문서: http://localhost:%BACKEND_PORT%/docs%RESET%
    echo.
    echo %YELLOW%서버를 중지하려면 다음 명령을 실행하세요:%RESET%
    echo stop-servers.bat
    echo.
    goto :monitor
)

if !attempts! lss %maxAttempts% (
    timeout /t 2 /nobreak >nul
    goto :check_servers
)

echo %RED%❌ 서버 시작 시간이 초과되었습니다.%RESET%
goto :stop_servers

:monitor
echo %CYAN%서버가 실행 중입니다. 중지하려면 Ctrl+C를 누르거나 stop-servers.bat를 실행하세요.%RESET%
echo.
pause

:stop_servers
echo %YELLOW%서버들을 중지하는 중...%RESET%

:: 프로세스 종료
taskkill /f /im "node.exe" >nul 2>&1
taskkill /f /im "python.exe" >nul 2>&1
taskkill /f /im "uvicorn.exe" >nul 2>&1

:: 포트 사용 프로세스 강제 종료
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT%"') do (
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT%"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo %GREEN%모든 서버가 중지되었습니다.%RESET%
pause
