import { create } from 'zustand';

const DEFAULT_THEME = 'dark';

const applyTheme = (theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
};

const persistTheme = (theme) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('arc-theme', theme);
  }
};

const readStoredTheme = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('arc-theme');
  }
  return null;
};

const useThemeStore = create((set) => ({
  theme: DEFAULT_THEME,
  initializeTheme: () => {
    const stored = readStoredTheme();
    const theme = stored || DEFAULT_THEME;
    applyTheme(theme);
    set({ theme });
  },
  setTheme: (theme) => {
    applyTheme(theme);
    persistTheme(theme);
    set({ theme });
  },
}));

export default useThemeStore;
