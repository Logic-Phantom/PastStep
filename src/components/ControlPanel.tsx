import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 glass p-4 rounded-lg"
    >
      <div className="flex items-center space-x-4">
        {/* 새 사진 업로드 */}
        <button
          onClick={handleNewPhoto}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <span>📸</span>
          <span>새 사진</span>
        </button>

        {/* 다운로드 */}
        <button
          onClick={handleDownload}
          className="btn btn-secondary flex items-center space-x-2"
          disabled={!currentScene}
        >
          <span>💾</span>
          <span>저장</span>
        </button>

        {/* 공유 */}
        <button
          onClick={handleShare}
          className="btn btn-secondary flex items-center space-x-2"
          disabled={!currentScene}
        >
          <span>📤</span>
          <span>공유</span>
        </button>

        {/* 설정 */}
        <button
          onClick={() => toggleUI('showInfo')}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <span>⚙️</span>
          <span>설정</span>
        </button>
      </div>

      {/* 키보드 단축키 안내 */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          <span className="bg-gray-700 px-2 py-1 rounded mr-2">WASD</span>
          이동
          <span className="bg-gray-700 px-2 py-1 rounded mx-2">마우스</span>
          시점 변경
          <span className="bg-gray-700 px-2 py-1 rounded ml-2">스페이스</span>
          자동 패닝
        </p>
      </div>
    </motion.div>
  );
};

export default ControlPanel;
