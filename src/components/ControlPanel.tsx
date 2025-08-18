import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Download, Share2, Settings, Home, RotateCcw, Maximize2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

const ControlPanel: React.FC = () => {
  const { currentScene, toggleUI, reset } = useAppStore();

  const handleNewPhoto = () => {
    reset();
  };

  const handleDownload = () => {
    if (!currentScene) return;
    
    // 3D 씬을 이미지로 캡처하는 기능 (향후 구현)
    alert('다운로드 기능은 곧 추가될 예정입니다!');
  };

  const handleShare = () => {
    if (!currentScene) return;
    
    // 공유 기능 (향후 구현)
    if (navigator.share) {
      navigator.share({
        title: 'PastStep 3D - Time-Travel Photo',
        text: 'AI로 변환된 3D 사진을 확인해보세요!',
        url: window.location.href
      });
    } else {
      // 폴백: URL 복사
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다!');
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleResetView = () => {
    // 카메라 뷰 리셋 기능 (향후 구현)
    console.log('Reset camera view');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
    >
      <Card className="backdrop-blur-xl bg-black/20 border-white/10 shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {/* 새 사진 업로드 */}
            <Button
              onClick={handleNewPhoto}
              variant="glass"
              size="sm"
              className="flex items-center space-x-2 min-w-[120px]"
            >
              <Camera className="w-4 h-4" />
              <span>새 사진</span>
            </Button>

            {/* 카메라 리셋 */}
            <Button
              onClick={handleResetView}
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              title="카메라 뷰 리셋"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* 다운로드 */}
            <Button
              onClick={handleDownload}
              variant="glass"
              size="sm"
              className="flex items-center space-x-2 min-w-[100px]"
              disabled={!currentScene}
            >
              <Download className="w-4 h-4" />
              <span>저장</span>
            </Button>

            {/* 공유 */}
            <Button
              onClick={handleShare}
              variant="glass"
              size="sm"
              className="flex items-center space-x-2 min-w-[100px]"
              disabled={!currentScene}
            >
              <Share2 className="w-4 h-4" />
              <span>공유</span>
            </Button>

            {/* 전체화면 */}
            <Button
              onClick={handleFullscreen}
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              title="전체화면"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>

            {/* 설정 */}
            <Button
              onClick={() => toggleUI('showInfo')}
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              title="설정"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* 키보드 단축키 안내 */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-gray-800/50 rounded text-xs font-mono">WASD</kbd>
                <span>이동</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-gray-800/50 rounded text-xs font-mono">마우스</kbd>
                <span>시점 변경</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-gray-800/50 rounded text-xs font-mono">스페이스</kbd>
                <span>자동 패닝</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-gray-800/50 rounded text-xs font-mono">ESC</kbd>
                <span>돌아가기</span>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ControlPanel;
