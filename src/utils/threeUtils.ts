import * as THREE from 'three';
import { DepthMap, Layer } from '@/types';

// WebGPU 지원 확인
export const isWebGPUSupported = (): boolean => {
  return 'gpu' in navigator;
};

// Three.js 렌더러 생성 (WebGPU 우선, WebGL 폴백)
export const createRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer | THREE.WebGPURenderer => {
  if (isWebGPUSupported()) {
    // WebGPU 렌더러 (실험적)
    const webgpuRenderer = new THREE.WebGPURenderer({ canvas });
    webgpuRenderer.setSize(canvas.width, canvas.height);
    webgpuRenderer.setPixelRatio(window.devicePixelRatio);
    return webgpuRenderer;
  } else {
    // WebGL 렌더러 (폴백)
    const webglRenderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,
      alpha: true 
    });
    webglRenderer.setSize(canvas.width, canvas.height);
    webglRenderer.setPixelRatio(window.devicePixelRatio);
    webglRenderer.shadowMap.enabled = true;
    webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return webglRenderer;
  }
};

// Depth map을 기반으로 레이어 마스크 생성
export const createLayerMasks = (depthMap: DepthMap): Layer[] => {
  const { data, minDepth, maxDepth } = depthMap;
  const height = data.length;
  const width = data[0].length;
  
  const depthRange = maxDepth - minDepth;
  const foregroundThreshold = minDepth + depthRange * 0.3;
  const backgroundThreshold = minDepth + depthRange * 0.7;

  const foregroundMask = Array(height).fill(null).map(() => Array(width).fill(false));
  const midgroundMask = Array(height).fill(null).map(() => Array(width).fill(false));
  const backgroundMask = Array(height).fill(null).map(() => Array(width).fill(false));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const depth = data[y][x];
      
      if (depth <= foregroundThreshold) {
        foregroundMask[y][x] = true;
      } else if (depth <= backgroundThreshold) {
        midgroundMask[y][x] = true;
      } else {
        backgroundMask[y][x] = true;
      }
    }
  }

  return [
    {
      id: 'foreground',
      name: 'foreground',
      mask: foregroundMask,
      depthRange: [minDepth, foregroundThreshold]
    },
    {
      id: 'midground',
      name: 'midground',
      mask: midgroundMask,
      depthRange: [foregroundThreshold, backgroundThreshold]
    },
    {
      id: 'background',
      name: 'background',
      mask: backgroundMask,
      depthRange: [backgroundThreshold, maxDepth]
    }
  ];
};

// 이미지 텍스처 생성
export const createTextureFromImage = (imageUrl: string): Promise<THREE.Texture> => {
  return new Promise((resolve, reject) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imageUrl,
      (texture) => {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
};

// 레이어별 메시 생성
export const createLayerMesh = (
  layer: Layer,
  texture: THREE.Texture,
  depthMap: DepthMap,
  layerIndex: number
): THREE.Mesh => {
  const geometry = new THREE.PlaneGeometry(10, 10, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    displacementMap: createDisplacementMap(layer, depthMap),
    displacementScale: 2.0,
    displacementBias: -1.0
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -layerIndex * 2; // 레이어별 깊이 차이
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
};

// Displacement map 생성
const createDisplacementMap = (layer: Layer, depthMap: DepthMap): THREE.DataTexture => {
  const { data, width, height } = depthMap;
  const displacementData = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (layer.mask[y][x]) {
        displacementData[index] = data[y][x];
      } else {
        displacementData[index] = 0;
      }
    }
  }

  const texture = new THREE.DataTexture(
    displacementData,
    width,
    height,
    THREE.RFloatFormat
  );
  texture.needsUpdate = true;
  return texture;
};

// 조명 설정
export const setupLighting = (scene: THREE.Scene): void => {
  // 환경광
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  // 방향광
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // 포인트 라이트 (보조 조명)
  const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
  pointLight.position.set(-10, 10, 10);
  scene.add(pointLight);
};

// 카메라 설정
export const setupCamera = (): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 5);
  return camera;
};

// 애니메이션 루프
export const createAnimationLoop = (
  renderer: THREE.WebGLRenderer | THREE.WebGPURenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  return () => {
    renderer.render(scene, camera);
  };
};

// 윈도우 리사이즈 핸들러
export const handleResize = (
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer | THREE.WebGPURenderer
) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};
