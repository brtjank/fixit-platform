import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { useIsAdmin } from '@/features/auth'
import { formatDate } from '@/shared/lib'
import { Badge, Button, Card, CardContent, CardFooter, ErrorState, FormField, Input, NativeSelect, Skeleton, Textarea } from '@/shared/ui'
import { useTenant, useUpdateTenant } from '../hooks'
import { SectionHeading } from './SectionCard'

const TIMEZONES = ['Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'UTC']

const makeSchema = (t: TFunction<'settings'>) =>
  z.object({
    name: z.string().trim().min(2, t('organization.validation.nameMin')).max(100),
    description: z.string().max(500, t('organization.validation.descriptionMax')),
    contactEmail: z.string().trim().email(t('organization.validation.email')),
    phone: z.string().max(30),
    address: z.string().max(200),
    timezone: z.string().min(1),
  })
type Values = z.infer<ReturnType<typeof makeSchema>>

export function OrganizationSection() {
  const { t } = useTranslation('settings')
  const schema = useMemo(() => makeSchema(t), [t])
  const isAdmin = useIsAdmin()
  const tenant = useTenant()
  const update = useUpdateTenant()
  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (tenant.data) {
      const data = tenant.data
      reset({
        name: data.name,
        description: data.description ?? '',
        contactEmail: data.contactEmail,
        phone: data.phone,
        address: data.address,
        timezone: data.timezone,
      })
    }
  }, [tenant.data, reset])

  const { errors } = formState
  const zones = tenant.data && !TIMEZONES.includes(tenant.data.timezone) ? [tenant.data.timezone, ...TIMEZONES] : TIMEZONES

  return (
    <section>
      <SectionHeading title={t('organization.title')} description={t('organization.description')} mock />
      {tenant.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : tenant.isError || !tenant.data ? (
        <ErrorState retry={() => void tenant.refetch()} />
      ) : (
        <Card>
          <form
            onSubmit={handleSubmit((v) =>
              update.mutate({ ...v, description: v.description.trim() || null }, { onSuccess: (saved) => reset({ ...v, name: saved.name }) }),
            )}
          >
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                <Badge tone="brand">{t('organization.plan')}</Badge>
                <span>{t('organization.created', { date: formatDate(tenant.data.createdAt) })}</span>
              </div>
              {!isAdmin ? <p className="rounded-md bg-bg-subtle px-3 py-2 text-xs text-fg-muted">{t('organization.adminOnly')}</p> : null}
              <fieldset disabled={!isAdmin || update.isPending} className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('organization.form.name')} required error={errors.name?.message} className="sm:col-span-2">
                  {(c) => <Input {...c} {...register('name')} />}
                </FormField>
                <FormField label={t('organization.form.description')} error={errors.description?.message} className="sm:col-span-2">
                  {(c) => <Textarea {...c} {...register('description')} rows={3} />}
                </FormField>
                <FormField label={t('organization.form.contactEmail')} required error={errors.contactEmail?.message}>
                  {(c) => <Input type="email" {...c} {...register('contactEmail')} />}
                </FormField>
                <FormField label={t('organization.form.phone')} error={errors.phone?.message}>
                  {(c) => <Input type="tel" {...c} {...register('phone')} />}
                </FormField>
                <FormField label={t('organization.form.address')} error={errors.address?.message}>
                  {(c) => <Input {...c} {...register('address')} />}
                </FormField>
                <FormField label={t('organization.form.timezone')}>
                  {(c) => (
                    <NativeSelect {...c} {...register('timezone')}>
                      {zones.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </FormField>
              </fieldset>
            </CardContent>
            {isAdmin ? (
              <CardFooter>
                <Button type="button" variant="ghost" disabled={!formState.isDirty} onClick={() => reset()}>
                  {t('organization.reset')}
                </Button>
                <Button type="submit" loading={update.isPending} disabled={!formState.isDirty}>
                  {t('organization.save')}
                </Button>
              </CardFooter>
            ) : null}
          </form>
        </Card>
      )}
    </section>
  )
}
