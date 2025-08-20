import * as THREE from 'three';
import { DepthMap, Layer } from '@/types';

// WebGPU 지원 확인
export const isWebGPUSupported = (): boolean => {
  return 'gpu' in navigator;
};

// Three.js 렌더러 생성 (WebGL만 사용)
export const createRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
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
};

// Depth map을 기반으로 더 많은 레이어 마스크 생성 (8개 레이어)
export const createLayerMasks = (depthMap: DepthMap): Layer[] => {
  const { data, minDepth, maxDepth } = depthMap;
  const height = data.length;
  const width = data[0].length;
  
  const depthRange = maxDepth - minDepth;
  const numLayers = 8; // 더 많은 레이어로 현실감 증대
  const layers: Layer[] = [];

  // 각 레이어별 깊이 범위 계산
  for (let i = 0; i < numLayers; i++) {
    const startDepth = minDepth + (depthRange * i / numLayers);
    const endDepth = minDepth + (depthRange * (i + 1) / numLayers);
    
    const mask = Array(height).fill(null).map(() => Array(width).fill(false));
    
    // 부드러운 전환을 위한 페더링 적용
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const depth = data[y][x];
        
        // 현재 레이어 범위에 속하는지 확인
        if (depth >= startDepth && depth < endDepth) {
          mask[y][x] = true;
        }
        // 경계 부분에 부드러운 전환 적용
        else if (Math.abs(depth - startDepth) < depthRange * 0.05 || 
                 Math.abs(depth - endDepth) < depthRange * 0.05) {
          mask[y][x] = Math.random() > 0.5; // 확률적 페더링
        }
      }
    }
    
    layers.push({
      id: `layer_${i}`,
      name: `Layer ${i + 1}`,
      mask: mask,
      depthRange: [startDepth, endDepth]
    });
  }

  return layers;
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

// 레이어별 메시 생성 (향상된 현실감)
export const createLayerMesh = (
  layer: Layer,
  texture: THREE.Texture,
  depthMap: DepthMap,
  layerIndex: number
): THREE.Mesh => {
  // 더 높은 해상도의 지오메트리로 디테일 향상
  const geometry = new THREE.PlaneGeometry(12, 12, 128, 128);
  
  // 레이어별 투명도와 재질 속성 조정
  const opacity = Math.max(0.7, 1.0 - layerIndex * 0.1);
  const roughness = 0.1 + layerIndex * 0.1;
  
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide,
    displacementMap: createDisplacementMap(layer, depthMap),
    displacementScale: 1.5 + layerIndex * 0.3, // 레이어별 변위 강도 조정
    displacementBias: -0.5,
    roughness: roughness,
    metalness: 0.1,
    // 법선 맵으로 표면 디테일 추가
    normalMap: createNormalMap(layer, depthMap),
    normalScale: new THREE.Vector2(0.5, 0.5)
  });

  const mesh = new THREE.Mesh(geometry, material);
  
  // 더 자연스러운 깊이 배치 (비선형)
  const depthOffset = Math.pow(layerIndex / 7, 1.5) * 8;
  mesh.position.z = -depthOffset;
  
  // 레이어별 약간의 회전과 스케일 변화로 자연스러움 추가
  mesh.rotation.z = (Math.random() - 0.5) * 0.02;
  const scale = 1.0 + layerIndex * 0.05;
  mesh.scale.set(scale, scale, 1);
  
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
};

// Displacement map 생성 (향상된 버전)
const createDisplacementMap = (layer: Layer, depthMap: DepthMap): THREE.DataTexture => {
  const { data, width, height } = depthMap;
  const displacementData = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (layer.mask[y][x]) {
        // 가우시안 블러 효과로 부드러운 전환
        let avgDepth = 0;
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = Math.max(0, Math.min(height - 1, y + dy));
            const nx = Math.max(0, Math.min(width - 1, x + dx));
            if (layer.mask[ny][nx]) {
              avgDepth += data[ny][nx];
              count++;
            }
          }
        }
        
        displacementData[index] = count > 0 ? avgDepth / count : data[y][x];
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
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
};

// 법선 맵 생성 (새로운 함수)
const createNormalMap = (layer: Layer, depthMap: DepthMap): THREE.DataTexture => {
  const { data, width, height } = depthMap;
  const normalData = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      if (layer.mask[y][x]) {
        // 주변 픽셀과의 깊이 차이로 법선 벡터 계산
        const left = x > 0 ? data[y][x - 1] : data[y][x];
        const right = x < width - 1 ? data[y][x + 1] : data[y][x];
        const up = y > 0 ? data[y - 1][x] : data[y][x];
        const down = y < height - 1 ? data[y + 1][x] : data[y][x];
        
        const dx = (right - left) * 0.5;
        const dy = (down - up) * 0.5;
        
        // 법선 벡터 정규화
        const length = Math.sqrt(dx * dx + dy * dy + 1);
        
        normalData[index] = Math.floor(((dx / length) * 0.5 + 0.5) * 255);     // R
        normalData[index + 1] = Math.floor(((dy / length) * 0.5 + 0.5) * 255); // G
        normalData[index + 2] = Math.floor(((1 / length) * 0.5 + 0.5) * 255);  // B
        normalData[index + 3] = 255; // A
      } else {
        normalData[index] = 128;
        normalData[index + 1] = 128;
        normalData[index + 2] = 255;
        normalData[index + 3] = 0;
      }
    }
  }

  const texture = new THREE.DataTexture(
    normalData,
    width,
    height,
    THREE.RGBAFormat
  );
  texture.needsUpdate = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
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
  renderer: THREE.WebGLRenderer,
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
  renderer: THREE.WebGLRenderer
) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};
