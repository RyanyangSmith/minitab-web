import { create } from 'zustand';

interface UIStore {
  sidebarWidth: number;
  setSidebarWidth: (w: number) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarWidth: 240,
  setSidebarWidth: (w) => set({ sidebarWidth: w }),
}));
