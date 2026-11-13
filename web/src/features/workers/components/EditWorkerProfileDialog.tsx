import { zodResolver } from '@hookform/resolvers/zod'
import type { TFunction } from 'i18next'
import { useId, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { errorMessage } from '@/shared/api'
import { WORKER_PHONE_MAX_LENGTH, WORKER_SPECIALIZATION_MAX_LENGTH } from '../api/workersApi'
import type { WorkerProfile } from '@/shared/types'
import { Button, Dialog, DialogClose, DialogContent, FormField, Input, Switch } from '@/shared/ui'
import { useUpdateWorkerProfile } from '../hooks'

const makeSchema = (t: TFunction<'workers'>) =>
  z.object({
    // Limits mirror the backend (WRK_001 / WRK_002) so users see an inline message instead of a 400.
    specialization: z
      .string()
      .trim()
      .max(WORKER_SPECIALIZATION_MAX_LENGTH, t('editProfile.validation.maxLength', { max: WORKER_SPECIALIZATION_MAX_LENGTH })),
    phoneNumber: z
      .string()
      .trim()
      .max(WORKER_PHONE_MAX_LENGTH, t('editProfile.validation.maxLength', { max: WORKER_PHONE_MAX_LENGTH }))
      .regex(/^[+\d\s()-]*$/, t('editProfile.validation.phoneFormat')),
    isAvailable: z.boolean(),
  })
type FormValues = z.infer<ReturnType<typeof makeSchema>>

const FORM_ID = 'edit-worker-profile-form'

interface EditWorkerProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  profile: WorkerProfile | null
  workerName: string
}

export function EditWorkerProfileDialog({ open, onOpenChange, ...rest }: EditWorkerProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <Body {...rest} onDone={() => onOpenChange(false)} /> : null}
    </Dialog>
  )
}

function Body({ userId, profile, workerName, onDone }: Omit<EditWorkerProfileDialogProps, 'open' | 'onOpenChange'> & { onDone: () => void }) {
  const { t } = useTranslation('workers')
  const update = useUpdateWorkerProfile()
  const schema = useMemo(() => makeSchema(t), [t])
  const switchId = useId()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      specialization: profile?.specialization ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
      isAvailable: profile?.isAvailable ?? true,
    },
  })

  const onSubmit = handleSubmit((v) =>
    update.mutate(
      // PUT is a full replacement: always send all three fields (empty → null; backend also trims/nulls).
      { userId, body: { specialization: v.specialization || null, phoneNumber: v.phoneNumber || null, isAvailable: v.isAvailable } },
      { onSuccess: onDone },
    ),
  )

  return (
    <DialogContent
      title={t('editProfile.title')}
      description={workerName}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">{t('common:actions.cancel')}</Button>
          </DialogClose>
          <Button type="submit" form={FORM_ID} loading={update.isPending} disabled={!isDirty && profile !== null}>
            {t('editProfile.submit')}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-4" noValidate>
        {update.error ? (
          <div role="alert" className="rounded-md border border-danger-fg/30 bg-danger-soft px-3 py-2 text-sm text-danger-fg">
            {errorMessage(update.error, t('editProfile.error'))}
          </div>
        ) : null}
        <FormField label={t('editProfile.specialization')} error={errors.specialization?.message} hint={t('editProfile.specializationHint')}>
          {(p) => <Input {...p} {...register('specialization')} />}
        </FormField>
        <FormField label={t('editProfile.phone')} error={errors.phoneNumber?.message}>
          {(p) => <Input {...p} type="tel" className="font-mono" placeholder="+48 600 100 200" {...register('phoneNumber')} />}
        </FormField>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-bg-subtle px-3 py-2.5">
          <label htmlFor={switchId} className="cursor-pointer">
            <span className="block text-sm font-medium text-fg">{t('editProfile.availability')}</span>
            <span className="block text-xs text-fg-muted">{t('editProfile.availabilityHint')}</span>
          </label>
          <Controller
            control={control}
            name="isAvailable"
            render={({ field }) => <Switch id={switchId} checked={field.value} onCheckedChange={field.onChange} />}
          />
        </div>
      </form>
    </DialogContent>
  )
}
