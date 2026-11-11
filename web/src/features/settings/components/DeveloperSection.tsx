import { useMutation } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/features/auth'
import { errorMessage, http } from '@/shared/api'
import { env } from '@/shared/config/env'
import { decodeJwt, formatDateTime, type FixItJwtClaims } from '@/shared/lib'
import { Badge, Button, Card, CardContent, CardHeader } from '@/shared/ui'
import { CopyButton } from './CopyButton'
import { SectionHeading } from './SectionCard'

const EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
const ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

function HealthCheck() {
  const [failedAt, setFailedAt] = useState<Date | null>(null)
  const check = useMutation({
    mutationFn: async () => ({ result: await http.get<string>('/health'), at: new Date() }),
    onError: () => setFailedAt(new Date()),
  })
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" size="sm" loading={check.isPending} onClick={() => check.mutate()}>
        <Activity /> Check backend health
      </Button>
      {check.isSuccess ? (
        <>
          <Badge tone="success" dot>
            {String(check.data.result)}
          </Badge>
          <span className="text-xs text-fg-subtle">{formatDateTime(check.data.at)}</span>
        </>
      ) : null}
      {check.isError ? (
        <>
          <Badge tone="danger" dot>
            {errorMessage(check.error)}
          </Badge>
          <span className="text-xs text-fg-subtle">{formatDateTime(failedAt)}</span>
        </>
      ) : null}
    </div>
  )
}

export function DeveloperSection() {
  const session = useSession()
  const claims = session ? decodeJwt<FixItJwtClaims & Record<string, unknown>>(session.token) : null
  const rows: [string, string][] = claims
    ? [
        ['role', String(claims.role ?? claims[ROLE] ?? '—')],
        ['TenantId', claims.TenantId ?? '—'],
        ['sub', claims.sub ?? '—'],
        ['email', claims[EMAIL] ?? (claims.email as string | undefined) ?? '—'],
        ['exp', claims.exp ? formatDateTime(new Date(claims.exp * 1000)) : '—'],
      ]
    : []

  return (
    <section className="space-y-4">
      <SectionHeading title="Developer" description="Diagnostics for the API connection and your session." />
      <Card>
        <CardHeader title="API connection" />
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-fg-muted">Mode</span>
            <Badge tone={env.apiMode === 'mock' ? 'warning' : 'success'} dot>
              {env.apiMode === 'mock' ? 'Mock' : 'Live'}
            </Badge>
          </div>
          <p className="text-xs text-fg-muted">
            Switch with <code className="font-mono text-fg">VITE_API_MODE=mock|live</code> in <code className="font-mono text-fg">.env.local</code>, then restart the dev server. Endpoints that
            are mocked even in live mode are listed in docs/API_GAPS.md.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-fg-muted">API base URL</span>
            <code className="font-mono text-xs text-fg">{env.apiUrl || '(same origin, proxied to http://localhost:5177)'}</code>
          </div>
          <HealthCheck />
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Session token" actions={session ? <CopyButton value={session.token} label="Copy token" /> : null} />
        <CardContent>
          {rows.length ? (
            <dl className="divide-y divide-border text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
                  <dt className="w-24 shrink-0 font-mono text-xs text-fg-subtle">{k}</dt>
                  <dd className="min-w-0 break-all font-mono text-xs text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-fg-muted">No readable token in this session.</p>
          )}
          <p className="mt-3 text-xs text-fg-subtle">Treat this token like a password. Anyone holding it can act as you until it expires.</p>
        </CardContent>
      </Card>
    </section>
  )
}
