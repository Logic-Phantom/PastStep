# PastStep 3D - Time-Travel Photo → Walkable 3D

AI를 활용하여 평범한 사진을 걸어다닐 수 있는 3D 공간으로 변환하는 혁신적인 웹 애플리케이션입니다.

## 🌟 주요 기능

- **AI 깊이 추정**: 단일 이미지에서 정확한 깊이 맵 생성
- **3D 레이어 분리**: 전경/중경/후경으로 자동 분리
- **실시간 3D 렌더링**: Three.js와 WebGPU를 활용한 고품질 렌더링
- **다양한 카메라 모드**: 자동 패닝, 마우스 조작, 1인칭 시점
- **PWA 지원**: 모바일 앱처럼 설치 가능
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험

## 🏗️ 전체 아키텍처

### 시스템 구조
```
┌─────────────────┐    HTTP/WebSocket    ┌─────────────────┐
│   Frontend      │ ◄──────────────────► │    Backend      │
│   (React +      │                      │   (FastAPI +    │
│    Three.js)    │                      │    PyTorch)     │
└─────────────────┘                      └─────────────────┘
         │                                        │
         │                                        │
         ▼                                        ▼
┌─────────────────┐                      ┌─────────────────┐
│   WebGPU API    │                      │   AI Models     │
│   (3D 렌더링)    │                      │   (DPT, etc.)   │
└─────────────────┘                      └─────────────────┘
```

### 데이터 플로우
1. **이미지 업로드** → 프론트엔드에서 백엔드로 전송
2. **AI 처리** → 백엔드에서 깊이 추정 및 레이어 분리
3. **3D 생성** → 프론트엔드에서 Three.js로 3D 씬 구성
4. **실시간 렌더링** → WebGPU를 통한 고성능 렌더링

## 🚀 기술 스택

### 프론트엔드
- **React 18** + **TypeScript** - 모던 UI 프레임워크
- **Three.js** + **@react-three/fiber** - 3D 렌더링
- **WebGPU API** - 고성능 그래픽 처리
- **Vite** - 빠른 빌드 도구
- **Zustand** - 상태 관리
- **Framer Motion** - 부드러운 애니메이션
- **React Dropzone** - 드래그 앤 드롭 파일 업로드
- **React Hot Toast** - 사용자 알림

### 백엔드
- **FastAPI** - 고성능 Python 웹 프레임워크
- **PyTorch** + **Transformers** - AI 모델
- **DPT (Dense Prediction Transformer)** - 깊이 추정
- **OpenCV** - 이미지 처리
- **NumPy** - 수치 계산
- **Pillow** - 이미지 조작
- **Uvicorn** - ASGI 서버

### 배포
- **Vercel** - 프론트엔드 호스팅
- **Hugging Face Spaces** - 백엔드 호스팅
- **PWA** - 모바일 앱 경험

## 📦 설치 및 실행

### 🚀 빠른 시작 (권장)

Windows에서 제공되는 스크립트를 사용하여 프론트엔드와 백엔드 서버를 동시에 실행할 수 있습니다:

#### 배치 파일 사용 (CMD)
```bash
# 서버 시작
start-servers.bat

# 서버 중지
stop-servers.bat
```

#### PowerShell 스크립트 사용
```powershell
# 서버 시작
.\start-servers.ps1

# 서버 중지
.\start-servers.ps1 -Stop

# 서버 재시작
.\start-servers.ps1 -Restart
```

### 수동 실행

#### 1. 프론트엔드 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 미리보기
npm run preview
```

#### 2. 백엔드 개발

```bash
# Python 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 의존성 설치
cd backend
pip install -r requirements.txt

# 서버 실행
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 🎯 사용법

### 기본 워크플로우
1. **이미지 업로드**: 드래그 앤 드롭 또는 클릭으로 사진 업로드
2. **AI 처리**: 자동으로 깊이 분석 및 3D 레이어 생성
3. **3D 탐험**: 다양한 카메라 모드로 3D 공간 탐험
4. **공유**: 완성된 3D 씬을 친구들과 공유

### 키보드 단축키
- `ESC`: 업로드 화면으로 돌아가기
- `Space`: 자동 패닝 토글
- `Mouse`: 카메라 조작
- `WASD`: 1인칭 시점 이동

## 🔧 개발 가이드

### 프로젝트 구조

```
PastStep/
├── src/                    # 프론트엔드 소스
│   ├── components/         # React 컴포넌트
│   │   ├── ControlPanel.tsx    # 3D 씬 컨트롤 패널
│   │   ├── ImageUpload.tsx     # 이미지 업로드 컴포넌트
│   │   ├── ProcessingOverlay.tsx # 처리 상태 오버레이
│   │   └── Scene3D.tsx         # 3D 씬 렌더링
│   ├── store/             # Zustand 상태 관리
│   │   └── appStore.ts    # 애플리케이션 상태
│   ├── utils/             # 유틸리티 함수
│   │   ├── api.ts         # API 통신
│   │   └── threeUtils.ts  # Three.js 유틸리티
│   └── types/             # TypeScript 타입 정의
│       └── index.ts       # 공통 타입 정의
├── backend/               # Python 백엔드
│   ├── main.py           # FastAPI 서버 메인
│   ├── depth_estimation.py # AI 깊이 추정 모듈
│   ├── image_processor.py # 이미지 처리 모듈
│   ├── models.py         # Pydantic 모델
│   └── requirements.txt  # Python 의존성
├── public/               # 정적 파일
├── start-servers.bat     # Windows 서버 시작 스크립트
├── start-servers.ps1     # PowerShell 서버 시작 스크립트
├── stop-servers.bat      # Windows 서버 중지 스크립트
└── package.json          # Node.js 의존성
```

### API 엔드포인트

#### 이미지 처리
- `POST /upload` - 이미지 업로드
- `POST /process-depth` - 깊이 추정 처리
- `POST /generate-layers` - 3D 레이어 생성
- `POST /create-scene` - 3D 씬 생성

#### 시스템
- `GET /` - 루트 엔드포인트
- `GET /health` - 헬스 체크
- `GET /docs` - API 문서 (Swagger UI)

### 상태 관리 (Zustand)

```typescript
interface AppState {
  // 현재 3D 씬
  currentScene: Scene3D | null;
  
  // UI 상태
  ui: {
    showControls: boolean;
    theme: 'light' | 'dark';
  };
  
  // 처리 상태
  processing: {
    status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    message: string;
  };
}
```

## 🎨 커스터마이징

### 스타일 수정
CSS 변수를 통해 테마 색상 변경 가능:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-color: #242424;
  --text-color: #ffffff;
  --accent-color: #ff6b6b;
}
```

### AI 모델 변경
`backend/depth_estimation.py`에서 다른 깊이 추정 모델 사용 가능:

```python
# MiDaS 모델 사용
model_name = "DPT_Large"

# 또는 다른 모델
model_name = "DPT_Hybrid"
```

### 3D 렌더링 설정
`src/components/Scene3D.tsx`에서 렌더링 품질 조정:

```typescript
// 렌더링 품질 설정
const renderQuality = {
  shadowMapSize: 2048,
  antialias: true,
  pixelRatio: window.devicePixelRatio
};
```

## 🚀 배포

### Vercel 배포 (프론트엔드)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### Hugging Face Spaces 배포 (백엔드)

1. Hugging Face에 로그인
2. 새 Space 생성 (FastAPI 템플릿 선택)
3. 백엔드 코드 업로드
4. 자동 배포 완료

### 환경 변수 설정

```bash
# .env.local (프론트엔드)
VITE_API_URL=https://your-api-domain.com
VITE_APP_NAME=PastStep 3D

# .env (백엔드)
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
MODEL_CACHE_DIR=./models
UPLOAD_MAX_SIZE=10485760
```

## 🔍 문제 해결

### 일반적인 문제

#### 서버 시작 실패
```bash
# 포트 충돌 확인
netstat -ano | findstr :5173
netstat -ano | findstr :8000

# 프로세스 강제 종료
taskkill /f /im node.exe
taskkill /f /im python.exe
```

#### AI 모델 로딩 실패
```bash
# 모델 캐시 정리
rm -rf ~/.cache/huggingface/
rm -rf backend/models/

# 재설치
pip install -r backend/requirements.txt
```

#### 3D 렌더링 문제
- WebGPU 지원 브라우저 사용 (Chrome 113+, Edge 113+)
- 그래픽 드라이버 업데이트
- 하드웨어 가속 활성화

### 로그 확인

#### 프론트엔드 로그
브라우저 개발자 도구 콘솔에서 확인

#### 백엔드 로그
```bash
# 실시간 로그 확인
tail -f backend/logs/app.log

# 로그 레벨 설정
export LOG_LEVEL=DEBUG
```

## 🤝 기여하기

### 개발 환경 설정

1. **저장소 클론**
```bash
git clone https://github.com/Logic-Phantom/PastStep.git
cd PastStep
```

2. **의존성 설치**
```bash
# 프론트엔드
npm install

# 백엔드
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **개발 서버 실행**
```bash
# 방법 1: 스크립트 사용
start-servers.bat

# 방법 2: 수동 실행
# 터미널 1 (프론트엔드)
npm run dev

# 터미널 2 (백엔드)
cd backend
python -m uvicorn main:app --reload
```

### 기여 가이드라인

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 코드 스타일

- **TypeScript**: ESLint + Prettier 사용
- **Python**: Black + isort 사용
- **커밋 메시지**: Conventional Commits 형식

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🙏 감사의 말

- **Intel** - DPT 모델 제공
- **Three.js** - 3D 렌더링 라이브러리
- **Vercel** - 호스팅 플랫폼
- **Hugging Face** - AI 모델 허브
- **FastAPI** - 고성능 웹 프레임워크

## 📞 연락처

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

- **GitHub Issues**: [https://github.com/Logic-Phantom/PastStep/issues](https://github.com/Logic-Phantom/PastStep/issues)
- **Discussions**: [https://github.com/Logic-Phantom/PastStep/discussions](https://github.com/Logic-Phantom/PastStep/discussions)

## 📈 로드맵

### v1.1 (예정)
- [ ] 실시간 협업 기능
- [ ] VR/AR 지원
- [ ] 고급 카메라 효과
- [ ] 배치 처리 지원

### v1.2 (예정)
- [ ] 모바일 앱 출시
- [ ] 클라우드 저장소 연동
- [ ] AI 모델 최적화
- [ ] 다국어 지원

---

**PastStep 3D** - 사진을 3D로, 추억을 경험으로 ✨

*Made with ❤️ by the PastStep Team*
