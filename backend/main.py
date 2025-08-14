from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import uuid
from typing import Optional
import logging

from depth_estimation import DepthEstimator
from image_processor import ImageProcessor
from models import UploadResponse, DepthMapResponse, LayerResponse

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PastStep 3D API",
    description="Time-Travel Photo → Walkable 3D API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 객체들
depth_estimator = DepthEstimator()
image_processor = ImageProcessor()

# 업로드된 이미지 저장 디렉토리
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 초기화"""
    logger.info("Starting PastStep 3D API server...")
    logger.info("Loading AI models...")
    
    # AI 모델 로드
    try:
        await depth_estimator.load_model()
        logger.info("Depth estimation model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load depth estimation model: {e}")
        raise

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "PastStep 3D API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}

@app.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """이미지 업로드 엔드포인트"""
    try:
        # 파일 검증
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다")
        
        if file.size > 10 * 1024 * 1024:  # 10MB 제한
            raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다")
        
        # 고유 ID 생성
        image_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{image_id}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # 파일 저장
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Image uploaded: {filename}")
        
        return UploadResponse(
            success=True,
            sceneId=image_id,
            message="이미지가 성공적으로 업로드되었습니다"
        )
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-depth", response_model=DepthMapResponse)
async def process_depth(image_id: str):
    """깊이 추정 엔드포인트"""
    try:
        # 이미지 파일 찾기
        image_path = None
        for ext in ['.jpg', '.jpeg', '.png', '.webp']:
            temp_path = os.path.join(UPLOAD_DIR, f"{image_id}{ext}")
            if os.path.exists(temp_path):
                image_path = temp_path
                break
        
        if not image_path:
            raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다")
        
        # 깊이 추정 실행
        logger.info(f"Processing depth for image: {image_id}")
        depth_map = await depth_estimator.estimate_depth(image_path)
        
        return DepthMapResponse(
            success=True,
            depthMap=depth_map,
            message="깊이 추정이 완료되었습니다"
        )
        
    except Exception as e:
        logger.error(f"Depth processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-layers", response_model=LayerResponse)
async def generate_layers(image_id: str, depth_map: dict):
    """레이어 생성 엔드포인트"""
    try:
        # 이미지 파일 찾기
        image_path = None
        for ext in ['.jpg', '.jpeg', '.png', '.webp']:
            temp_path = os.path.join(UPLOAD_DIR, f"{image_id}{ext}")
            if os.path.exists(temp_path):
                image_path = temp_path
                break
        
        if not image_path:
            raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다")
        
        # 레이어 생성
        logger.info(f"Generating layers for image: {image_id}")
        layers = await image_processor.generate_layers(image_path, depth_map)
        
        return LayerResponse(
            success=True,
            layers=layers,
            message="레이어 생성이 완료되었습니다"
        )
        
    except Exception as e:
        logger.error(f"Layer generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-scene")
async def create_scene(image_id: str, layers: list):
    """3D 씬 생성 엔드포인트"""
    try:
        logger.info(f"Creating 3D scene for image: {image_id}")
        
        # 3D 씬 데이터 구성
        scene_data = {
            "id": image_id,
            "layers": layers,
            "created_at": str(uuid.uuid4()),
            "status": "completed"
        }
        
        return {
            "success": True,
            "scene": scene_data,
            "message": "3D 씬이 성공적으로 생성되었습니다"
        }
        
    except Exception as e:
        logger.error(f"Scene creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/cleanup/{image_id}")
async def cleanup_image(image_id: str):
    """이미지 정리 엔드포인트"""
    try:
        # 이미지 파일 삭제
        for ext in ['.jpg', '.jpeg', '.png', '.webp']:
            file_path = os.path.join(UPLOAD_DIR, f"{image_id}{ext}")
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up image: {image_id}")
                break
        
        return {"success": True, "message": "이미지가 정리되었습니다"}
        
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
