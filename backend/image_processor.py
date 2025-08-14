import cv2
import numpy as np
from PIL import Image
import logging
from typing import Dict, Any, List
import uuid

logger = logging.getLogger(__name__)

class ImageProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def generate_layers(self, image_path: str, depth_map: Dict[str, Any]) -> List[Dict[str, Any]]:
        """깊이 맵을 기반으로 레이어 생성"""
        try:
            # 이미지 로드
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError("이미지를 로드할 수 없습니다")
            
            # RGB로 변환
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # 깊이 맵 데이터 추출
            depth_data = np.array(depth_map["data"])
            min_depth = depth_map["minDepth"]
            max_depth = depth_map["maxDepth"]
            
            # 레이어 생성
            layers = self._create_layers_from_depth(image_rgb, depth_data, min_depth, max_depth)
            
            return layers
            
        except Exception as e:
            self.logger.error(f"Layer generation error: {e}")
            raise

    def _create_layers_from_depth(self, image: np.ndarray, depth_map: np.ndarray, 
                                 min_depth: float, max_depth: float) -> List[Dict[str, Any]]:
        """깊이 맵을 기반으로 레이어 생성"""
        height, width = depth_map.shape
        
        # 깊이 범위 계산
        depth_range = max_depth - min_depth
        foreground_threshold = min_depth + depth_range * 0.3
        background_threshold = min_depth + depth_range * 0.7
        
        # 레이어별 마스크 생성
        foreground_mask = depth_map <= foreground_threshold
        midground_mask = (depth_map > foreground_threshold) & (depth_map <= background_threshold)
        background_mask = depth_map > background_threshold
        
        # 레이어 생성
        layers = []
        
        # 전경 레이어
        if np.any(foreground_mask):
            layers.append(self._create_layer(
                "foreground", foreground_mask, 
                [min_depth, foreground_threshold], image
            ))
        
        # 중경 레이어
        if np.any(midground_mask):
            layers.append(self._create_layer(
                "midground", midground_mask,
                [foreground_threshold, background_threshold], image
            ))
        
        # 후경 레이어
        if np.any(background_mask):
            layers.append(self._create_layer(
                "background", background_mask,
                [background_threshold, max_depth], image
            ))
        
        return layers

    def _create_layer(self, name: str, mask: np.ndarray, 
                     depth_range: List[float], image: np.ndarray) -> Dict[str, Any]:
        """개별 레이어 생성"""
        # 마스크를 boolean 리스트로 변환
        mask_list = mask.tolist()
        
        # 레이어별 이미지 추출 (마스크 적용)
        layer_image = image.copy()
        layer_image[~mask] = [0, 0, 0]  # 마스크 외 영역을 검은색으로
        
        # 텍스처 파일 저장 (선택적)
        texture_path = self._save_layer_texture(name, layer_image)
        
        return {
            "id": f"{name}_{uuid.uuid4().hex[:8]}",
            "name": name,
            "mask": mask_list,
            "depthRange": depth_range,
            "texture": texture_path,
            "bounds": self._calculate_bounds(mask)
        }

    def _save_layer_texture(self, layer_name: str, layer_image: np.ndarray) -> str:
        """레이어 텍스처를 파일로 저장"""
        try:
            # 텍스처 디렉토리 생성
            import os
            texture_dir = "textures"
            os.makedirs(texture_dir, exist_ok=True)
            
            # 파일명 생성
            filename = f"{layer_name}_{uuid.uuid4().hex[:8]}.png"
            filepath = os.path.join(texture_dir, filename)
            
            # 이미지 저장
            cv2.imwrite(filepath, cv2.cvtColor(layer_image, cv2.COLOR_RGB2BGR))
            
            return filepath
            
        except Exception as e:
            self.logger.warning(f"Failed to save texture for {layer_name}: {e}")
            return None

    def _calculate_bounds(self, mask: np.ndarray) -> Dict[str, int]:
        """마스크의 경계 계산"""
        # 마스크에서 True인 픽셀들의 좌표 찾기
        y_coords, x_coords = np.where(mask)
        
        if len(y_coords) == 0:
            return {"x": 0, "y": 0, "width": 0, "height": 0}
        
        return {
            "x": int(x_coords.min()),
            "y": int(y_coords.min()),
            "width": int(x_coords.max() - x_coords.min() + 1),
            "height": int(y_coords.max() - y_coords.min() + 1)
        }

    def create_mock_layers(self, width: int = 512, height: int = 512) -> List[Dict[str, Any]]:
        """개발용 Mock 레이어 생성"""
        layers = []
        
        # 전경 레이어 (중앙 원형)
        center_x, center_y = width // 2, height // 2
        radius = min(width, height) // 4
        
        y, x = np.ogrid[:height, :width]
        foreground_mask = (x - center_x)**2 + (y - center_y)**2 <= radius**2
        
        layers.append({
            "id": "foreground_mock",
            "name": "foreground",
            "mask": foreground_mask.tolist(),
            "depthRange": [0.0, 0.3],
            "texture": None,
            "bounds": self._calculate_bounds(foreground_mask)
        })
        
        # 중경 레이어 (고리형)
        outer_radius = min(width, height) // 2
        midground_mask = ((x - center_x)**2 + (y - center_y)**2 > radius**2) & \
                        ((x - center_x)**2 + (y - center_y)**2 <= outer_radius**2)
        
        layers.append({
            "id": "midground_mock",
            "name": "midground",
            "mask": midground_mask.tolist(),
            "depthRange": [0.3, 0.7],
            "texture": None,
            "bounds": self._calculate_bounds(midground_mask)
        })
        
        # 후경 레이어 (나머지)
        background_mask = (x - center_x)**2 + (y - center_y)**2 > outer_radius**2
        
        layers.append({
            "id": "background_mock",
            "name": "background",
            "mask": background_mask.tolist(),
            "depthRange": [0.7, 1.0],
            "texture": None,
            "bounds": self._calculate_bounds(background_mask)
        })
        
        return layers
