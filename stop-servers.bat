@echo off
chcp 65001 >nul

echo ========================================
echo    PastStep 3D 서버 중지 스크립트
echo ========================================
echo.

:: 포트 설정
set "FRONTEND_PORT=5173"
set "BACKEND_PORT=8000"

:: 색상 코드
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

echo %YELLOW%서버들을 중지하는 중...%RESET%
echo.

:: Node.js 프로세스 종료 (프론트엔드)
echo %YELLOW%프론트엔드 서버 프로세스 중지 중...%RESET%
taskkill /f /im "node.exe" >nul 2>&1
if %errorlevel%==0 (
    echo %GREEN%✅ Node.js 프로세스가 종료되었습니다.%RESET%
) else (
    echo %YELLOW%ℹ️ 실행 중인 Node.js 프로세스가 없습니다.%RESET%
)

:: Python 프로세스 종료 (백엔드)
echo %YELLOW%백엔드 서버 프로세스 중지 중...%RESET%
taskkill /f /im "python.exe" >nul 2>&1
if %errorlevel%==0 (
    echo %GREEN%✅ Python 프로세스가 종료되었습니다.%RESET%
) else (
    echo %YELLOW%ℹ️ 실행 중인 Python 프로세스가 없습니다.%RESET%
)

:: Uvicorn 프로세스 종료
taskkill /f /im "uvicorn.exe" >nul 2>&1
if %errorlevel%==0 (
    echo %GREEN%✅ Uvicorn 프로세스가 종료되었습니다.%RESET%
)

:: 포트 사용 프로세스 강제 종료
echo %YELLOW%포트 사용 프로세스 정리 중...%RESET%

:: 프론트엔드 포트 (5173) 정리
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT%" 2^>nul') do (
    echo %YELLOW%포트 %FRONTEND_PORT% 사용 프로세스 종료: %%a%RESET%
    taskkill /f /pid %%a >nul 2>&1
)

:: 백엔드 포트 (8000) 정리
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT%" 2^>nul') do (
    echo %YELLOW%포트 %BACKEND_PORT% 사용 프로세스 종료: %%a%RESET%
    taskkill /f /pid %%a >nul 2>&1
)

:: 잠시 대기
timeout /t 2 /nobreak >nul

:: 최종 확인
echo.
echo %YELLOW%포트 사용 상태 확인 중...%RESET%

netstat -an | findstr ":%FRONTEND_PORT%" >nul 2>&1
if %errorlevel%==0 (
    echo %RED%⚠️ 포트 %FRONTEND_PORT%가 여전히 사용 중입니다.%RESET%
) else (
    echo %GREEN%✅ 포트 %FRONTEND_PORT%가 해제되었습니다.%RESET%
)

netstat -an | findstr ":%BACKEND_PORT%" >nul 2>&1
if %errorlevel%==0 (
    echo %RED%⚠️ 포트 %BACKEND_PORT%가 여전히 사용 중입니다.%RESET%
) else (
    echo %GREEN%✅ 포트 %BACKEND_PORT%가 해제되었습니다.%RESET%
)

echo.
echo %GREEN%🎉 모든 서버가 중지되었습니다!%RESET%
echo.
pause
