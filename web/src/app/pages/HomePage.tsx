import { lazy } from 'react'
import { useRole } from '@/features/auth'
import { UserRole } from '@/shared/types'

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const MyRequestsPage = lazy(() => import('@/features/service-requests/pages/MyRequestsPage'))

/** "/" depends on who is signed in: customers land on their requests, staff on the dashboard. */
export default function HomePage() {
  const role = useRole()
  if (role === UserRole.Customer) return <MyRequestsPage />
  return <DashboardPage />
}
