import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const LANGUAGES = ['en', 'pl'] as const
export type Language = (typeof LANGUAGES)[number]
export const DEFAULT_LANGUAGE: Language = 'en'

export const LANGUAGE_META: Record<Language, { label: string; nativeLabel: string; flag: string }> = {
  en: { label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  pl: { label: 'Polish', nativeLabel: 'Polski', flag: '🇵🇱' },
}

/**
 * Translation resources: src/locales/<lang>/<namespace>.json, loaded eagerly at build time.
 * Adding a JSON file is enough — no registration needed. Namespaces are owned per feature
 * (common, auth, dashboard, requests, users, workers, settings, notifications).
 */
const files = import.meta.glob<{ default: Record<string, unknown> }>('../locales/*/*.json', { eager: true })

const resources: Record<string, Record<string, Record<string, unknown>>> = {}
for (const [path, mod] of Object.entries(files)) {
  const match = /locales\/([a-z-]+)\/([a-z-]+)\.json$/i.exec(path)
  if (!match) continue
  const [, lang, ns] = match
  ;(resources[lang!] ??= {})[ns!] = mod.default
}

function detectLanguage(): Language {
  const nav = navigator.language?.toLowerCase() ?? ''
  return nav.startsWith('pl') ? 'pl' : DEFAULT_LANGUAGE
}

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: detectLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'fixit.language' },
  ),
)

void i18n.use(initReactI18next).init({
  resources,
  lng: useLanguageStore.getState().language,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  ns: Object.keys(resources[DEFAULT_LANGUAGE] ?? {}),
  interpolation: { escapeValue: false },
  returnNull: false,
})

useLanguageStore.subscribe((state) => {
  if (i18n.language !== state.language) void i18n.changeLanguage(state.language)
  document.documentElement.lang = state.language
})
document.documentElement.lang = useLanguageStore.getState().language

export function useLanguage() {
  const language = useLanguageStore((s) => s.language)
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  return { language, setLanguage }
}

export { i18n }
export default i18n
