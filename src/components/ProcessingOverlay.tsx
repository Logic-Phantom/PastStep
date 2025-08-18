import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Sparkles, Zap, Camera, Upload } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent } from '@/components/ui/Card';

const ProcessingOverlay: React.FC = () => {
  const { processing, setProcessing } = useAppStore();

  useEffect(() => {
    if (processing.status === 'completed') {
      const timer = setTimeout(() => {
        setProcessing({ status: 'idle', progress: 0, message: '' });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [processing.status, setProcessing]);

  if (processing.status === 'idle') return null;

  const getStatusIcon = () => {
    switch (processing.status) {
      case 'uploading':
        return <Upload className="w-8 h-8 text-blue-400" />;
      case 'processing':
        return <Sparkles className="w-8 h-8 text-purple-400" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-400" />;
      default:
        return <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (processing.status) {
      case 'uploading':
        return 'from-blue-500 to-cyan-500';
      case 'processing':
        return 'from-purple-500 to-pink-500';
      case 'completed':
        return 'from-green-500 to-emerald-500';
      case 'error':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  const getStatusTitle = () => {
    switch (processing.status) {
      case 'uploading':
        return '이미지 업로드 중';
      case 'processing':
        return 'AI가 3D로 변환 중';
      case 'completed':
        return '변환 완료!';
      case 'error':
        return '오류 발생';
      default:
        return '처리 중...';
    }
  };

  const getStepInfo = () => {
    const steps = [
      { key: 'uploading', label: '이미지 업로드', icon: <Upload className="w-4 h-4" /> },
      { key: 'processing', label: 'AI 깊이 분석', icon: <Sparkles className="w-4 h-4" /> },
      { key: 'processing', label: '3D 레이어 생성', icon: <Zap className="w-4 h-4" /> },
      { key: 'processing', label: '씬 구성', icon: <Camera className="w-4 h-4" /> },
    ];

    const currentStepIndex = processing.status === 'uploading' ? 0 : processing.status === 'processing' ? Math.floor(processing.progress / 30) : 3;

    return steps.map((step, index) => ({
      ...step,
      isActive: index <= currentStepIndex,
      isCompleted: index < currentStepIndex,
    }));
  };

  // For completed/error: render as floating toast (non-blocking)
  if (processing.status === 'completed' || processing.status === 'error') {
    const isCompleted = processing.status === 'completed';
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="fixed top-6 right-6 z-50"
        >
          <Card className="backdrop-blur-xl bg-black/60 border-white/10 shadow-2xl">
            <CardContent className="px-5 py-4">
              <div className="flex items-start space-x-3">
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br ${getStatusColor()} bg-clip-padding`}>{getStatusIcon()}</div>
                <div className="min-w-[220px]">
                  <p className="font-semibold text-sm mb-1">{getStatusTitle()}</p>
                  <p className={`text-xs ${isCompleted ? 'text-gray-300' : 'text-red-300'}`}>{processing.message || (isCompleted ? '3D 씬이 성공적으로 생성되었습니다!' : '처리 중 오류가 발생했습니다')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Uploading/processing: full-screen overlay
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-lg"
        >
          <Card className="backdrop-blur-xl bg-black/40 border-white/10 shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl mb-4">
                  {getStatusIcon()}
                </motion.div>
                <h3 className="text-2xl font-bold mb-2 gradient-text">{getStatusTitle()}</h3>
                <p className="text-gray-300 text-sm">{processing.message}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  {getStepInfo().map((step, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${step.isCompleted ? 'bg-green-500 text-white' : step.isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse' : 'bg-gray-600 text-gray-400'}`}>{step.isCompleted ? '✓' : index + 1}</div>
                      <span className={`text-xs ${step.isActive ? 'text-white' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                  <motion.div className={`h-full bg-gradient-to-r ${getStatusColor()} rounded-full`} initial={{ width: 0 }} animate={{ width: `${processing.progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">진행률</span>
                  <span className="text-sm font-semibold text-white">{processing.progress}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProcessingOverlay;
