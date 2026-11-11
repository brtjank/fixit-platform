import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { errorMessage } from '@/shared/api'
import type { WorkerProfile } from '@/shared/types'
import { Button, Dialog, DialogClose, DialogContent, FormField, Input, MockBadge, Switch } from '@/shared/ui'
import { useUpdateWorkerProfile } from '../hooks'

const schema = z.object({
  specialization: z.string().trim().max(100, 'Max 100 characters'),
  phoneNumber: z
    .string()
    .trim()
    .max(30, 'Max 30 characters')
    .regex(/^[+\d\s()-]*$/, 'Only digits, spaces, +, -, ( and )'),
  isAvailable: z.boolean(),
})
type FormValues = z.infer<typeof schema>

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
  const update = useUpdateWorkerProfile()
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
      { userId, body: { specialization: v.specialization || null, phoneNumber: v.phoneNumber || null, isAvailable: v.isAvailable } },
      { onSuccess: onDone },
    ),
  )

  return (
    <DialogContent
      title={
        <span className="inline-flex items-center gap-2">
          Edit profile <MockBadge />
        </span>
      }
      description={workerName}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="submit" form={FORM_ID} loading={update.isPending} disabled={!isDirty && profile !== null}>
            Save profile
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-4" noValidate>
        {update.error ? (
          <div role="alert" className="rounded-md border border-danger-fg/30 bg-danger-soft px-3 py-2 text-sm text-danger-fg">
            {errorMessage(update.error, 'Could not update the profile')}
          </div>
        ) : null}
        <FormField label="Specialization" error={errors.specialization?.message} hint="e.g. Plumbing, Electrical">
          {(p) => <Input {...p} {...register('specialization')} />}
        </FormField>
        <FormField label="Phone number" error={errors.phoneNumber?.message}>
          {(p) => <Input {...p} type="tel" className="font-mono" placeholder="+48 600 100 200" {...register('phoneNumber')} />}
        </FormField>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-bg-subtle px-3 py-2.5">
          <label htmlFor={switchId} className="cursor-pointer">
            <span className="block text-sm font-medium text-fg">Available for new assignments</span>
            <span className="block text-xs text-fg-muted">Unavailable workers are hidden from quick-assign suggestions.</span>
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
