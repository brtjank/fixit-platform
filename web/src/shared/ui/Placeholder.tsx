import { Construction } from 'lucide-react'
import { EmptyState, PageHeader } from './index'

/** Temporary page body used while a screen is being built. */
export function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState icon={Construction} title="Under construction" description="This screen has not been implemented yet." />
    </>
  )
}
