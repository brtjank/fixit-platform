import { Search } from 'lucide-react'
import { useId } from 'react'
import { Input, NativeSelect, Switch } from '@/shared/ui'

interface WorkersToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  availableOnly: boolean
  onAvailableOnlyChange: (value: boolean) => void
  specialization: string
  onSpecializationChange: (value: string) => void
  specializations: string[]
}

export function WorkersToolbar(props: WorkersToolbarProps) {
  const switchId = useId()
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
        <Input
          type="search"
          value={props.search}
          onChange={(e) => props.onSearchChange(e.target.value)}
          placeholder="Search name or specialization…"
          aria-label="Search workers"
          className="pl-9"
        />
      </div>
      <div className="w-full sm:w-56">
        <NativeSelect
          value={props.specialization}
          onChange={(e) => props.onSpecializationChange(e.target.value)}
          aria-label="Filter by specialization"
        >
          <option value="">All specializations</option>
          {props.specializations.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </NativeSelect>
      </div>
      <label htmlFor={switchId} className="flex cursor-pointer items-center gap-2 text-sm text-fg sm:ml-auto">
        <Switch id={switchId} checked={props.availableOnly} onCheckedChange={props.onAvailableOnlyChange} />
        Available only
      </label>
    </div>
  )
}
