import { CheckCircle2, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { env } from '@/shared/config/env'
import { Badge } from '@/shared/ui'
import { LoginForm } from '../components/LoginForm'

const YEAR = new Date().getFullYear()

const VALUE_POINTS = ['dispatch', 'track', 'workspace'] as const

function BrandPanel() {
  const { t } = useTranslation('auth')
  return (
    <div className="relative isolate flex flex-col justify-between overflow-hidden border-b border-border bg-bg-subtle px-6 py-8 sm:px-10 lg:min-h-full lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
      {/* Decorative gradient — token-based so it adapts to dark mode */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-[28rem] rounded-full bg-brand-soft blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)] opacity-60" />
      </div>

      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-fg-on-brand shadow-md">
          <Wrench className="size-5" aria-hidden />
        </span>
        <span className="text-lg font-semibold tracking-tight text-fg">FixIt</span>
      </div>

      <div className="mt-8 max-w-md lg:mt-0">
        <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{t('brand.heading')}</h2>
        <p className="mt-3 text-sm text-fg-muted sm:text-base">
          {t('brand.description')}
        </p>
        <ul className="mt-6 hidden space-y-3 sm:block">
          {VALUE_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm text-fg">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-fg" aria-hidden />
              {t(`brand.valuePoints.${point}`)}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 hidden text-xs text-fg-subtle lg:block">{t('brand.copyright', { year: YEAR })}</p>
    </div>
  )
}

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const isMock = env.apiMode === 'mock'
  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel />
      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md animate-in">
          <LoginForm />
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-fg-subtle">
            <span>{t('connection.connectedTo')}</span>
            <Badge tone={isMock ? 'warning' : 'success'} dot>
              {isMock ? t('common:topbar.mockApi') : t('common:topbar.liveApi')}
            </Badge>
          </div>
        </div>
      </main>
    </div>
  )
}
