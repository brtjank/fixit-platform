import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, LogIn } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { errorMessage } from '@/shared/api'
import { Button, Card, FormField, Input } from '@/shared/ui'
import { useLogin } from '../hooks'
import { DemoAccounts, type DemoAccount } from './DemoAccounts'

const makeLoginSchema = (t: TFunction<'auth'>) =>
  z.object({
    email: z.string().trim().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  })

type LoginValues = z.infer<ReturnType<typeof makeLoginSchema>>

export function LoginForm() {
  const { t } = useTranslation('auth')
  const loginSchema = useMemo(() => makeLoginSchema(t), [t])
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const [demoEmail, setDemoEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const onSubmit = (values: LoginValues) => {
    login.mutate(values, {
      onSuccess: () => navigate(from, { replace: true }),
      onSettled: () => setDemoEmail(null),
    })
  }

  const pickDemo = (account: DemoAccount) => {
    setValue('email', account.email, { shouldValidate: true })
    setValue('password', 'demo', { shouldValidate: true })
    setDemoEmail(account.email)
    void handleSubmit(onSubmit)()
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-md sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-fg">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {login.isError ? (
            <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger-fg/20 bg-danger-soft px-3 py-2.5 text-sm text-danger-fg">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{errorMessage(login.error, t('login.error'))}</span>
            </div>
          ) : null}

          <FormField label={t('login.email')} error={errors.email?.message}>
            {(control) => (
              <Input {...control} type="email" autoComplete="email" placeholder={t('login.emailPlaceholder')} autoFocus {...register('email')} />
            )}
          </FormField>

          <FormField label={t('login.password')} error={errors.password?.message}>
            {(control) => <Input {...control} type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />}
          </FormField>

          <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
            {login.isPending ? null : <LogIn />}
            {login.isPending ? t('login.submitting') : t('login.submit')}
          </Button>

          <p className="text-center text-xs text-fg-subtle">
            {t('login.passwordNotice')}
          </p>
        </form>
      </Card>

      <DemoAccounts onPick={pickDemo} disabled={login.isPending} pendingEmail={login.isPending ? demoEmail : null} />
    </div>
  )
}
