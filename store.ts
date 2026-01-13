
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VideoItem, PlayerSettings } from './types';

interface VideoStore {
  videos: VideoItem[];
  currentVideoId: string | null;
  settings: PlayerSettings;
  
  addVideo: (video: VideoItem) => void;
  removeVideo: (id: string) => void;
  setCurrentVideo: (id: string | null) => void;
  updateVideoProgress: (id: string, progress: number) => void;
  toggleFavorite: (id: string) => void;
  updateSettings: (settings: Partial<PlayerSettings>) => void;
  clearHistory: () => void;
}

export const useVideoStore = create<VideoStore>()(
  persist(
    (set) => ({
      videos: [],
      currentVideoId: null,
      settings: {
        volume: 0.8,
        playbackRate: 1,
        isMuted: false,
        isTheaterMode: false,
        quality: 'auto',
      },

      addVideo: (video) => set((state) => ({ 
        videos: [video, ...state.videos.filter(v => v.id !== video.id)].slice(0, 50) 
      })),

      removeVideo: (id) => set((state) => ({ 
        videos: state.videos.filter((v) => v.id !== id),
        currentVideoId: state.currentVideoId === id ? null : state.currentVideoId
      })),

      setCurrentVideo: (id) => set({ currentVideoId: id }),

      updateVideoProgress: (id, progress) => set((state) => ({
        videos: state.videos.map((v) => v.id === id ? { ...v, progress, lastPlayedAt: Date.now() } : v)
      })),

      toggleFavorite: (id) => set((state) => ({
        videos: state.videos.map((v) => v.id === id ? { ...v, favorite: !v.favorite } : v)
      })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      clearHistory: () => set({ videos: [], currentVideoId: null }),
    }),
    {
      name: 'nexus-player-storage',
      // Store everything EXCEPT the Blob URL (source) as it's session-only
      partialize: (state) => ({
        videos: state.videos.map(v => ({ ...v, source: '' })),
        settings: state.settings,
      }),
    }
  )
);
