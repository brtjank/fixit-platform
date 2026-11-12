export type ApiMode = 'mock' | 'live'

const mode = (import.meta.env.VITE_API_MODE as string | undefined)?.toLowerCase()

export const env = {
  /** 'mock' = everything served by MSW; 'live' = real backend + MSW only for missing endpoints */
  apiMode: (mode === 'live' ? 'live' : 'mock') as ApiMode,
  /** Base URL for API calls ('' = same origin → Vite proxy) */
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? '',
  isDev: import.meta.env.DEV,
} as const

export const isMockMode = env.apiMode === 'mock'
