import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import '@/i18n'
import { App } from '@/app/App'
import { isMockMode } from '@/shared/config/env'
import { initTheme } from '@/shared/hooks'
// Side-effect import: wires the auth store into the http client.
import '@/features/auth/session'

async function bootstrap() {
  initTheme()
  // MSW serves every request in 'mock' mode; in 'live' mode all endpoints hit the backend, so it is not started
  // (if a future endpoint is mocked ahead of the backend, list it in docs/API_GAPS.md and register it here).
  if (isMockMode) {
    const { startMocks } = await import('@/mocks/browser')
    await startMocks()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
