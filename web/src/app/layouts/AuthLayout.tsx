import { Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div className="min-h-full bg-bg">
      <Outlet />
    </div>
  )
}
