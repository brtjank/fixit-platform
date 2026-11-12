import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import '@/i18n'
import { App } from '@/app/App'
import { initTheme } from '@/shared/hooks'
// Side-effect import: wires the auth store into the http client.
import '@/features/auth/session'

async function bootstrap() {
  initTheme()
  // MSW runs in both modes: in 'mock' it serves everything, in 'live' only the endpoints
  // the backend does not implement yet (see docs/API_GAPS.md).
  const { startMocks } = await import('@/mocks/browser')
  await startMocks()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
