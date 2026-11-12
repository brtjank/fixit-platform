import { Outlet } from 'react-router'
import { LanguageSwitcher } from '@/shared/ui'

export function AuthLayout() {
  return (
    <div className="relative min-h-full bg-bg">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      <Outlet />
    </div>
  )
}
