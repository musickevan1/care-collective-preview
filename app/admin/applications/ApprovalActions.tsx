'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { ReactElement } from 'react'

interface ApprovalActionsProps {
  userId: string
  userName: string
}

export function ApprovalActions({ userId, userName }: ApprovalActionsProps): ReactElement {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const supabase = createClient()

  const handleApproval = async (action: 'approve' | 'reject') => {
    setLoading(true)
    setError('')

    try {
      const updateData: any = {
        verification_status: action === 'approve' ? 'approved' : 'rejected',
        [`${action === 'approve' ? 'approved' : 'rejected'}_at`]: new Date().toISOString()
      }

      if (action === 'reject' && rejectionReason.trim()) {
        updateData.rejection_reason = rejectionReason.trim()
      }

      if (action === 'approve') {
        updateData.rejection_reason = null // Clear any previous rejection reason
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        setError(`Failed to ${action} user: ${error.message}`)
        console.error(`Error ${action}ing user:`, error)
      } else {
        // If approving, trigger email confirmation for the user
        if (action === 'approve') {
          try {
            // Get user email and trigger confirmation
            const { data: userData } = await supabase.auth.admin.getUserById(userId)
            if (userData?.user?.email) {
              // In production, this would trigger Supabase's email confirmation
              // For now, we'll mark it in our notification system
              console.log(`Email confirmation will be sent to: ${userData.user.email}`)
            }
          } catch (confirmError) {
            console.warn('Could not trigger email confirmation:', confirmError)
          }
        }
        
        // Send notification email about status change
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'status_change',
              userId: userId,
              adminAction: action
            })
          })
        } catch (notifyError) {
          console.warn('Failed to send notification email:', notifyError)
          // Don't fail the approval process if email fails
        }
        
        // Refresh the page to show updated status
        window.location.reload()
      }
    } catch (err) {
      setError(`An unexpected error occurred while ${action}ing the user.`)
      console.error(`Unexpected error ${action}ing user:`, err)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection.')
      return
    }
    handleApproval('reject')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
      {error && (
        <div className="text-xs text-red-600 mb-2 sm:hidden">
          {error}
        </div>
      )}
      
      <Button
        onClick={() => handleApproval('approve')}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white"
        size="sm"
      >
        {loading ? 'Processing...' : 'Approve'}
      </Button>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            disabled={loading}
            size="sm"
          >
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              You are about to reject {userName}&apos;s application to join Care Collective.
              Please provide a reason that will help them understand the decision.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="rejectionReason" className="text-sm font-medium">
                Reason for rejection *
              </label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this application is being rejected. This will help the user understand what they can improve for a future application."
                rows={4}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                This message will be shown to the user so they can reapply with improvements.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false)
                  setRejectionReason('')
                  setError('')
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
              >
                {loading ? 'Rejecting...' : 'Reject Application'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="hidden sm:block text-xs text-red-600 mt-1">
          {error}
        </div>
      )}
    </div>
  )
}