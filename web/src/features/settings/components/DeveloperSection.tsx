import { useMutation } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('settings')
  const [failedAt, setFailedAt] = useState<Date | null>(null)
  const check = useMutation({
    mutationFn: async () => ({ result: await http.get<string>('/health'), at: new Date() }),
    onError: () => setFailedAt(new Date()),
  })
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" size="sm" loading={check.isPending} onClick={() => check.mutate()}>
        <Activity /> {t('developer.health.check')}
      </Button>
      {check.isSuccess ? (
        <>
          <Badge tone="success" dot>
            {String(check.data.result) === 'Healthy' ? t('developer.health.healthy') : String(check.data.result)}
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
  const { t } = useTranslation('settings')
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
      <SectionHeading title={t('developer.title')} description={t('developer.description')} />
      <Card>
        <CardHeader title={t('developer.api.title')} />
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-fg-muted">{t('developer.api.mode')}</span>
            <Badge tone={env.apiMode === 'mock' ? 'warning' : 'success'} dot>
              {env.apiMode === 'mock' ? t('developer.api.mock') : t('developer.api.live')}
            </Badge>
          </div>
          <p className="text-xs text-fg-muted">
            {t('developer.api.switchHintBefore')} <code className="font-mono text-fg">VITE_API_MODE=mock|live</code> {t('developer.api.switchHintIn')}{' '}
            <code className="font-mono text-fg">.env.local</code>
            {t('developer.api.switchHintAfter')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-fg-muted">{t('developer.api.baseUrl')}</span>
            <code className="font-mono text-xs text-fg">{env.apiUrl || t('developer.api.sameOrigin')}</code>
          </div>
          <HealthCheck />
        </CardContent>
      </Card>
      <Card>
        <CardHeader title={t('developer.token.title')} actions={session ? <CopyButton value={session.token} label={t('developer.token.copy')} /> : null} />
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
            <p className="text-sm text-fg-muted">{t('developer.token.empty')}</p>
          )}
          <p className="mt-3 text-xs text-fg-subtle">{t('developer.token.securityNote')}</p>
        </CardContent>
      </Card>
    </section>
  )
}
