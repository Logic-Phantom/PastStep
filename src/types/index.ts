export interface DepthMap {
  data: number[][];
  width: number;
  height: number;
  minDepth: number;
  maxDepth: number;
}

export interface Layer {
  id: string;
  name: string;
  mask: boolean[][];
  depthRange: [number, number];
  mesh?: THREE.Mesh;
  texture?: THREE.Texture;
}

export interface Scene3D {
  id: string;
  originalImage: string;
  depthMap: DepthMap;
  layers: Layer[];
  camera: {
    position: [number, number, number];
    rotation: [number, number, number];
    fov: number;
  };
  createdAt: Date;
}

export interface ProcessingState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface AppState {
  currentScene: Scene3D | null;
  processing: ProcessingState;
  scenes: Scene3D[];
  ui: {
    showUpload: boolean;
    showControls: boolean;
    showInfo: boolean;
  };
}

export interface CameraControls {
  mode: 'orbit' | 'first-person' | 'auto-pan';
  autoPanSpeed: number;
  enableDamping: boolean;
  dampingFactor: number;
}

export interface UploadResponse {
  success: boolean;
  sceneId?: string;
  error?: string;
  depthMap?: DepthMap;
}
