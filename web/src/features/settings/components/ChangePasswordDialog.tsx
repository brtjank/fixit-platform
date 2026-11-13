import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { UserErrorCodes } from '@/features/users/api/usersApi'
import { makePasswordSchema, passwordHint, passwordTooWeakMessage } from '@/features/users/components/userForm'
import { isFieldError, useChangeOwnPassword } from '@/features/users/hooks'
import { errorMessage, isApiError } from '@/shared/api'
import { Button, Dialog, DialogClose, DialogContent, FormField, PasswordInput } from '@/shared/ui'

const FORM_ID = 'change-password-form'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Signed-in user changes their own password (✅ PUT /api/users/me/password). */
export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <ChangePasswordDialogBody onDone={() => onOpenChange(false)} /> : null}
    </Dialog>
  )
}

function ChangePasswordDialogBody({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation('settings')
  const { t: tu } = useTranslation('users')
  const change = useChangeOwnPassword()
  const schema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, t('changePassword.currentRequired')),
          newPassword: makePasswordSchema(tu),
          confirmPassword: z.string(),
        })
        .refine((v) => v.newPassword === v.confirmPassword, {
          path: ['confirmPassword'],
          message: tu('password.validation.confirmMismatch'),
        }),
    [t, tu],
  )
  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(({ currentPassword, newPassword }) =>
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: onDone,
        // Field-level API errors go inline (the hook skips the toast for these codes).
        onError: (e) => {
          if (!isApiError(e)) return
          if (e.errorCode === UserErrorCodes.PasswordMismatch)
            setError('currentPassword', { message: t('changePassword.currentIncorrect') }, { shouldFocus: true })
          if (e.errorCode === UserErrorCodes.PasswordTooWeak)
            setError('newPassword', { message: passwordTooWeakMessage(tu) }, { shouldFocus: true })
        },
      },
    ),
  )

  return (
    <DialogContent
      size="sm"
      title={t('changePassword.title')}
      description={t('changePassword.description')}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">{t('common:actions.cancel')}</Button>
          </DialogClose>
          <Button type="submit" form={FORM_ID} loading={change.isPending}>
            {t('changePassword.submit')}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-4" noValidate>
        {change.error && !isFieldError(change.error) ? (
          <div role="alert" className="rounded-md border border-danger-fg/30 bg-danger-soft px-3 py-2 text-sm text-danger-fg">
            {errorMessage(change.error, t('changePassword.error'))}
          </div>
        ) : null}
        <FormField label={t('changePassword.current')} required error={errors.currentPassword?.message}>
          {(p) => <PasswordInput {...p} autoComplete="current-password" autoFocus {...register('currentPassword')} />}
        </FormField>
        <FormField label={tu('password.new')} required error={errors.newPassword?.message} hint={passwordHint(tu)}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...register('newPassword')} />}
        </FormField>
        <FormField label={tu('password.confirm')} required error={errors.confirmPassword?.message}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...register('confirmPassword')} />}
        </FormField>
      </form>
    </DialogContent>
  )
}
