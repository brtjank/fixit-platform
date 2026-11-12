import { setupWorker } from 'msw/browser'
import { persistDb } from './db'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// Persist the in-memory dataset after every mocked response (cheap: a few KB).
worker.events.on('response:mocked', () => persistDb())

export async function startMocks() {
  await worker.start({
    onUnhandledFrame: 'bypass',
    quiet: true,
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}
