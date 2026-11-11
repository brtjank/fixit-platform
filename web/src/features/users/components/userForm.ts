import { z } from 'zod'
import { ROLE_META } from '@/shared/lib'
import { UserRole } from '@/shared/types'

export const ROLE_OPTIONS = [UserRole.Admin, UserRole.Worker, UserRole.Customer].map((role) => ({
  value: String(role) as RoleValue,
  label: ROLE_META[role].label,
}))

export const roleSchema = z.enum(['1', '2', '3'], { message: 'Select a role' })
export type RoleValue = z.infer<typeof roleSchema>

export const nameSchema = {
  firstName: z.string().trim().min(1, 'First name is required').max(100, 'Max 100 characters'),
  lastName: z.string().trim().min(1, 'Last name is required').max(100, 'Max 100 characters'),
}

export const toRole = (value: RoleValue) => Number(value) as UserRole
