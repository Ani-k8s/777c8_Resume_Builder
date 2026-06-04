import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  activePage: string;
  activeResumeId: number | null;
  openAIConfigured: boolean;
  latexAvailable: boolean;
  toggleSidebar: () => void;
  setActivePage: (page: string) => void;
  setActiveResumeId: (id: number | null) => void;
  setOpenAIConfigured: (value: boolean) => void;
  setLatexAvailable: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  activePage: 'dashboard',
  activeResumeId: null,
  openAIConfigured: false,
  latexAvailable: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActivePage: (page) => set({ activePage: page }),
  setActiveResumeId: (id) => set({ activeResumeId: id }),
  setOpenAIConfigured: (value) => set({ openAIConfigured: value }),
  setLatexAvailable: (value) => set({ latexAvailable: value }),
}));
