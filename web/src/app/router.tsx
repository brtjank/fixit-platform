import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet } from 'react-router'
import { UserRole } from '@/shared/types'
import { PageSpinner } from '@/shared/ui'
import { RedirectIfAuthed, RequireAuth } from './guards/RequireAuth'
import { RequireRole } from './guards/RequireRole'
import { AppShell } from './layouts/AppShell'
import { AuthLayout } from './layouts/AuthLayout'

// Pages are lazy so each feature becomes its own chunk.
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ServiceRequestsListPage = lazy(() => import('@/features/service-requests/pages/ServiceRequestsListPage'))
const ServiceRequestDetailPage = lazy(() => import('@/features/service-requests/pages/ServiceRequestDetailPage'))
const NewServiceRequestPage = lazy(() => import('@/features/service-requests/pages/NewServiceRequestPage'))
const MyAssignmentsPage = lazy(() => import('@/features/service-requests/pages/MyAssignmentsPage'))
const WorkersPage = lazy(() => import('@/features/workers/pages/WorkersPage'))
const WorkerDetailPage = lazy(() => import('@/features/workers/pages/WorkerDetailPage'))
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'))

function SuspenseOutlet() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Outlet />
    </Suspense>
  )
}

const { Admin, Worker, Customer } = UserRole

export const router = createBrowserRouter([
  {
    element: <RedirectIfAuthed />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: '/login', element: <Suspense fallback={<PageSpinner />}><LoginPage /></Suspense> }],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            element: <SuspenseOutlet />,
            children: [
              { index: true, element: <HomePage /> },

              { path: 'requests/new', element: <RequireRole roles={[Customer, Admin]} />, children: [{ index: true, element: <NewServiceRequestPage /> }] },
              { path: 'requests/:id', element: <ServiceRequestDetailPage /> },
              { path: 'requests', element: <RequireRole roles={[Admin, Worker]} />, children: [{ index: true, element: <ServiceRequestsListPage /> }] },
              { path: 'my-assignments', element: <RequireRole roles={[Worker]} />, children: [{ index: true, element: <MyAssignmentsPage /> }] },

              {
                path: 'workers',
                element: <RequireRole roles={[Admin, Worker]} />,
                children: [
                  { index: true, element: <WorkersPage /> },
                  { path: ':id', element: <WorkerDetailPage /> },
                ],
              },
              { path: 'users', element: <RequireRole roles={[Admin]} />, children: [{ index: true, element: <UsersPage /> }] },

              { path: 'settings', element: <SettingsPage /> },
              { path: 'notifications', element: <NotificationsPage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
])
