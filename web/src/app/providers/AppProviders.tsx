import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { queryClient } from '@/shared/api/queryClient'
import { useTheme } from '@/shared/hooks'
import { TooltipProvider } from '@/shared/ui'

export function AppProviders({ children }: { children: ReactNode }) {
  const { resolved } = useTheme()
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster
          theme={resolved}
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
