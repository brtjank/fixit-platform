import { i18n } from '@/i18n'
import { env } from '@/shared/config/env'
import { ApiError } from './errors'

type QueryValue = string | number | boolean | null | undefined
export type Query = Record<string, QueryValue>

interface RequestOptions {
  query?: Query
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
}

/** Hooks the auth layer plugs into (set once in features/auth/session.ts). */
export const httpAuth = {
  getToken: (): string | null => null,
  onUnauthorized: (_errorCode: string | undefined, _token: string | null): void => {},
}

function buildUrl(path: string, query?: Query) {
  const base = env.apiUrl.replace(/\/$/, '')
  const url = new URL(`${base}${path}`, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const token = httpAuth.getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(0, null, i18n.t('common:errors.network'))
  }

  const data = await parseBody(response)

  if (!response.ok) {
    const body = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null
    if (response.status === 401) httpAuth.onUnauthorized(typeof body?.errorCode === 'string' ? body.errorCode : undefined, token)
    throw new ApiError(
      response.status,
      body
        ? {
            errorCode: typeof body.errorCode === 'string' ? body.errorCode : undefined,
            message: typeof body.message === 'string' ? body.message : typeof body.title === 'string' ? body.title : undefined,
            requestId: typeof body.requestId === 'string' ? body.requestId : null,
          }
        : null,
      typeof data === 'string' ? data : undefined,
    )
  }

  return data as T
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('DELETE', path, options),
}
