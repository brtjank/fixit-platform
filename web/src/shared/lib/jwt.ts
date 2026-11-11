/** Decode a JWT payload without verifying (client-side only; the server verifies). */
export function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json))) as T
  } catch {
    return null
  }
}

/** Claims emitted by FixIt's JwtTokenService. */
export interface FixItJwtClaims {
  sub?: string
  TenantId?: string
  role?: string
  exp?: number
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string
}

export function emailFromToken(token: string): string | null {
  const claims = decodeJwt<FixItJwtClaims>(token)
  return claims?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? null
}

export function isTokenExpired(token: string, skewSeconds = 30) {
  const claims = decodeJwt<FixItJwtClaims>(token)
  if (!claims?.exp) return false
  return claims.exp * 1000 < Date.now() + skewSeconds * 1000
}
