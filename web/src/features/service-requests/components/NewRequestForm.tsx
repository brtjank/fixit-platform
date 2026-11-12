import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { useIsAdmin, useProfile, useSession } from '@/features/auth'
import { useUserDirectory } from '@/features/users/hooks'
import { cn, fullName } from '@/shared/lib'
import { Avatar, Button, Card, CardContent, CardFooter, FormField, Input, NativeSelect, Textarea } from '@/shared/ui'
import { useCreateServiceRequest } from '../hooks'
import { InlineError } from './InlineError'

const TITLE_MAX = 200
const DESCRIPTION_MAX = 2000

function makeSchema(t: TFunction<'requests'>) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, t('new.validation.titleRequired'))
      .max(TITLE_MAX, t('new.validation.titleMax', { max: TITLE_MAX })),
    description: z
      .string()
      .trim()
      .min(1, t('new.validation.descriptionRequired'))
      .max(DESCRIPTION_MAX, t('new.validation.descriptionMax', { max: DESCRIPTION_MAX })),
    customerId: z.string().min(1, t('new.validation.customerRequired')),
  })
}
type FormValues = z.infer<ReturnType<typeof makeSchema>>

function Counter({ value, max }: { value: number; max: number }) {
  return <span className={cn('tabular', value > max && 'text-danger-fg')}>{value}/{max}</span>
}

export function NewRequestForm() {
  const { t } = useTranslation('requests')
  const schema = useMemo(() => makeSchema(t), [t])
  const navigate = useNavigate()
  const session = useSession()
  const profile = useProfile()
  const isAdmin = useIsAdmin()
  const directory = useUserDirectory()
  const create = useCreateServiceRequest()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', customerId: isAdmin ? '' : (session?.userId ?? '') },
  })
  const { errors } = form.formState
  const title = useWatch({ control: form.control, name: 'title' })
  const description = useWatch({ control: form.control, name: 'description' })

  const onSubmit = form.handleSubmit((values) =>
    create.mutate(values, { onSuccess: (created) => navigate(`/requests/${created.id}`, { replace: true }) }),
  )

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-5 py-5">
          {isAdmin ? (
            <FormField label={t('new.form.customerLabel')} required error={errors.customerId?.message}>
              {(field) => (
                <NativeSelect {...field} {...form.register('customerId')} disabled={directory.isLoading}>
                  <option value="">{directory.isLoading ? t('new.form.loadingCustomers') : t('new.form.selectCustomer')}</option>
                  {[...directory.customers]
                    .filter((c) => c.isActive)
                    .sort((a, b) => fullName(a).localeCompare(fullName(b)))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {fullName(c)} · {c.email}
                      </option>
                    ))}
                </NativeSelect>
              )}
            </FormField>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-bg-subtle px-3 py-2.5">
              <Avatar user={profile} size="sm" />
              <div className="text-sm text-fg-muted">
                {t('new.form.submittingAs')} <span className="font-medium text-fg">{profile ? fullName(profile) : t('new.form.you')}</span>
                {profile?.email ? <span className="text-fg-subtle"> · {profile.email}</span> : null}
              </div>
            </div>
          )}

          <FormField label={t('new.form.titleLabel')} required error={errors.title?.message} hint={<Counter value={title.length} max={TITLE_MAX} />}>
            {(field) => <Input {...field} {...form.register('title')} placeholder={t('new.form.titlePlaceholder')} autoFocus />}
          </FormField>

          <FormField
            label={t('new.form.descriptionLabel')}
            required
            error={errors.description?.message}
            hint={<Counter value={description.length} max={DESCRIPTION_MAX} />}
          >
            {(field) => (
              <Textarea
                {...field}
                {...form.register('description')}
                rows={7}
                placeholder={t('new.form.descriptionPlaceholder')}
              />
            )}
          </FormField>
          <InlineError error={create.error} />
        </CardContent>
        <CardFooter>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" loading={create.isPending}>
            {t('new.form.submit')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
