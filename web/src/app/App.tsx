import { RouterProvider } from 'react-router'
import { useLanguage } from '@/i18n'
import { AppProviders } from './providers/AppProviders'
import { router } from './router'

export function App() {
  // Keying by language remounts the tree on switch, so helpers that read i18n outside hooks
  // (statusLabel, formatRelative, …) always render in the current language.
  const { language } = useLanguage()
  return (
    <AppProviders key={language}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
