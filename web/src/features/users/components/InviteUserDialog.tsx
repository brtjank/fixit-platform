import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { errorMessage } from '@/shared/api'
import { Button, Dialog, DialogClose, DialogContent, FormField, Input, MockBadge, NativeSelect } from '@/shared/ui'
import { useInviteUser } from '../hooks'
import { nameSchema, ROLE_OPTIONS, roleSchema, toRole } from './userForm'

const schema = z.object({
  email: z.email('Enter a valid email address').trim(),
  ...nameSchema,
  role: roleSchema,
})
type FormValues = z.infer<typeof schema>

const FORM_ID = 'invite-user-form'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <InviteUserDialogBody onDone={() => onOpenChange(false)} /> : null}
    </Dialog>
  )
}

function InviteUserDialogBody({ onDone }: { onDone: () => void }) {
  const invite = useInviteUser()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', firstName: '', lastName: '', role: '2' },
  })

  const onSubmit = handleSubmit((values) =>
    invite.mutate({ ...values, role: toRole(values.role) }, { onSuccess: onDone }),
  )

  return (
    <DialogContent
      title={
        <span className="inline-flex items-center gap-2">
          Invite user <MockBadge />
        </span>
      }
      description="They will receive an email invitation to join your organization."
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="submit" form={FORM_ID} loading={invite.isPending}>
            Send invitation
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-4" noValidate>
        {invite.error ? (
          <div role="alert" className="rounded-md border border-danger-fg/30 bg-danger-soft px-3 py-2 text-sm text-danger-fg">
            {errorMessage(invite.error, 'Could not invite the user')}
          </div>
        ) : null}
        <FormField label="Email" required error={errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="off" placeholder="name@company.com" {...register('email')} />}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" required error={errors.firstName?.message}>
            {(p) => <Input {...p} {...register('firstName')} />}
          </FormField>
          <FormField label="Last name" required error={errors.lastName?.message}>
            {(p) => <Input {...p} {...register('lastName')} />}
          </FormField>
        </div>
        <FormField label="Role" required error={errors.role?.message} hint="Workers get a profile and can be assigned to requests.">
          {(p) => (
            <NativeSelect {...p} {...register('role')}>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
      </form>
    </DialogContent>
  )
}
