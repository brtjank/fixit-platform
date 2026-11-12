import type { TFunction } from 'i18next'
import { z } from 'zod'
import { roleLabel } from '@/shared/lib'
import { UserRole } from '@/shared/types'

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
