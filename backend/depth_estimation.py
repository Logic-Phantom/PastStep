import torch
import torch.nn.functional as F
from transformers import DPTImageProcessor, DPTForDepthEstimation
from PIL import Image
import numpy as np
import cv2
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class DepthEstimator:
    def __init__(self):
        self.model = None
        self.processor = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")

    async def load_model(self):
        """DPT 모델 로드"""
        try:
            logger.info("Loading DPT depth estimation model...")
            
            # DPT 모델 로드 (Intel의 Dense Prediction Transformer)
            model_name = "Intel/dpt-large"
            self.processor = DPTImageProcessor.from_pretrained(model_name)
            self.model = DPTForDepthEstimation.from_pretrained(model_name)
            
            # GPU 사용 가능시 GPU로 이동
            self.model.to(self.device)
            self.model.eval()
            
            logger.info("DPT model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load DPT model: {e}")
            # 폴백: MiDaS 모델 사용
            await self._load_midas_fallback()

    async def _load_midas_fallback(self):
        """MiDaS 모델 폴백 로드"""
        try:
            logger.info("Loading MiDaS fallback model...")
            
            # MiDaS 모델 로드
            model_name = "DPT_Large"
            self.model = torch.hub.load("intel-isl/MiDaS", model_name)
            self.model.to(self.device)
            self.model.eval()
            
            # MiDaS 전처리
            self.midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
            self.transform = self.midas_transforms.dpt_transform
            
            logger.info("MiDaS model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load MiDaS model: {e}")
            raise

    async def estimate_depth(self, image_path: str) -> Dict[str, Any]:
        """이미지에서 깊이 추정"""
        try:
            # 이미지 로드
            image = Image.open(image_path)
            
            if self.processor is not None:
                # DPT 모델 사용
                return await self._estimate_depth_dpt(image)
            else:
                # MiDaS 모델 사용
                return await self._estimate_depth_midas(image)
                
        except Exception as e:
            logger.error(f"Depth estimation error: {e}")
            raise

    async def _estimate_depth_dpt(self, image: Image.Image) -> Dict[str, Any]:
        """DPT 모델로 깊이 추정"""
        # 이미지 전처리
        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # 추론
        with torch.no_grad():
            outputs = self.model(**inputs)
            predicted_depth = outputs.predicted_depth

        # 후처리
        prediction = torch.nn.functional.interpolate(
            predicted_depth.unsqueeze(1),
            size=image.size[::-1],
            mode="bicubic",
            align_corners=False,
        ).squeeze()
        
        depth_map = prediction.cpu().numpy()
        
        # 정규화
        depth_map = (depth_map - depth_map.min()) / (depth_map.max() - depth_map.min())
        
        return self._format_depth_map(depth_map)

    async def _estimate_depth_midas(self, image: Image.Image) -> Dict[str, Any]:
        """MiDaS 모델로 깊이 추정"""
        # 이미지 전처리
        img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        img_input = self.transform({"image": img})["image"]
        img_input = img_input.unsqueeze(0).to(self.device)

        # 추론
        with torch.no_grad():
            prediction = self.model(img_input)
            prediction = torch.nn.functional.interpolate(
                prediction.unsqueeze(1),
                size=img.shape[:2],
                mode="bicubic",
                align_corners=False,
            ).squeeze()

        depth_map = prediction.cpu().numpy()
        
        # 정규화
        depth_map = (depth_map - depth_map.min()) / (depth_map.max() - depth_map.min())
        
        return self._format_depth_map(depth_map)

    def _format_depth_map(self, depth_map: np.ndarray) -> Dict[str, Any]:
        """깊이 맵을 API 응답 형식으로 변환"""
        height, width = depth_map.shape
        
        return {
            "data": depth_map.tolist(),
            "width": width,
            "height": height,
            "minDepth": float(depth_map.min()),
            "maxDepth": float(depth_map.max())
        }

    def create_mock_depth_map(self, width: int = 512, height: int = 512) -> Dict[str, Any]:
        """개발용 Mock 깊이 맵 생성"""
        # 간단한 그라데이션 깊이 맵 생성
        x = np.linspace(0, 1, width)
        y = np.linspace(0, 1, height)
        X, Y = np.meshgrid(x, y)
        
        # 중앙에서 멀어질수록 깊이가 깊어지는 패턴
        depth_map = np.sqrt((X - 0.5)**2 + (Y - 0.5)**2)
        depth_map = (depth_map - depth_map.min()) / (depth_map.max() - depth_map.min())
        
        # 노이즈 추가
        noise = np.random.normal(0, 0.1, depth_map.shape)
        depth_map = np.clip(depth_map + noise, 0, 1)
        
        return self._format_depth_map(depth_map)
