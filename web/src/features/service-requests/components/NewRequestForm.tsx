import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { useIsAdmin, useProfile, useSession } from '@/features/auth'
import { useUserDirectory } from '@/features/users/hooks'
import { cn, fullName } from '@/shared/lib'
import { Avatar, Button, Card, CardContent, CardFooter, FormField, Input, NativeSelect, Textarea } from '@/shared/ui'
import { useCreateServiceRequest } from '../hooks'
import { InlineError } from './InlineError'

const TITLE_MAX = 200
const DESCRIPTION_MAX = 2000

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(TITLE_MAX, `Title must not exceed ${TITLE_MAX} characters`),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(DESCRIPTION_MAX, `Description must not exceed ${DESCRIPTION_MAX} characters`),
  customerId: z.string().min(1, 'Choose a customer'),
})
type FormValues = z.infer<typeof schema>

function Counter({ value, max }: { value: number; max: number }) {
  return <span className={cn('tabular', value > max && 'text-danger-fg')}>{value}/{max}</span>
}

export function NewRequestForm() {
  const navigate = useNavigate()
  const session = useSession()
  const profile = useProfile()
  const isAdmin = useIsAdmin()
  const directory = useUserDirectory()
  const create = useCreateServiceRequest()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', customerId: isAdmin ? '' : (session?.userId ?? '') },
  })
  const { errors } = form.formState
  const title = useWatch({ control: form.control, name: 'title' })
  const description = useWatch({ control: form.control, name: 'description' })

  const onSubmit = form.handleSubmit((values) =>
    create.mutate(values, { onSuccess: (created) => navigate(`/requests/${created.id}`, { replace: true }) }),
  )

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-5 py-5">
          {isAdmin ? (
            <FormField label="Customer" required error={errors.customerId?.message}>
              {(field) => (
                <NativeSelect {...field} {...form.register('customerId')} disabled={directory.isLoading}>
                  <option value="">{directory.isLoading ? 'Loading customers…' : 'Select a customer'}</option>
                  {[...directory.customers]
                    .filter((c) => c.isActive)
                    .sort((a, b) => fullName(a).localeCompare(fullName(b)))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {fullName(c)} · {c.email}
                      </option>
                    ))}
                </NativeSelect>
              )}
            </FormField>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-bg-subtle px-3 py-2.5">
              <Avatar user={profile} size="sm" />
              <div className="text-sm text-fg-muted">
                Submitting as <span className="font-medium text-fg">{profile ? fullName(profile) : 'you'}</span>
                {profile?.email ? <span className="text-fg-subtle"> · {profile.email}</span> : null}
              </div>
            </div>
          )}

          <FormField label="Title" required error={errors.title?.message} hint={<Counter value={title.length} max={TITLE_MAX} />}>
            {(field) => <Input {...field} {...form.register('title')} placeholder="e.g. Leaking pipe under the kitchen sink" autoFocus />}
          </FormField>

          <FormField
            label="Description"
            required
            error={errors.description?.message}
            hint={<Counter value={description.length} max={DESCRIPTION_MAX} />}
          >
            {(field) => (
              <Textarea
                {...field}
                {...form.register('description')}
                rows={7}
                placeholder="Describe the problem, where it is, and when someone can visit."
              />
            )}
          </FormField>
          <InlineError error={create.error} />
        </CardContent>
        <CardFooter>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Submit request
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
