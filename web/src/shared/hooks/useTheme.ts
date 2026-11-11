import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist((set) => ({ theme: 'system', setTheme: (theme) => set({ theme }) }), { name: 'fixit.theme' }),
)

const media = window.matchMedia('(prefers-color-scheme: dark)')

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && media.matches)
  document.documentElement.classList.toggle('dark', dark)
}

/** Call once at app start — keeps <html class="dark"> in sync with the store and OS preference. */
export function initTheme() {
  apply(useThemeStore.getState().theme)
  useThemeStore.subscribe((s) => apply(s.theme))
  media.addEventListener('change', () => apply(useThemeStore.getState().theme))
}

export function useTheme() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const resolved: 'light' | 'dark' = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
  return { theme, resolved, setTheme }
}
