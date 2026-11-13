import { zodResolver } from '@hookform/resolvers/zod'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { errorMessage, isApiError } from '@/shared/api'
import { Button, Dialog, DialogClose, DialogContent, FormField, Input, NativeSelect, PasswordInput } from '@/shared/ui'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, UserErrorCodes } from '../api/usersApi'
import { isFieldError, useInviteUser } from '../hooks'
import { makeNameSchema, makePasswordSchema, makeRoleSchema, passwordTooWeakMessage, roleOptions, toRole } from './userForm'

const makeSchema = (t: TFunction<'users'>) =>
  z.object({
    email: z.email(t('form.validation.email')).trim(),
    ...makeNameSchema(t),
    role: makeRoleSchema(t),
    password: makePasswordSchema(t),
  })
type FormValues = z.infer<ReturnType<typeof makeSchema>>

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
  const { t } = useTranslation('users')
  const invite = useInviteUser()
  const schema = useMemo(() => makeSchema(t), [t])
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', firstName: '', lastName: '', role: '2', password: '' },
  })

  const onSubmit = handleSubmit((values) =>
    invite.mutate(
      { ...values, role: toRole(values.role) },
      {
        onSuccess: onDone,
        // Field-level API errors go inline (the hook skips the toast for these codes).
        onError: (e) => {
          if (!isApiError(e)) return
          if (e.errorCode === UserErrorCodes.EmailTaken) setError('email', { message: t('form.validation.emailTaken') }, { shouldFocus: true })
          if (e.errorCode === UserErrorCodes.PasswordTooWeak) setError('password', { message: passwordTooWeakMessage(t) }, { shouldFocus: true })
        },
      },
    ),
  )

  return (
    <DialogContent
      title={t('invite.title')}
      description={t('invite.description')}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">{t('common:actions.cancel')}</Button>
          </DialogClose>
          <Button type="submit" form={FORM_ID} loading={invite.isPending}>
            {t('invite.submit')}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-4" noValidate>
        {invite.error && !isFieldError(invite.error) ? (
          <div role="alert" className="rounded-md border border-danger-fg/30 bg-danger-soft px-3 py-2 text-sm text-danger-fg">
            {errorMessage(invite.error, t('invite.error'))}
          </div>
        ) : null}
        <FormField label={t('form.email')} required error={errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="off" placeholder={t('form.emailPlaceholder')} {...register('email')} />}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('form.firstName')} required error={errors.firstName?.message}>
            {(p) => <Input {...p} {...register('firstName')} />}
          </FormField>
          <FormField label={t('form.lastName')} required error={errors.lastName?.message}>
            {(p) => <Input {...p} {...register('lastName')} />}
          </FormField>
        </div>
        <FormField
          label={t('form.temporaryPassword')}
          required
          error={errors.password?.message}
          hint={t('form.temporaryPasswordHint', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })}
        >
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...register('password')} />}
        </FormField>
        <FormField label={t('form.role')} required error={errors.role?.message} hint={t('invite.roleHint')}>
          {(p) => (
            <NativeSelect {...p} {...register('role')}>
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
