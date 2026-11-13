import type { TFunction } from 'i18next'
import { z } from 'zod'
import { roleLabel } from '@/shared/lib'
import { UserRole } from '@/shared/types'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../api/usersApi'

const ROLE_VALUES = ['1', '2', '3'] as const
export type RoleValue = (typeof ROLE_VALUES)[number]

/** Role select options — call during render so labels follow the active language. */
export const roleOptions = () =>
  [UserRole.Admin, UserRole.Worker, UserRole.Customer].map((role) => ({
    value: String(role) as RoleValue,
    label: roleLabel(role),
  }))

export const makeRoleSchema = (t: TFunction<'users'>) => z.enum(ROLE_VALUES, { message: t('form.validation.role') })

export const makeNameSchema = (t: TFunction<'users'>) => ({
  firstName: z
    .string()
    .trim()
    .min(1, t('form.validation.firstNameRequired'))
    .max(100, t('form.validation.maxLength', { max: 100 })),
  lastName: z
    .string()
    .trim()
    .min(1, t('form.validation.lastNameRequired'))
    .max(100, t('form.validation.maxLength', { max: 100 })),
})

export const toRole = (value: RoleValue) => Number(value) as UserRole

/** Password policy (8–128, same as the backend's USR_007_PASSWORD_TOO_WEAK). Not trimmed — spaces are allowed. */
export const makePasswordSchema = (t: TFunction<'users'>) =>
  z
    .string()
    .min(1, t('password.validation.required'))
    .min(PASSWORD_MIN_LENGTH, t('password.validation.min', { min: PASSWORD_MIN_LENGTH }))
    .max(PASSWORD_MAX_LENGTH, t('password.validation.max', { max: PASSWORD_MAX_LENGTH }))

/** New password + confirmation; the mismatch error lands on `confirmPassword`. */
export const makeNewPasswordSchema = (t: TFunction<'users'>) =>
  z
    .object({ newPassword: makePasswordSchema(t), confirmPassword: z.string() })
    .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: t('password.validation.confirmMismatch') })

export const passwordHint = (t: TFunction<'users'>) => t('password.hint', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })

export const passwordTooWeakMessage = (t: TFunction<'users'>) =>
  t('password.validation.tooWeak', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
