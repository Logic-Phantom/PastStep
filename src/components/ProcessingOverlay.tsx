import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';

const ProcessingOverlay: React.FC = () => {
  const { processing } = useAppStore();

  if (processing.status === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass p-8 rounded-2xl max-w-md w-full mx-4 text-center"
      >
        {/* 로딩 애니메이션 */}
        <div className="mb-6">
          {processing.status === 'error' ? (
            <div className="text-6xl mb-4">❌</div>
          ) : processing.status === 'completed' ? (
            <div className="text-6xl mb-4">✅</div>
          ) : (
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-2xl animate-pulse">🤖</div>
            </div>
          )}
        </div>

        {/* 상태 메시지 */}
        <h3 className="text-xl font-semibold mb-4">
          {processing.status === 'uploading' && '업로드 중...'}
          {processing.status === 'processing' && 'AI 처리 중...'}
          {processing.status === 'completed' && '완료!'}
          {processing.status === 'error' && '오류 발생'}
        </h3>

        <p className="text-gray-300 mb-6">
          {processing.message}
        </p>

        {/* 진행률 바 */}
        {processing.status !== 'completed' && processing.status !== 'error' && (
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <motion.div
              className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${processing.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        {/* 진행률 퍼센트 */}
        {processing.status !== 'completed' && processing.status !== 'error' && (
          <p className="text-sm text-gray-400">
            {processing.progress}%
          </p>
        )}

        {/* 오류 메시지 */}
        {processing.status === 'error' && processing.error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">
              {processing.error}
            </p>
          </div>
        )}

        {/* 완료 메시지 */}
        {processing.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <p className="text-green-300 text-sm">
              3D 씬이 성공적으로 생성되었습니다!
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ProcessingOverlay;
