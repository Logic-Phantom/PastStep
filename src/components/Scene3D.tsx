import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, FirstPersonControls, Environment, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { createLayerMesh, setupLighting, createTextureFromImage } from '@/utils/threeUtils';
import { Scene3D as Scene3DType } from '@/types';

interface SceneContentProps {
  scene: Scene3DType;
}

const SceneContent: React.FC<SceneContentProps> = ({ scene }) => {
  const { camera } = useThree();
  const [meshes, setMeshes] = useState<THREE.Mesh[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScene = async () => {
      try {
        setIsLoading(true);
        
        // 텍스처 로드
        const texture = await createTextureFromImage(scene.originalImage);
        
        // 레이어별 메시 생성
        const sceneMeshes = scene.layers.map((layer, index) => 
          createLayerMesh(layer, texture, scene.depthMap, index)
        );
        
        setMeshes(sceneMeshes);
        setIsLoading(false);
      } catch (error) {
        console.error('Scene loading error:', error);
        setIsLoading(false);
      }
    };

    loadScene();
  }, [scene]);

  // 카메라 자동 패닝 애니메이션
  useFrame((state) => {
    if (!isLoading) {
      const time = state.clock.getElapsedTime();
      camera.position.x = Math.sin(time * 0.5) * 3;
      camera.position.z = Math.cos(time * 0.5) * 3 + 5;
      camera.lookAt(0, 0, 0);
    }
  });

  if (isLoading) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="purple" />
      </mesh>
    );
  }

  return (
    <>
      {/* 레이어 메시들 */}
      {meshes.map((mesh, index) => (
        <primitive key={index} object={mesh} />
      ))}
      
      {/* 조명 */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, 10]} intensity={0.5} />
      
      {/* 환경 */}
      <Environment preset="sunset" />
    </>
  );
};

const Scene3D: React.FC = () => {
  const { currentScene } = useAppStore();
  const [controlMode, setControlMode] = useState<'orbit' | 'first-person' | 'auto'>('auto');

  if (!currentScene) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-400">3D 씬을 로드할 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* 3D Canvas */}
      <Canvas
        camera={{ 
          position: [0, 0, 5], 
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <SceneContent scene={currentScene} />
        
        {/* 컨트롤 */}
        {controlMode === 'orbit' && (
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxDistance={20}
            minDistance={1}
          />
        )}
        
        {controlMode === 'first-person' && (
          <FirstPersonControls 
            lookSpeed={0.1}
            movementSpeed={0.5}
          />
        )}
        
        {/* 성능 모니터링 (개발 모드에서만) */}
        {import.meta.env.DEV && <Stats />}
      </Canvas>

      {/* 컨트롤 패널 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 left-4 glass p-4 rounded-lg"
      >
        <h3 className="text-sm font-semibold mb-2">카메라 모드</h3>
        <div className="space-y-2">
          <button
            onClick={() => setControlMode('auto')}
            className={`btn btn-secondary text-xs px-3 py-1 ${
              controlMode === 'auto' ? 'bg-purple-500' : ''
            }`}
          >
            자동 패닝
          </button>
          <button
            onClick={() => setControlMode('orbit')}
            className={`btn btn-secondary text-xs px-3 py-1 ${
              controlMode === 'orbit' ? 'bg-purple-500' : ''
            }`}
          >
            마우스 조작
          </button>
          <button
            onClick={() => setControlMode('first-person')}
            className={`btn btn-secondary text-xs px-3 py-1 ${
              controlMode === 'first-person' ? 'bg-purple-500' : ''
            }`}
          >
            1인칭 시점
          </button>
        </div>
      </motion.div>

      {/* 정보 패널 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 right-4 glass p-4 rounded-lg max-w-xs"
      >
        <h3 className="text-sm font-semibold mb-2">씬 정보</h3>
        <div className="text-xs space-y-1 text-gray-300">
          <p>레이어 수: {currentScene.layers.length}</p>
          <p>깊이 범위: {currentScene.depthMap.minDepth.toFixed(2)} - {currentScene.depthMap.maxDepth.toFixed(2)}</p>
          <p>해상도: {currentScene.depthMap.width} x {currentScene.depthMap.height}</p>
          <p>생성일: {currentScene.createdAt.toLocaleDateString()}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Scene3D;
