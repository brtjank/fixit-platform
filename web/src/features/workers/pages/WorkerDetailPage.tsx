import { ArrowLeft, UserX } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { useSession, useIsAdmin } from '@/features/auth'
import { useUser } from '@/features/users/hooks'
import { errorMessage } from '@/shared/api'
import { fullName } from '@/shared/lib'
import { UserRole } from '@/shared/types'
import { Button, EmptyState, ErrorState, PageSpinner } from '@/shared/ui'
import { EditWorkerProfileDialog } from '../components/EditWorkerProfileDialog'
import { WorkerAssignedRequests } from '../components/WorkerAssignedRequests'
import { WorkerDetailHeader } from '../components/WorkerDetailHeader'
import { WorkerProfileCard } from '../components/WorkerProfileCard'
import { WorkerStatTiles } from '../components/WorkerStatTiles'
import { useWorkerRoster } from '../hooks'

export default function WorkerDetailPage() {
  const { t } = useTranslation('workers')
  const { id = '' } = useParams()
  const session = useSession()
  const isAdmin = useIsAdmin()
  const [editOpen, setEditOpen] = useState(false)
  const { entries, workersQuery, profilesQuery, workloadQuery, extrasLoading } = useWorkerRoster()

  const entry = entries.find((e) => e.user.id === id) ?? null
  // Fallback (⚠ mock-only GET /api/users/{id}) when the worker is not in the first 100 results.
  const needsFallback = workersQuery.isSuccess && !entry
  const fallback = useUser(needsFallback ? id : undefined)

  const user = entry?.user ?? (fallback.data?.role === UserRole.Worker ? fallback.data : null)
  const profile = entry?.profile ?? profilesQuery.data?.find((p) => p.userId === id) ?? null
  const workload = entry?.workload ?? workloadQuery.data?.find((w) => w.workerId === id) ?? null

  const backLink = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
      <Link to="/workers">
        <ArrowLeft /> {t('detail.allWorkers')}
      </Link>
    </Button>
  )

  if (workersQuery.isLoading || (needsFallback && fallback.isLoading)) return <PageSpinner />

  if (workersQuery.isError)
    return (
      <>
        {backLink}
        <ErrorState title={t('detail.loadError')} message={errorMessage(workersQuery.error)} retry={() => void workersQuery.refetch()} />
      </>
    )

  if (!user)
    return (
      <>
        {backLink}
        <EmptyState
          icon={UserX}
          title={t('detail.notFoundTitle')}
          description={t('detail.notFoundDescription')}
          action={
            <Button variant="secondary" asChild>
              <Link to="/workers">{t('detail.backToWorkers')}</Link>
            </Button>
          }
        />
      </>
    )

  const canEdit = isAdmin || session?.userId === user.id

  return (
    <>
      {backLink}
      <WorkerDetailHeader user={user} profile={profile} profileLoading={profilesQuery.isLoading} canEdit={canEdit} onEdit={() => setEditOpen(true)} />

      <div className="space-y-6">
        <WorkerStatTiles workload={workload} loading={workloadQuery.isLoading} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <WorkerAssignedRequests workerId={user.id} />
          </div>
          <WorkerProfileCard user={user} profile={profile} loading={extrasLoading} />
        </div>
      </div>

      {canEdit ? (
        <EditWorkerProfileDialog open={editOpen} onOpenChange={setEditOpen} userId={user.id} profile={profile} workerName={fullName(user)} />
      ) : null}
    </>
  )
}
