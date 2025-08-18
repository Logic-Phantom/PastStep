import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import ImageUpload from '@/components/ImageUpload';
import Scene3D from '@/components/Scene3D';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ControlPanel from '@/components/ControlPanel';

const App: React.FC = () => {
  const { currentScene, ui, processing } = useAppStore();

  // PWA 설치 프롬프트
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // PWA 설치 프롬프트 저장 (필요시 사용)
      console.log('PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          // ESC 키로 업로드 화면으로 돌아가기
          if (currentScene) {
            useAppStore.getState().reset();
          }
          break;
        case ' ':
          // 스페이스바로 자동 패닝 토글
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScene]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
      
      {/* 애니메이션 배경 요소들 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 left-1/2 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"
        />
      </div>
      
      {/* 메인 컨텐츠 */}
      <div className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {currentScene ? (
            // 3D 씬 뷰
            <motion.div
              key="scene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              <Scene3D />
            </motion.div>
          ) : (
            // 업로드 화면
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full flex items-center justify-center"
            >
              <ImageUpload />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 처리 오버레이 */}
      <AnimatePresence>
        {processing.status !== 'idle' && <ProcessingOverlay />}
      </AnimatePresence>

      {/* 컨트롤 패널 */}
      <AnimatePresence>
        {currentScene && ui.showControls && <ControlPanel />}
      </AnimatePresence>

      {/* 토스트 알림 */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* PWA 설치 버튼 */}
      <AnimatePresence>
        {!currentScene && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="fixed top-6 right-6 z-20"
          >
            <button
              onClick={() => {
                // PWA 설치 로직
                console.log('Install PWA');
              }}
              className="group relative inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm font-medium text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>앱 설치</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 로딩 인디케이터 */}
      <AnimatePresence>
        {processing.status === 'processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
              />
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-sm text-gray-300 flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI가 이미지를 분석하고 있습니다...</span>
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 배경 노이즈 효과 */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
      </div>
    </div>
  );
};

export default App;
