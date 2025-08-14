import axios from 'axios';
import { UploadResponse, DepthMap } from '@/types';

// API base URL - 개발/프로덕션 환경에 따라 변경
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // 로딩 상태 표시 등을 위한 인터셉터
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${progress}%`);
        }
      },
    });

    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error('Failed to upload image');
  }
};

export const processDepth = async (imageId: string): Promise<DepthMap> => {
  try {
    const response = await api.post('/process-depth', { imageId });
    return response.data.depthMap;
  } catch (error) {
    console.error('Depth processing failed:', error);
    throw new Error('Failed to process depth map');
  }
};

export const generateLayers = async (imageId: string, depthMap: DepthMap) => {
  try {
    const response = await api.post('/generate-layers', {
      imageId,
      depthMap,
    });
    return response.data.layers;
  } catch (error) {
    console.error('Layer generation failed:', error);
    throw new Error('Failed to generate layers');
  }
};

export const create3DScene = async (imageId: string, layers: any[]) => {
  try {
    const response = await api.post('/create-scene', {
      imageId,
      layers,
    });
    return response.data.scene;
  } catch (error) {
    console.error('3D scene creation failed:', error);
    throw new Error('Failed to create 3D scene');
  }
};

// Mock API for development (실제 API가 없을 때 사용)
export const mockUploadImage = async (file: File): Promise<UploadResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        sceneId: `scene_${Date.now()}`,
      });
    }, 2000);
  });
};

export const mockProcessDepth = async (): Promise<DepthMap> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock depth map data
      const width = 512;
      const height = 512;
      const data = Array(height).fill(null).map(() =>
        Array(width).fill(null).map(() => Math.random())
      );

      resolve({
        data,
        width,
        height,
        minDepth: 0,
        maxDepth: 1,
      });
    }, 3000);
  });
};

export default api;
