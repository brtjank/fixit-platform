import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { errorMessage } from '@/shared/api'
import { Button, Card, FormField, Input } from '@/shared/ui'
import { useLogin } from '../hooks'
import { DemoAccounts, type DemoAccount } from './DemoAccounts'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
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
          <h1 className="text-xl font-semibold tracking-tight text-fg">Sign in</h1>
          <p className="mt-1 text-sm text-fg-muted">Welcome back. Enter your work email to continue.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {login.isError ? (
            <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger-fg/20 bg-danger-soft px-3 py-2.5 text-sm text-danger-fg">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{errorMessage(login.error, 'Could not sign in')}</span>
            </div>
          ) : null}

          <FormField label="Email" error={errors.email?.message}>
            {(control) => (
              <Input {...control} type="email" autoComplete="email" placeholder="name@company.com" autoFocus {...register('email')} />
            )}
          </FormField>

          <FormField label="Password" error={errors.password?.message}>
            {(control) => <Input {...control} type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />}
          </FormField>

          <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
            {login.isPending ? null : <LogIn />}
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>

          <p className="text-center text-xs text-fg-subtle">
            The backend does not verify passwords yet — any password works for a known user.
          </p>
        </form>
      </Card>

      <DemoAccounts onPick={pickDemo} disabled={login.isPending} pendingEmail={login.isPending ? demoEmail : null} />
    </div>
  )
}
