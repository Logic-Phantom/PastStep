import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, Sparkles, Camera, Zap } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { mockUploadImage, mockProcessDepth } from '@/utils/api';
import { createLayerMasks } from '@/utils/threeUtils';
import { Scene3D } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

const ImageUpload: React.FC = () => {
  const { setProcessing, setCurrentScene, addScene } = useAppStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    try {
      setProcessing({ status: 'uploading', progress: 0, message: '이미지를 업로드하고 있습니다...' });
      const uploadResult = await mockUploadImage(file);
      if (!uploadResult.success) throw new Error(uploadResult.error || '업로드 실패');

      setProcessing({ status: 'processing', progress: 30, message: 'AI가 이미지의 깊이를 분석하고 있습니다...' });
      const depthMap = await mockProcessDepth();

      setProcessing({ status: 'processing', progress: 60, message: '3D 레이어를 생성하고 있습니다...' });
      const layers = createLayerMasks(depthMap);

      setProcessing({ status: 'processing', progress: 90, message: '3D 씬을 구성하고 있습니다...' });
      const scene: Scene3D = {
        id: uploadResult.sceneId!,
        originalImage: URL.createObjectURL(file),
        depthMap,
        layers,
        camera: { position: [0, 0, 5], rotation: [0, 0, 0], fov: 75 },
        createdAt: new Date()
      };

      setProcessing({ status: 'completed', progress: 100, message: '3D 변환이 완료되었습니다!' });
      addScene(scene);
      setCurrentScene(scene);
    } catch (error) {
      console.error('Processing error:', error);
      setProcessing({ status: 'error', progress: 0, message: '처리 중 오류가 발생했습니다.', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [setProcessing, setCurrentScene, addScene]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false
  });

  const features = [
    { icon: <Sparkles className="w-6 h-6" />, title: 'AI 깊이 분석', description: '최첨단 AI가 이미지의 깊이를 정확히 분석합니다' },
    { icon: <Zap className="w-6 h-6" />, title: '실시간 변환', description: '몇 초 만에 3D 공간으로 변환됩니다' },
    { icon: <Camera className="w-6 h-6" />, title: '직관적 조작', description: '마우스와 키보드로 자유롭게 탐험하세요' }
  ];

  return (
    <div className="w-full h-full flex flex-col vignette-overlay relative">
      <div className="flex-shrink-0 p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-6 shadow-2xl">
            <Image className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-5xl font-bold mb-4 gradient-text">PastStep 3D</h1>
          <p className="text-xl text-gray-300 mb-2 font-medium">Time-Travel Photo → Walkable 3D</p>
          <p className="text-base text-gray-400 max-w-2xl mx-auto">사진을 업로드하면 AI가 3D 공간으로 변환해드립니다. 과거의 순간을 현실로 만나보세요.</p>
        </motion.div>
      </div>

      <div className="flex-shrink-0 px-8 mb-8">
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}>
              <Card className="h-full hover:scale-105 transition-transform duration-300">
                <CardHeader className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl mb-4 text-purple-400">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 pb-8">
        <div className="w-full max-w-3xl">
          <div className="relative rounded-2xl inset-card card-grid-bg overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/4 to-transparent mix-blend-overlay" />
            <div className="absolute -inset-0.5 rounded-2xl blur-2xl opacity-30 bg-gradient-to-r from-purple-600/20 to-pink-600/20 pointer-events-none" />

            <div {...getRootProps()} className={cn(
              'relative z-10 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 overflow-hidden min-h-[360px] flex items-center justify-center',
              isDragActive ? 'border-purple-400 bg-purple-400/10 scale-[1.01]' : 'border-white/10 hover:border-purple-400 hover:bg-black/20'
            )}>
              <input {...getInputProps()} />

              <AnimatePresence mode="wait">
                {isDragActive ? (
                  <motion.div key="drag-active" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="space-y-4">
                    <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">📸</motion.div>
                    <p className="text-purple-400 font-semibold text-lg">여기에 이미지를 놓으세요</p>
                  </motion.div>
                ) : (
                  <motion.div key="default" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl mb-4 animate-float">
                      <Upload className="w-10 h-10 text-purple-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-semibold">이미지를 드래그하거나 클릭하여 업로드</p>
                      <p className="text-sm text-gray-400">JPG, PNG, WebP 형식 지원 (최대 10MB)</p>
                    </div>
                    <Button variant="glass" size="lg" className="mt-4">
                      <Upload className="w-5 h-5 mr-2" />
                      이미지 선택
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-8 pb-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }} className="text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-gray-800/50 px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4" />
            <span>권장: 인물이나 거리 사진이 가장 좋은 결과를 보여줍니다</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ImageUpload;
