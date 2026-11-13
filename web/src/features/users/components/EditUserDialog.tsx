import { zodResolver } from '@hookform/resolvers/zod'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { errorMessage } from '@/shared/api'
import { fullName } from '@/shared/lib'
import type { User } from '@/shared/types'
import { Button, Dialog, DialogClose, DialogContent, FormField, Input, NativeSelect } from '@/shared/ui'
import { useUpdateUser } from '../hooks'
import { makeNameSchema, makeRoleSchema, roleOptions, toRole, type RoleValue } from './userForm'

const makeSchema = (t: TFunction<'users'>) => z.object({ ...makeNameSchema(t), role: makeRoleSchema(t).optional() })
type FormValues = z.infer<ReturnType<typeof makeSchema>>

const FORM_ID = 'edit-user-form'

interface EditUserDialogProps {
  user: User | null
  onOpenChange: (open: boolean) => void
  /** When true the role cannot be changed (e.g. editing yourself). */
  lockRole?: boolean
}

export function EditUserDialog({ user, onOpenChange, lockRole }: EditUserDialogProps) {
  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      {user ? <EditUserDialogBody key={user.id} user={user} lockRole={lockRole} onDone={() => onOpenChange(false)} /> : null}
    </Dialog>
  )
}

function EditUserDialogBody({ user, lockRole, onDone }: { user: User; lockRole?: boolean; onDone: () => void }) {
  const { t } = useTranslation('users')
  const update = useUpdateUser()
  const schema = useMemo(() => makeSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName, role: String(user.role) as RoleValue },
  })

  const onSubmit = handleSubmit((values) =>
    update.mutate({ id: user.id, body: { ...values, role: values.role && !lockRole ? toRole(values.role) : user.role } }, { onSuccess: onDone }),
  )

  return (
    <DialogContent
      title={t('edit.title')}
      description={`${fullName(user)} · ${user.email}`}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">{t('common:actions.cancel')}</Button>
          </DialogClose>
          <Button type="submit" form={FORM_ID} loading={update.isPending} disabled={!isDirty}>
            {t('edit.submit')}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-4" noValidate>
        {update.error ? (
          <div role="alert" className="rounded-md border border-danger-fg/30 bg-danger-soft px-3 py-2 text-sm text-danger-fg">
            {errorMessage(update.error, t('edit.error'))}
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('form.firstName')} required error={errors.firstName?.message}>
            {(p) => <Input {...p} {...register('firstName')} />}
          </FormField>
          <FormField label={t('form.lastName')} required error={errors.lastName?.message}>
            {(p) => <Input {...p} {...register('lastName')} />}
          </FormField>
        </div>
        <FormField
          label={t('form.role')}
          required
          error={errors.role?.message}
          hint={lockRole ? t('edit.roleLocked') : undefined}
        >
          {(p) => (
            <NativeSelect {...p} {...(lockRole ? { disabled: true, value: String(user.role), onChange: () => {} } : register('role'))}>
              {roleOptions().map((o) => (
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
