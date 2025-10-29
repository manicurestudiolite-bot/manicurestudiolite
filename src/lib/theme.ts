export type Theme = 'light' | 'dark' | 'system';

export const getSystemTheme = (): 'light' | 'dark' => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const systemTheme = getSystemTheme();
    root.classList.remove('light', 'dark');
    root.classList.add(systemTheme);
  } else {
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }
};

export const getStoredTheme = (): Theme => {
  const stored = localStorage.getItem('theme') as Theme;
  return stored || 'system';
};

export const setStoredTheme = (theme: Theme) => {
  localStorage.setItem('theme', theme);
  applyTheme(theme);
};
