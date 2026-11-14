import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { useIsAdmin } from '@/features/auth'
import { isApiError } from '@/shared/api'
import { formatDate } from '@/shared/lib'
import { Badge, Button, Card, CardContent, CardFooter, ErrorState, FormField, Input, NativeSelect, Skeleton, Textarea } from '@/shared/ui'
import {
  TENANT_ADDRESS_MAX_LENGTH,
  TENANT_CONTACT_EMAIL_MAX_LENGTH,
  TENANT_DESCRIPTION_MAX_LENGTH,
  TENANT_NAME_MAX_LENGTH,
  TENANT_PHONE_MAX_LENGTH,
  TenantErrorCodes,
  type TenantSettings,
  type UpdateTenantRequest,
} from '../api/settingsApi'
import { useTenant, useUpdateTenant } from '../hooks'
import { SectionHeading } from './SectionCard'

/** IANA ids offered in the select (the backend accepts any id TimeZoneInfo knows; the current value is always added). */
const TIMEZONES = ['Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'UTC']

/** Same rule as the backend (TEN_004): exactly one `@`, text on both sides, a dot in the domain. */
function isContactEmail(value: string) {
  const parts = value.split('@')
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0 && parts[1].includes('.')
}

const makeSchema = (t: TFunction<'settings'>) => {
  const max = (n: number) => t('organization.validation.maxLength', { max: n })
  return z.object({
    name: z.string().trim().min(1, t('organization.validation.nameRequired')).max(TENANT_NAME_MAX_LENGTH, max(TENANT_NAME_MAX_LENGTH)),
    description: z.string().trim().max(TENANT_DESCRIPTION_MAX_LENGTH, max(TENANT_DESCRIPTION_MAX_LENGTH)),
    contactEmail: z
      .string()
      .trim()
      .max(TENANT_CONTACT_EMAIL_MAX_LENGTH, max(TENANT_CONTACT_EMAIL_MAX_LENGTH))
      .refine((v) => v === '' || isContactEmail(v), t('organization.validation.email')),
    phone: z.string().trim().max(TENANT_PHONE_MAX_LENGTH, max(TENANT_PHONE_MAX_LENGTH)),
    address: z.string().trim().max(TENANT_ADDRESS_MAX_LENGTH, max(TENANT_ADDRESS_MAX_LENGTH)),
    timezone: z.string().min(1, t('organization.validation.timezone')),
  })
}
type Values = z.infer<ReturnType<typeof makeSchema>>

const toValues = (tenant: TenantSettings): Values => ({
  name: tenant.name,
  description: tenant.description ?? '',
  contactEmail: tenant.contactEmail ?? '',
  phone: tenant.phone ?? '',
  address: tenant.address ?? '',
  timezone: tenant.timezone,
})

/** Trimmed by the schema already; empty → null for the nullable fields (as the backend does). */
const toRequest = (v: Values): UpdateTenantRequest => ({
  name: v.name,
  description: v.description || null,
  contactEmail: v.contactEmail || null,
  phone: v.phone || null,
  address: v.address || null,
  timezone: v.timezone,
})

export function OrganizationSection() {
  const { t } = useTranslation('settings')
  const schema = useMemo(() => makeSchema(t), [t])
  const isAdmin = useIsAdmin()
  const tenant = useTenant()
  const update = useUpdateTenant()
  const { register, handleSubmit, reset, setError, formState } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (tenant.data) reset(toValues(tenant.data))
  }, [tenant.data, reset])

  const onSubmit = handleSubmit((v) =>
    update.mutate(toRequest(v), {
      onSuccess: (saved) => reset(toValues(saved)),
      // TEN_00x land on their field (the hook skips the toast for these codes).
      onError: (e) => {
        if (!isApiError(e)) return
        const max = (n: number) => t('organization.validation.maxLength', { max: n })
        const opts = { shouldFocus: true }
        switch (e.errorCode) {
          case TenantErrorCodes.NameRequired:
            return setError('name', { message: t('organization.validation.nameRequired') }, opts)
          case TenantErrorCodes.NameTooLong:
            return setError('name', { message: max(TENANT_NAME_MAX_LENGTH) }, opts)
          case TenantErrorCodes.DescriptionTooLong:
            return setError('description', { message: max(TENANT_DESCRIPTION_MAX_LENGTH) }, opts)
          case TenantErrorCodes.ContactEmailInvalid:
            return setError('contactEmail', { message: t('organization.validation.email') }, opts)
          case TenantErrorCodes.PhoneTooLong:
            return setError('phone', { message: max(TENANT_PHONE_MAX_LENGTH) }, opts)
          case TenantErrorCodes.AddressTooLong:
            return setError('address', { message: max(TENANT_ADDRESS_MAX_LENGTH) }, opts)
          case TenantErrorCodes.TimezoneInvalid:
            return setError('timezone', { message: t('organization.validation.timezone') }, opts)
        }
      },
    }),
  )

  const { errors } = formState
  const zones = tenant.data && !TIMEZONES.includes(tenant.data.timezone) ? [tenant.data.timezone, ...TIMEZONES] : TIMEZONES

  return (
    <section>
      <SectionHeading title={t('organization.title')} description={t('organization.description')} />
      {tenant.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : tenant.isError || !tenant.data ? (
        <ErrorState retry={() => void tenant.refetch()} />
      ) : (
        <Card>
          <form onSubmit={onSubmit} noValidate>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                <Badge tone="brand">{t(`organization.plans.${tenant.data.plan}`, { defaultValue: tenant.data.plan })}</Badge>
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
                <FormField label={t('organization.form.contactEmail')} error={errors.contactEmail?.message}>
                  {(c) => <Input type="email" {...c} {...register('contactEmail')} />}
                </FormField>
                <FormField label={t('organization.form.phone')} error={errors.phone?.message}>
                  {(c) => <Input type="tel" {...c} {...register('phone')} />}
                </FormField>
                <FormField label={t('organization.form.address')} error={errors.address?.message}>
                  {(c) => <Input {...c} {...register('address')} />}
                </FormField>
                <FormField label={t('organization.form.timezone')} required error={errors.timezone?.message}>
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
