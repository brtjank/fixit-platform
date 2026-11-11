import { Check } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useTheme, type Theme } from '@/shared/hooks'
import { cn } from '@/shared/lib'
import { SectionHeading } from './SectionCard'

/** Mini mockup; tokens are re-declared locally (mirrors globals.css) so a light preview also works inside dark mode. */
const PREVIEW_VARS = {
  light: { '--bg': 'oklch(98.5% 0.003 240)', '--surface': 'oklch(100% 0 0)', '--border': 'oklch(91% 0.006 240)', '--fg': 'oklch(20% 0.02 250)', '--brand': 'oklch(60% 0.12 185)' },
  dark: { '--bg': 'oklch(16% 0.012 250)', '--surface': 'oklch(21% 0.012 250)', '--border': 'oklch(29% 0.012 250)', '--fg': 'oklch(95% 0.005 250)', '--brand': 'oklch(74% 0.12 185)' },
} as const

function Mock({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <div className="h-full w-full" style={PREVIEW_VARS[mode] as CSSProperties}>
      <div className="flex h-full overflow-hidden rounded-md border border-border bg-bg">
        <div className="w-1/4 space-y-1.5 border-r border-border bg-surface p-2">
          <div className="h-1.5 w-3/4 rounded bg-brand" />
          <div className="h-1.5 w-full rounded bg-border" />
          <div className="h-1.5 w-2/3 rounded bg-border" />
        </div>
        <div className="flex-1 space-y-2 p-2">
          <div className="h-2 w-1/3 rounded bg-fg" />
          <div className="space-y-1 rounded bg-surface p-1.5 shadow-sm">
            <div className="h-1.5 w-full rounded bg-border" />
            <div className="h-1.5 w-4/5 rounded bg-border" />
          </div>
          <div className="h-3 w-1/4 rounded bg-brand" />
        </div>
      </div>
    </div>
  )
}

const OPTIONS: { value: Theme; label: string; hint: string }[] = [
  { value: 'light', label: 'Light', hint: 'Bright surfaces' },
  { value: 'dark', label: 'Dark', hint: 'Easy on the eyes' },
  { value: 'system', label: 'System', hint: 'Follows your OS' },
]

export function AppearanceSection() {
  const { theme, setTheme, resolved } = useTheme()
  return (
    <section>
      <SectionHeading title="Appearance" description="Saved on this device." />
      <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const active = theme === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(o.value)}
              className={cn(
                'rounded-lg border bg-surface p-3 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'border-brand ring-2 ring-ring' : 'border-border',
              )}
            >
              <div className="relative h-24">
                {o.value === 'system' ? (
                  <div className="relative h-full w-full overflow-hidden rounded-md">
                    <Mock mode={resolved === 'dark' ? 'light' : 'dark'} />
                    <div className="absolute inset-0 [clip-path:polygon(0_0,100%_0,0_100%)]">
                      <Mock mode={resolved === 'dark' ? 'dark' : 'light'} />
                    </div>
                  </div>
                ) : (
                  <Mock mode={o.value} />
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fg">{o.label}</p>
                  <p className="text-xs text-fg-muted">{o.hint}</p>
                </div>
                {active ? <Check className="size-4 text-brand-fg" /> : null}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
