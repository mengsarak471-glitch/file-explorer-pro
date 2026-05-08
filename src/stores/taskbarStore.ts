import { create } from 'zustand';

export interface TaskbarApp {
  id: string;
  name: string;
  icon: string;
  isPinned: boolean;
}

interface TaskbarStore {
  apps: TaskbarApp[];
  isStartMenuOpen: boolean;
  toggleStartMenu: () => void;
  addApp: (app: TaskbarApp) => void;
  removeApp: (id: string) => void;
  togglePinApp: (id: string) => void;
}

export const useTaskbarStore = create<TaskbarStore>((set) => ({
  apps: [
    { id: '1', name: 'File Explorer', icon: 'FolderOpen', isPinned: true },
    { id: '2', name: 'Settings', icon: 'Settings', isPinned: true },
    { id: '3', name: 'Edge', icon: 'Globe', isPinned: false },
  ],
  isStartMenuOpen: false,
  toggleStartMenu: () =>
    set((state) => ({
      isStartMenuOpen: !state.isStartMenuOpen,
    })),
  addApp: (app) =>
    set((state) => ({
      apps: [...state.apps, app],
    })),
  removeApp: (id) =>
    set((state) => ({
      apps: state.apps.filter((app) => app.id !== id),
    })),
  togglePinApp: (id) =>
    set((state) => ({
      apps: state.apps.map((app) =>
        app.id === id ? { ...app, isPinned: !app.isPinned } : app
      ),
    })),
}));
