import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppState, ProcessingState, Scene3D } from '@/types';

interface AppStore extends AppState {
  // Actions
  setProcessing: (processing: ProcessingState) => void;
  setCurrentScene: (scene: Scene3D | null) => void;
  addScene: (scene: Scene3D) => void;
  removeScene: (sceneId: string) => void;
  toggleUI: (key: keyof AppState['ui']) => void;
  reset: () => void;
}

const initialState: AppState = {
  currentScene: null,
  processing: {
    status: 'idle',
    progress: 0,
    message: 'Ready to transform your photos'
  },
  scenes: [],
  ui: {
    showUpload: true,
    showControls: false,
    showInfo: false
  }
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setProcessing: (processing) => {
        set({ processing });
      },

      setCurrentScene: (scene) => {
        set({ currentScene: scene });
        if (scene) {
          set((state) => ({
            ui: {
              ...state.ui,
              showUpload: false,
              showControls: true
            }
          }));
        }
      },

      addScene: (scene) => {
        set((state) => ({
          scenes: [scene, ...state.scenes]
        }));
      },

      removeScene: (sceneId) => {
        set((state) => ({
          scenes: state.scenes.filter(scene => scene.id !== sceneId)
        }));
      },

      toggleUI: (key) => {
        set((state) => ({
          ui: {
            ...state.ui,
            [key]: !state.ui[key]
          }
        }));
      },

      reset: () => {
        set(initialState);
      }
    }),
    {
      name: 'paststep-app-store'
    }
  )
);
