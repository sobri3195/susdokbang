import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  globalSearch: string;
  setSidebarCollapsed: (value: boolean) => void;
  setDarkMode: (value: boolean) => void;
  setGlobalSearch: (value: string) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      darkMode: false,
      globalSearch: "",
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setGlobalSearch: (globalSearch) => set({ globalSearch }),
    }),
    { name: "csakt-ui" },
  ),
);
