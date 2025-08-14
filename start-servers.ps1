# PastStep 3D 서버 실행 스크립트
# 프론트엔드(Vite)와 백엔드(FastAPI) 서버를 동시에 실행

param(
    [switch]$Stop,
    [switch]$Restart
)

$ErrorActionPreference = "Stop"

# 프로젝트 루트 디렉토리
$ProjectRoot = $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = $ProjectRoot

# 프로세스 이름들
$FrontendProcessName = "node"
$BackendProcessName = "python"

# 포트 설정
$FrontendPort = 5173
$BackendPort = 8000

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Stop-Servers {
    Write-ColorOutput "서버들을 중지하는 중..." "Yellow"
    
    # 프론트엔드 서버 중지
    $frontendProcesses = Get-Process -Name $FrontendProcessName -ErrorAction SilentlyContinue | 
        Where-Object { $_.CommandLine -like "*vite*" -or $_.CommandLine -like "*npm*" -or $_.CommandLine -like "*node*" }
    
    if ($frontendProcesses) {
        Write-ColorOutput "프론트엔드 서버 프로세스 중지 중..." "Yellow"
        $frontendProcesses | Stop-Process -Force
    }
    
    # 백엔드 서버 중지
    $backendProcesses = Get-Process -Name $BackendProcessName -ErrorAction SilentlyContinue | 
        Where-Object { $_.CommandLine -like "*uvicorn*" -or $_.CommandLine -like "*fastapi*" }
    
    if ($backendProcesses) {
        Write-ColorOutput "백엔드 서버 프로세스 중지 중..." "Yellow"
        $backendProcesses | Stop-Process -Force
    }
    
    # 포트 사용 확인 및 정리
    Start-Sleep -Seconds 2
    
    if (Test-Port $FrontendPort) {
        Write-ColorOutput "포트 $FrontendPort가 여전히 사용 중입니다. 강제로 정리합니다..." "Red"
        netstat -ano | findstr ":$FrontendPort" | ForEach-Object {
            $pid = ($_ -split '\s+')[-1]
            if ($pid -match '\d+') {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    }
    
    if (Test-Port $BackendPort) {
        Write-ColorOutput "포트 $BackendPort가 여전히 사용 중입니다. 강제로 정리합니다..." "Red"
        netstat -ano | findstr ":$BackendPort" | ForEach-Object {
            $pid = ($_ -split '\s+')[-1]
            if ($pid -match '\d+') {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    }
    
    Write-ColorOutput "모든 서버가 중지되었습니다." "Green"
}

function Start-Servers {
    Write-ColorOutput "PastStep 3D 서버들을 시작하는 중..." "Cyan"
    
    # 백엔드 서버 시작
    Write-ColorOutput "백엔드 서버(FastAPI) 시작 중..." "Yellow"
    Set-Location $BackendDir
    
    # Python 가상환경 확인 및 활성화
    if (Test-Path "venv") {
        Write-ColorOutput "가상환경을 활성화합니다..." "Yellow"
        & "venv\Scripts\Activate.ps1"
    }
    
    # 백엔드 서버를 백그라운드에서 시작
    $backendJob = Start-Job -ScriptBlock {
        param($BackendDir)
        Set-Location $BackendDir
        python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    } -ArgumentList $BackendDir
    
    # 프론트엔드 서버 시작
    Write-ColorOutput "프론트엔드 서버(Vite) 시작 중..." "Yellow"
    Set-Location $FrontendDir
    
    # 프론트엔드 서버를 백그라운드에서 시작
    $frontendJob = Start-Job -ScriptBlock {
        param($FrontendDir)
        Set-Location $FrontendDir
        npm run dev
    } -ArgumentList $FrontendDir
    
    # 서버 시작 대기
    Write-ColorOutput "서버들이 시작되는 것을 기다리는 중..." "Cyan"
    Start-Sleep -Seconds 5
    
    # 서버 상태 확인
    $maxAttempts = 30
    $attempts = 0
    
    while ($attempts -lt $maxAttempts) {
        $frontendReady = Test-Port $FrontendPort
        $backendReady = Test-Port $BackendPort
        
        if ($frontendReady -and $backendReady) {
            Write-ColorOutput "`n✅ 모든 서버가 성공적으로 시작되었습니다!" "Green"
            Write-ColorOutput "🌐 프론트엔드: http://localhost:$FrontendPort" "Cyan"
            Write-ColorOutput "🔧 백엔드 API: http://localhost:$BackendPort" "Cyan"
            Write-ColorOutput "📚 API 문서: http://localhost:$BackendPort/docs" "Cyan"
            Write-ColorOutput "`n서버를 중지하려면 Ctrl+C를 누르거나 다음 명령을 실행하세요:" "Yellow"
            Write-ColorOutput ".\start-servers.ps1 -Stop" "White"
            break
        }
        
        $attempts++
        Write-ColorOutput "서버 시작 대기 중... ($attempts/$maxAttempts)" "Yellow"
        Start-Sleep -Seconds 2
    }
    
    if ($attempts -eq $maxAttempts) {
        Write-ColorOutput "❌ 서버 시작 시간이 초과되었습니다." "Red"
        Stop-Servers
        exit 1
    }
    
    # 작업 모니터링
    try {
        while ($true) {
            $frontendStatus = Get-Job $frontendJob.Id -ErrorAction SilentlyContinue
            $backendStatus = Get-Job $backendJob.Id -ErrorAction SilentlyContinue
            
            if ($frontendStatus.State -eq "Failed" -or $backendStatus.State -eq "Failed") {
                Write-ColorOutput "❌ 서버 중 하나가 실패했습니다." "Red"
                break
            }
            
            Start-Sleep -Seconds 5
        }
    }
    catch {
        Write-ColorOutput "서버 모니터링 중 오류가 발생했습니다: $_" "Red"
    }
    finally {
        Stop-Servers
        Get-Job | Stop-Job
        Get-Job | Remove-Job
    }
}

# 메인 실행 로직
if ($Stop) {
    Stop-Servers
}
elseif ($Restart) {
    Write-ColorOutput "서버를 재시작합니다..." "Cyan"
    Stop-Servers
    Start-Sleep -Seconds 2
    Start-Servers
}
else {
    # 기본 실행
    Start-Servers
}
