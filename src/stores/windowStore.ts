import { create } from 'zustand';

export interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface WindowStore {
  windows: WindowState[];
  maxZIndex: number;
  createWindow: (window: WindowState) => void;
  closeWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  bringToFront: (id: string) => void;
}

export const useWindowStore = create<WindowStore>((set) => ({
  windows: [],
  maxZIndex: 1,
  createWindow: (window) =>
    set((state) => ({
      windows: [...state.windows, window],
      maxZIndex: Math.max(state.maxZIndex, window.zIndex) + 1,
    })),
  closeWindow: (id) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
    })),
  toggleMinimize: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
      ),
    })),
  toggleMaximize: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    })),
  updateWindowPosition: (id, x, y) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, x, y } : w
      ),
    })),
  updateWindowSize: (id, width, height) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, width, height } : w
      ),
    })),
  bringToFront: (id) =>
    set((state) => {
      const newMaxZIndex = state.maxZIndex + 1;
      return {
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, zIndex: newMaxZIndex } : w
        ),
        maxZIndex: newMaxZIndex,
      };
    }),
}));
