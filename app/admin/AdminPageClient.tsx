'use client'

import { ReactElement, ReactNode } from 'react'
import { PlatformLayout } from '@/components/layout/PlatformLayout'

interface AdminPageClientProps {
  children: ReactNode
  user: {
    id: string
    name: string
    email: string
    isAdmin: boolean
  }
}

/**
 * Client wrapper for admin pages to use PlatformLayout navigation
 */
export function AdminPageClient({ children, user }: AdminPageClientProps): ReactElement {
  return (
    <PlatformLayout user={user}>
      {children}
    </PlatformLayout>
  )
}
