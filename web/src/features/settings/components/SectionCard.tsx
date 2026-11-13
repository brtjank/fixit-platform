import type { ReactNode } from 'react'

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {description ? <p className="mt-0.5 text-sm text-fg-muted">{description}</p> : null}
    </div>
  )
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-36 shrink-0 text-xs font-medium uppercase tracking-wide text-fg-subtle">{label}</dt>
      <dd className="min-w-0 text-sm text-fg">{children}</dd>
    </div>
  )
}
