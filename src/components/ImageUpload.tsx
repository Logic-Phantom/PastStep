import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { mockUploadImage, mockProcessDepth } from '@/utils/api';
import { createLayerMasks } from '@/utils/threeUtils';
import { Scene3D } from '@/types';

const ImageUpload: React.FC = () => {
  const { setProcessing, setCurrentScene, addScene } = useAppStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    try {
      // 업로드 시작
      setProcessing({
        status: 'uploading',
        progress: 0,
        message: '이미지를 업로드하고 있습니다...'
      });

      // Mock API 호출 (실제 API로 교체 가능)
      const uploadResult = await mockUploadImage(file);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || '업로드 실패');
      }

      // Depth 처리 시작
      setProcessing({
        status: 'processing',
        progress: 30,
        message: 'AI가 이미지의 깊이를 분석하고 있습니다...'
      });

      const depthMap = await mockProcessDepth();

      setProcessing({
        status: 'processing',
        progress: 60,
        message: '3D 레이어를 생성하고 있습니다...'
      });

      // 레이어 생성
      const layers = createLayerMasks(depthMap);

      setProcessing({
        status: 'processing',
        progress: 90,
        message: '3D 씬을 구성하고 있습니다...'
      });

      // 3D 씬 생성
      const scene: Scene3D = {
        id: uploadResult.sceneId!,
        originalImage: URL.createObjectURL(file),
        depthMap,
        layers,
        camera: {
          position: [0, 0, 5],
          rotation: [0, 0, 0],
          fov: 75
        },
        createdAt: new Date()
      };

      // 완료
      setProcessing({
        status: 'completed',
        progress: 100,
        message: '3D 변환이 완료되었습니다!'
      });

      // 씬 저장 및 현재 씬으로 설정
      addScene(scene);
      setCurrentScene(scene);

    } catch (error) {
      console.error('Processing error:', error);
      setProcessing({
        status: 'error',
        progress: 0,
        message: '처리 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [setProcessing, setCurrentScene, addScene]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          PastStep 3D
        </h1>
        <p className="text-lg text-gray-300 mb-2">
          Time-Travel Photo → Walkable 3D
        </p>
        <p className="text-sm text-gray-400">
          사진을 업로드하면 AI가 3D 공간으로 변환해드립니다
        </p>
      </div>

      <motion.div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-purple-400 bg-purple-400/10' 
            : 'border-gray-600 hover:border-purple-400 hover:bg-gray-800/50'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="text-6xl mb-4">
            📸
          </div>
          
          {isDragActive ? (
            <p className="text-purple-400 font-medium">
              여기에 이미지를 놓으세요
            </p>
          ) : (
            <>
              <p className="text-xl font-medium">
                이미지를 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-sm text-gray-400">
                JPG, PNG, WebP 형식 지원 (최대 10MB)
              </p>
            </>
          )}
        </div>
      </motion.div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          권장: 인물이나 거리 사진이 가장 좋은 결과를 보여줍니다
        </p>
      </div>
    </motion.div>
  );
};

export default ImageUpload;
