import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useIsAdmin } from '@/features/auth'
import { formatDate } from '@/shared/lib'
import { Badge, Button, Card, CardContent, CardFooter, ErrorState, FormField, Input, NativeSelect, Skeleton, Textarea } from '@/shared/ui'
import { useTenant, useUpdateTenant } from '../hooks'
import { SectionHeading } from './SectionCard'

const TIMEZONES = ['Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'UTC']

const schema = z.object({
  name: z.string().trim().min(2, 'Name must have at least 2 characters').max(100),
  description: z.string().max(500, 'Max 500 characters'),
  contactEmail: z.string().trim().email('Enter a valid email'),
  phone: z.string().max(30),
  address: z.string().max(200),
  timezone: z.string().min(1),
})
type Values = z.infer<typeof schema>

export function OrganizationSection() {
  const isAdmin = useIsAdmin()
  const tenant = useTenant()
  const update = useUpdateTenant()
  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (tenant.data) {
      const t = tenant.data
      reset({
        name: t.name,
        description: t.description ?? '',
        contactEmail: t.contactEmail,
        phone: t.phone,
        address: t.address,
        timezone: t.timezone,
      })
    }
  }, [tenant.data, reset])

  const { errors } = formState
  const zones = tenant.data && !TIMEZONES.includes(tenant.data.timezone) ? [tenant.data.timezone, ...TIMEZONES] : TIMEZONES

  return (
    <section>
      <SectionHeading title="Organization" description="Details shown to your team and customers." mock />
      {tenant.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : tenant.isError || !tenant.data ? (
        <ErrorState retry={() => void tenant.refetch()} />
      ) : (
        <Card>
          <form
            onSubmit={handleSubmit((v) =>
              update.mutate({ ...v, description: v.description.trim() || null }, { onSuccess: (t) => reset({ ...v, name: t.name }) }),
            )}
          >
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                <Badge tone="brand">Team plan</Badge>
                <span>Created {formatDate(tenant.data.createdAt)}</span>
              </div>
              {!isAdmin ? <p className="rounded-md bg-bg-subtle px-3 py-2 text-xs text-fg-muted">Only administrators can edit organization settings.</p> : null}
              <fieldset disabled={!isAdmin || update.isPending} className="grid gap-4 sm:grid-cols-2">
                <FormField label="Name" required error={errors.name?.message} className="sm:col-span-2">
                  {(c) => <Input {...c} {...register('name')} />}
                </FormField>
                <FormField label="Description" error={errors.description?.message} className="sm:col-span-2">
                  {(c) => <Textarea {...c} {...register('description')} rows={3} />}
                </FormField>
                <FormField label="Contact email" required error={errors.contactEmail?.message}>
                  {(c) => <Input type="email" {...c} {...register('contactEmail')} />}
                </FormField>
                <FormField label="Phone" error={errors.phone?.message}>
                  {(c) => <Input type="tel" {...c} {...register('phone')} />}
                </FormField>
                <FormField label="Address" error={errors.address?.message}>
                  {(c) => <Input {...c} {...register('address')} />}
                </FormField>
                <FormField label="Timezone">
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
                  Reset
                </Button>
                <Button type="submit" loading={update.isPending} disabled={!formState.isDirty}>
                  Save changes
                </Button>
              </CardFooter>
            ) : null}
          </form>
        </Card>
      )}
    </section>
  )
}
