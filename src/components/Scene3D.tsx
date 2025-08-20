import React, { useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, FirstPersonControls, Environment, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { createLayerMesh, createTextureFromImage } from '@/utils/threeUtils';
import { Scene3D as Scene3DType } from '@/types';
import ParticleSystem from './ParticleSystem';

interface SceneContentProps {
  scene: Scene3DType;
  controlMode: 'orbit' | 'first-person' | 'auto';
}

const SceneContent: React.FC<SceneContentProps> = ({ scene, controlMode }) => {
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

  // 자동 패닝 모드에서만 카메라 자동 움직임
  useFrame((state) => {
    if (!isLoading && controlMode === 'auto') {
      const time = state.clock.getElapsedTime();
      
      // 부드러운 원형 궤도 + 수직 움직임
      const radius = 4 + Math.sin(time * 0.3) * 1;
      camera.position.x = Math.sin(time * 0.4) * radius;
      camera.position.y = Math.sin(time * 0.2) * 1.5;
      camera.position.z = Math.cos(time * 0.4) * radius + 6;
      
      // 부드러운 시선 추적 (약간의 오프셋)
      const lookAtX = Math.sin(time * 0.1) * 0.5;
      const lookAtY = Math.cos(time * 0.15) * 0.3;
      camera.lookAt(lookAtX, lookAtY, 0);
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
      
      {/* 향상된 조명 시스템 */}
      <ambientLight intensity={0.4} color={0x404040} />
      
      {/* 메인 방향광 */}
      <directionalLight 
        position={[12, 8, 6]} 
        intensity={1.2} 
        color={0xffffff}
        castShadow 
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />
      
      {/* 보조 조명들 */}
      <pointLight position={[-8, 6, 8]} intensity={0.6} color={0xffeedd} />
      <pointLight position={[5, -4, 10]} intensity={0.4} color={0xddddff} />
      <spotLight 
        position={[0, 10, 0]} 
        angle={Math.PI / 6}
        penumbra={0.3}
        intensity={0.8}
        color={0xffffff}
        castShadow
      />
      
      {/* 향상된 환경 효과 */}
      <Environment preset="city" background={false} />
      
      {/* 대기 효과 */}
      <fog attach="fog" args={['#202040', 10, 50]} />
      
      {/* 파티클 시스템 (먼지 효과) */}
      <ParticleSystem />
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
        <SceneContent scene={currentScene} controlMode={controlMode} />
        
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
        
        {/* 성능 모니터링 */}
        <Stats />
      </Canvas>

      {/* 컨트롤 패널 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 left-4 glass p-4 rounded-lg"
      >
        <h3 className="text-sm font-semibold mb-2">카메라 모드</h3>
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => setControlMode('auto')}
            className={`w-full px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
              controlMode === 'auto' 
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25' 
                : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30'
            }`}
          >
            자동 패닝
          </button>
          <button
            onClick={() => setControlMode('orbit')}
            className={`w-full px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
              controlMode === 'orbit' 
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25' 
                : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30'
            }`}
          >
            마우스 조작
          </button>
          <button
            onClick={() => setControlMode('first-person')}
            className={`w-full px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
              controlMode === 'first-person' 
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25' 
                : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30'
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
