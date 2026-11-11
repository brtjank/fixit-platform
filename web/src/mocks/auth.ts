/**
 * Mock-side auth helpers: issue fake JWTs (mock mode) and read bearer tokens
 * (both modes — in live mode the real backend's token is decoded the same way).
 */
import { HttpResponse } from 'msw'
import { decodeJwt, parseRole, type FixItJwtClaims } from '@/shared/lib'
import { UserRole, type User } from '@/shared/types'
import { findUser, findUserByEmail } from './db'

const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** Unsigned, structurally valid JWT mirroring JwtTokenService claims. Mock mode only. */
export function issueMockToken(user: User, expiresInMinutes = 60) {
  const claims: FixItJwtClaims & Record<string, unknown> = {
    sub: user.id,
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': user.id,
    TenantId: user.tenantId,
    role: ['', 'Admin', 'Worker', 'Customer'][user.role],
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': ['', 'Admin', 'Worker', 'Customer'][user.role],
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': user.email,
    exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60,
    iss: 'FixIt.Platform',
    aud: 'FixIt.Platform',
  }
  return `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(claims))}.mock-signature`
}

export interface Principal {
  userId: string
  tenantId: string
  role: UserRole
  email: string | null
}

export function readPrincipal(request: Request): Principal | null {
  const header = request.headers.get('authorization')
  if (!header?.toLowerCase().startsWith('bearer ')) return null
  const claims = decodeJwt<FixItJwtClaims>(header.slice(7))
  if (!claims) return null
  if (claims.exp && claims.exp * 1000 < Date.now()) return null
  const userId = claims.sub ?? claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
  const role = parseRole(claims.role ?? claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])
  if (!userId || !claims.TenantId || !role) return null
  return {
    userId,
    tenantId: claims.TenantId,
    role,
    email: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? null,
  }
}

/** Resolve the principal to a mock-db user (by id, then by email — the latter helps in live mode). */
export function resolveUser(principal: Principal): User | null {
  return findUser(principal.userId) ?? (principal.email ? findUserByEmail(principal.email) : null)
}

// ---- Error responses mirroring ErrorHandlingMiddleware -------------------------

export function apiError(status: number, errorCode: string, message: string) {
  return HttpResponse.json({ errorCode, message, requestId: crypto.randomUUID() }, { status })
}

export const errors = {
  unauthorized: () => apiError(401, 'AUTH_001_NOT_AUTHENTICATED', 'User is not authenticated.'),
  forbidden: () => apiError(403, 'AUTH_002_FORBIDDEN', 'You do not have permission to perform this action.'),
  notFound: (entity: string, id: string) => apiError(404, 'RES_001_NOT_FOUND', `${entity} with identifier '${id}' was not found.`),
  badRequest: (code: string, message: string) => apiError(400, code, message),
}

/** Mirrors [Authorize] + policies. Returns an error response or the principal. */
export function authorize(request: Request, roles?: UserRole[]): Principal | Response {
  const principal = readPrincipal(request)
  if (!principal) return errors.unauthorized()
  if (roles && !roles.includes(principal.role)) return errors.forbidden()
  return principal
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response
}

export const Policies = {
  AdminOnly: [UserRole.Admin],
  WorkerOrAdmin: [UserRole.Worker, UserRole.Admin],
  CustomerOrAdmin: [UserRole.Customer, UserRole.Admin],
} as const
