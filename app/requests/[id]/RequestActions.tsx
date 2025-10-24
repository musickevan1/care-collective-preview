'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type HelpRequest = Database['public']['Tables']['help_requests']['Row']

interface RequestActionsProps {
  request: HelpRequest
  userId: string
  isOwner: boolean
  isHelper: boolean
  canHelp: boolean
  canUpdateStatus: boolean
}

export function RequestActions({
  request,
  userId,
  isOwner,
  isHelper,
  canHelp
}: RequestActionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // NOTE: "Offer to Help" functionality has been moved to HelpRequestCardWithMessaging
  // to ensure proper conversation creation. This component now only handles status updates
  // for existing help relationships.

  const handleCompleteRequest = async () => {
    setLoading(true)
    setError(null)
    
    const { error } = await supabase
      .from('help_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', request.id)
    
    if (error) {
      setError('Failed to complete request. Please try again.')
      console.error('Error completing request:', error)
    } else {
      router.refresh()
    }
    
    setLoading(false)
  }

  const handleCancelRequest = async () => {
    const reason = prompt('Please provide a reason for cancellation (optional):')
    
    setLoading(true)
    setError(null)
    
    const { error } = await supabase
      .from('help_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason || null
      })
      .eq('id', request.id)
    
    if (error) {
      setError('Failed to cancel request. Please try again.')
      console.error('Error cancelling request:', error)
    } else {
      router.refresh()
    }
    
    setLoading(false)
  }

  const handleReopenRequest = async () => {
    setLoading(true)
    setError(null)
    
    const { error } = await supabase
      .from('help_requests')
      .update({
        status: 'open',
        helper_id: null,
        helped_at: null,
        completed_at: null,
        cancelled_at: null,
        cancel_reason: null
      })
      .eq('id', request.id)
    
    if (error) {
      setError('Failed to reopen request. Please try again.')
      console.error('Error reopening request:', error)
    } else {
      router.refresh()
    }
    
    setLoading(false)
  }

  const handleWithdrawHelp = async () => {
    setLoading(true)
    setError(null)
    
    const { error } = await supabase
      .from('help_requests')
      .update({
        status: 'open',
        helper_id: null,
        helped_at: null
      })
      .eq('id', request.id)
    
    if (error) {
      setError('Failed to withdraw help. Please try again.')
      console.error('Error withdrawing help:', error)
    } else {
      router.refresh()
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-wrap gap-3">
        {/* "Offer to Help" button removed - use HelpRequestCardWithMessaging instead */}
        {/* This ensures proper conversation creation through the messaging system */}

        {/* Helper actions */}
        {isHelper && request.status === 'in_progress' && (
          <>
            <Button 
              onClick={handleCompleteRequest}
              disabled={loading}
              variant="default"
            >
              Mark as Completed
            </Button>
            <Button 
              onClick={handleWithdrawHelp}
              disabled={loading}
              variant="outline"
            >
              Withdraw Help
            </Button>
          </>
        )}

        {/* Owner actions */}
        {isOwner && (
          <>
            {request.status === 'open' && (
              <Button 
                onClick={handleCancelRequest}
                disabled={loading}
                variant="outline"
              >
                Cancel Request
              </Button>
            )}
            
            {request.status === 'in_progress' && (
              <>
                <Button 
                  onClick={handleCompleteRequest}
                  disabled={loading}
                  variant="default"
                >
                  Mark as Completed
                </Button>
                <Button 
                  onClick={handleCancelRequest}
                  disabled={loading}
                  variant="outline"
                >
                  Cancel Request
                </Button>
              </>
            )}
            
            {(request.status === 'completed' || request.status === 'cancelled') && (
              <Button 
                onClick={handleReopenRequest}
                disabled={loading}
                variant="outline"
              >
                Reopen Request
              </Button>
            )}
          </>
        )}
      </div>

      {/* Status explanations */}
      <div className="text-sm text-muted-foreground">
        {request.status === 'open' && !isOwner && canHelp && (
          <p>To offer help, use the &quot;Offer Help&quot; button on the request card above to start a conversation.</p>
        )}
        {request.status === 'open' && !isOwner && !canHelp && (
          <p>This request is open for helpers to offer assistance.</p>
        )}
        {request.status === 'in_progress' && !isOwner && !isHelper && (
          <p>Someone is already helping with this request.</p>
        )}
        {request.status === 'completed' && (
          <p>This request has been completed successfully.</p>
        )}
        {request.status === 'cancelled' && (
          <p>This request has been cancelled by the requester.</p>
        )}
      </div>
    </div>
  )
}