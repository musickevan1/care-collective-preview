'use client'

import { useState, useEffect, ReactElement } from 'react'
import { PrivacyDashboard } from '@/components/privacy/PrivacyDashboard'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function PrivacySettingsPage(): ReactElement {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        window.location.href = '/login?redirectTo=/settings/privacy'
        return
      }

      setUserId(user.id)
      setLoading(false)
    }

    getUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        Unable to load privacy settings. Please try logging in again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Privacy Settings</h2>
        <p className="text-muted-foreground">
          Control how your information is shared and manage your data
        </p>
      </div>

      <PrivacyDashboard userId={userId} />
    </div>
  )
}
