import { create } from 'zustand';

export interface Track {
  id: number;
  title: string;
  artist: string;
  cover?: string;
  album?: any;
  youtube_id?: string;
  preview_url?: string;
  lyrics?: string;
  genre?: string;
  duration?: number;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  progress: number; // 0 to 100
  duration: number; // in seconds
  currentTime: number; // in seconds
  
  // Actions
  setTrack: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  playNext: () => void;
  playPrev: () => void;
  setIsPlaying: (playing: boolean) => void;
  setProgress: (progress: number, currentTime: number, duration: number) => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  progress: 0,
  duration: 0,
  currentTime: 0,

  setTrack: (track) => set({ currentTrack: track, isPlaying: true, progress: 0, currentTime: 0 }),
  
  setQueue: (tracks) => set({ queue: tracks }),
  
  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
  
  playNext: () => {
    const { currentTrack, queue } = get();
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      set({ currentTrack: queue[currentIndex + 1], isPlaying: true, progress: 0, currentTime: 0 });
    }
  },
  
  playPrev: () => {
    const { currentTrack, queue } = get();
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      set({ currentTrack: queue[currentIndex - 1], isPlaying: true, progress: 0, currentTime: 0 });
    }
  },
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  setProgress: (progress, currentTime, duration) => set({ progress, currentTime, duration }),
  
  clearQueue: () => set({ queue: [], currentTrack: null, isPlaying: false }),
}));
