import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleSystem: React.FC = () => {
  const meshRef = useRef<THREE.Points>(null);
  
  // 파티클 생성
  const [positions, colors] = useMemo(() => {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // 랜덤 위치 (넓은 범위)
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = (Math.random() - 0.5) * 30;
      positions[i3 + 2] = (Math.random() - 0.5) * 40;
      
      // 먼지 색상 (회색톤)
      const brightness = 0.3 + Math.random() * 0.4;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness;
    }
    
    return [positions, colors];
  }, []);
  
  // 파티클 애니메이션
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // 부드러운 떠다니는 움직임
        positions[i] += Math.sin(time * 0.5 + i) * 0.001;
        positions[i + 1] += Math.cos(time * 0.3 + i) * 0.001;
        positions[i + 2] += Math.sin(time * 0.2 + i) * 0.001;
      }
      
      meshRef.current.geometry.attributes.position.needsUpdate = true;
      
      // 전체 회전
      meshRef.current.rotation.y = time * 0.05;
    }
  });
  
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ParticleSystem;
