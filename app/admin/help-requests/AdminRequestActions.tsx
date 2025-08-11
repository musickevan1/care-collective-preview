'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { features } from '@/lib/features'

interface AdminRequestActionsProps {
  request: any
}

export function AdminRequestActions({ request }: AdminRequestActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  // Check if admin write is enabled
  const isReadOnly = !features.previewAdmin || process.env.NEXT_PUBLIC_PREVIEW_ADMIN === '1'

  const handleStatusChange = async (newStatus: string) => {
    if (isReadOnly) {
      alert('Admin write capabilities are disabled in preview mode')
      return
    }
    
    setLoading(true)
    
    const updateData: any = { status: newStatus }
    
    // Add timestamps based on status
    if (newStatus === 'closed') {
      updateData.cancelled_at = new Date().toISOString()
      updateData.cancel_reason = 'Closed by admin'
    }
    
    const { error } = await supabase
      .from('help_requests')
      .update(updateData)
      .eq('id', request.id)
    
    if (error) {
      console.error('Error updating request:', error)
      alert('Failed to update request status')
    } else {
      router.refresh()
    }
    
    setLoading(false)
  }

  const handleDelete = async () => {
    if (isReadOnly) {
      alert('Admin write capabilities are disabled in preview mode')
      return
    }
    
    if (!confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      return
    }
    
    setLoading(true)
    
    const { error } = await supabase
      .from('help_requests')
      .delete()
      .eq('id', request.id)
    
    if (error) {
      console.error('Error deleting request:', error)
      alert('Failed to delete request')
    } else {
      router.refresh()
    }
    
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`/requests/${request.id}`, '_blank')}
      >
        View
      </Button>
      
      {request.status === 'open' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange('closed')}
          disabled={loading || isReadOnly}
        >
          Close
        </Button>
      )}
      
      {request.status !== 'open' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange('open')}
          disabled={loading || isReadOnly}
        >
          Reopen
        </Button>
      )}
      
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={loading || isReadOnly}
      >
        {isReadOnly ? 'Delete (Preview)' : 'Delete'}
      </Button>
    </div>
  )
}