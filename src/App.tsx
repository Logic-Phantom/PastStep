import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
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
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900" />
      
      {/* 메인 컨텐츠 */}
      <div className="relative z-10 w-full h-full">
        {currentScene ? (
          // 3D 씬 뷰
          <Scene3D />
        ) : (
          // 업로드 화면
          <div className="w-full h-full flex items-center justify-center">
            <ImageUpload />
          </div>
        )}
      </div>

      {/* 처리 오버레이 */}
      {processing.status !== 'idle' && <ProcessingOverlay />}

      {/* 컨트롤 패널 */}
      {currentScene && ui.showControls && <ControlPanel />}

      {/* 토스트 알림 */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      />

      {/* PWA 설치 버튼 (선택적) */}
      {!currentScene && (
        <div className="fixed top-4 right-4 z-20">
          <button
            onClick={() => {
              // PWA 설치 로직
              console.log('Install PWA');
            }}
            className="glass px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors"
          >
            📱 앱 설치
          </button>
        </div>
      )}

      {/* 로딩 인디케이터 */}
      {processing.status === 'processing' && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-300">AI가 이미지를 분석하고 있습니다...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
