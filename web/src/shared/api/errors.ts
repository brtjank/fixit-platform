import { i18n } from '@/i18n'
import type { ApiErrorBody } from '@/shared/types'

/** Normalized API error. Mirrors ErrorHandlingMiddleware's `{ errorCode, message, requestId }`. */
export class ApiError extends Error {
  readonly status: number
  readonly errorCode: string
  readonly requestId: string | null

  constructor(status: number, body: Partial<ApiErrorBody> | null, fallbackMessage?: string) {
    super(body?.message || fallbackMessage || `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.errorCode = body?.errorCode ?? (status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`)
    this.requestId = body?.requestId ?? null
  }

  get isUnauthorized() {
    return this.status === 401
  }
  get isForbidden() {
    return this.status === 403
  }
  get isNotFound() {
    return this.status === 404
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** Human-readable message for toasts / inline errors. */
export function errorMessage(error: unknown, fallback?: string) {
  fallback ??= i18n.t('common:errors.generic')
  if (isApiError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}
