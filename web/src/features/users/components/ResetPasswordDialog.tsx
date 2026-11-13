import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'
import { errorMessage, isApiError } from '@/shared/api'
import { fullName } from '@/shared/lib'
import type { User } from '@/shared/types'
import { Button, Dialog, DialogClose, DialogContent, FormField, PasswordInput } from '@/shared/ui'
import { UserErrorCodes } from '../api/usersApi'
import { isFieldError, useResetUserPassword } from '../hooks'
import { makeNewPasswordSchema, passwordHint, passwordTooWeakMessage } from './userForm'

type FormValues = z.infer<ReturnType<typeof makeNewPasswordSchema>>

const FORM_ID = 'reset-password-form'

interface ResetPasswordDialogProps {
  user: User | null
  onOpenChange: (open: boolean) => void
}

/** Admin sets a new password for a user (✅ PUT /api/users/{id}/password). No email flow yet. */
export function ResetPasswordDialog({ user, onOpenChange }: ResetPasswordDialogProps) {
  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      {user ? <ResetPasswordDialogBody key={user.id} user={user} onDone={() => onOpenChange(false)} /> : null}
    </Dialog>
  )
}

function ResetPasswordDialogBody({ user, onDone }: { user: User; onDone: () => void }) {
  const { t } = useTranslation('users')
  const reset = useResetUserPassword()
  const schema = useMemo(() => makeNewPasswordSchema(t), [t])
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { newPassword: '', confirmPassword: '' } })

  const onSubmit = handleSubmit((values) =>
    reset.mutate(
      { id: user.id, body: { newPassword: values.newPassword } },
      {
        onSuccess: onDone,
        onError: (e) => {
          if (isApiError(e) && e.errorCode === UserErrorCodes.PasswordTooWeak)
            setError('newPassword', { message: passwordTooWeakMessage(t) }, { shouldFocus: true })
        },
      },
    ),
  )

  return (
    <DialogContent
      size="sm"
      title={t('resetPassword.title')}
      description={t('resetPassword.description', { name: fullName(user), email: user.email })}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">{t('common:actions.cancel')}</Button>
          </DialogClose>
          <Button type="submit" form={FORM_ID} loading={reset.isPending}>
            {t('resetPassword.submit')}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-4" noValidate>
        {reset.error && !isFieldError(reset.error) ? (
          <div role="alert" className="rounded-md border border-danger-fg/30 bg-danger-soft px-3 py-2 text-sm text-danger-fg">
            {errorMessage(reset.error, t('resetPassword.error'))}
          </div>
        ) : null}
        <FormField label={t('password.new')} required error={errors.newPassword?.message} hint={passwordHint(t)}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" autoFocus {...register('newPassword')} />}
        </FormField>
        <FormField label={t('password.confirm')} required error={errors.confirmPassword?.message}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...register('confirmPassword')} />}
        </FormField>
      </form>
    </DialogContent>
  )
}
