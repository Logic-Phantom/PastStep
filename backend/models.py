from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np

class UploadResponse(BaseModel):
    success: bool
    sceneId: Optional[str] = None
    message: str
    error: Optional[str] = None

class DepthMapResponse(BaseModel):
    success: bool
    depthMap: Dict[str, Any]
    message: str
    error: Optional[str] = None

class LayerResponse(BaseModel):
    success: bool
    layers: List[Dict[str, Any]]
    message: str
    error: Optional[str] = None

class SceneResponse(BaseModel):
    success: bool
    scene: Dict[str, Any]
    message: str
    error: Optional[str] = None

class DepthMap(BaseModel):
    data: List[List[float]]
    width: int
    height: int
    minDepth: float
    maxDepth: float

class Layer(BaseModel):
    id: str
    name: str  # 'foreground', 'midground', 'background'
    mask: List[List[bool]]
    depthRange: List[float]
    texture: Optional[str] = None

class Scene3D(BaseModel):
    id: str
    originalImage: str
    depthMap: DepthMap
    layers: List[Layer]
    camera: Dict[str, Any]
    createdAt: str
    status: str = "completed"

class ProcessingStatus(BaseModel):
    status: str  # 'idle', 'uploading', 'processing', 'completed', 'error'
    progress: int
    message: str
    error: Optional[str] = None

class APIError(BaseModel):
    detail: str
    status_code: int
