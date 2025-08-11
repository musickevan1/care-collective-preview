'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface AdminRequestActionsProps {
  request: any
}

export function AdminRequestActions({ request }: AdminRequestActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    
    const updateData: any = { status: newStatus }
    const now = new Date().toISOString()
    
    // Add timestamps based on status
    switch (newStatus) {
      case 'in_progress':
        updateData.helped_at = now
        break
      case 'completed':
        updateData.completed_at = now
        if (!request.helped_at) {
          updateData.helped_at = now
        }
        break
      case 'cancelled':
        updateData.cancelled_at = now
        updateData.cancel_reason = 'Cancelled by admin'
        break
      case 'closed':
        updateData.cancelled_at = now
        updateData.cancel_reason = 'Closed by admin'
        break
    }
    
    const { error } = await supabase
      .from('help_requests')
      .update(updateData)
      .eq('id', request.id)
    
    if (error) {
      console.error('Error updating request:', error)
      alert('Failed to update request status')
    } else {
      // Log admin action
      await logAdminAction('status_change', request.id, { status: request.status }, { status: newStatus })
      router.refresh()
    }
    
    setLoading(false)
  }

  const logAdminAction = async (action: string, entityId: string, oldValues: any, newValues: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action,
        entity_type: 'help_request',
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        metadata: { timestamp: new Date().toISOString() }
      })
    } catch (error) {
      console.error('Failed to log admin action:', error)
    }
  }

  const handleDelete = async () => {
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
      await logAdminAction('delete', request.id, request, null)
      router.refresh()
    }
    
    setLoading(false)
  }

  const getStatusActions = () => {
    const actions = []
    
    switch (request.status) {
      case 'open':
        actions.push(
          <Button
            key="in_progress"
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('in_progress')}
            disabled={loading}
          >
            Mark In Progress
          </Button>
        )
        actions.push(
          <Button
            key="completed"
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('completed')}
            disabled={loading}
          >
            Mark Completed
          </Button>
        )
        actions.push(
          <Button
            key="cancelled"
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('cancelled')}
            disabled={loading}
          >
            Cancel
          </Button>
        )
        break
        
      case 'in_progress':
        actions.push(
          <Button
            key="completed"
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('completed')}
            disabled={loading}
          >
            Mark Completed
          </Button>
        )
        actions.push(
          <Button
            key="open"
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('open')}
            disabled={loading}
          >
            Reopen
          </Button>
        )
        break
        
      case 'completed':
      case 'cancelled':
      case 'closed':
        actions.push(
          <Button
            key="open"
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('open')}
            disabled={loading}
          >
            Reopen
          </Button>
        )
        break
    }
    
    return actions
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`/requests/${request.id}`, '_blank')}
      >
        View
      </Button>
      
      {getStatusActions()}
      
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={loading}
      >
        Delete
      </Button>
    </div>
  )
}