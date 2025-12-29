'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { EditRequestForm } from '@/components/help-requests/EditRequestForm'
import { Pencil } from 'lucide-react'

type HelpRequestData = {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string
  subcategory?: string | null
  urgency: string
  location_override?: string | null
  location_privacy?: string | null
  exchange_offer?: string | null
  status: string
}

interface RequestActionsProps {
  request: HelpRequestData
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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // NOTE: "Offer to Help" functionality has been moved to HelpRequestCardWithMessaging
  // to ensure proper conversation creation. This component now only handles status updates
  // for existing help relationships.

  const handleCompleteRequest = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/requests/${request.id}/complete`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to complete request')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete request. Please try again.')
      console.error('Error completing request:', err)
    }

    setLoading(false)
  }

  const handleCancelRequest = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/requests/${request.id}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel request')
      }

      router.refresh()
      router.push('/requests')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request. Please try again.')
      console.error('Error cancelling request:', err)
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

    try {
      const response = await fetch(`/api/requests/${request.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Helper withdrew from the request',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to withdraw help')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw help. Please try again.')
      console.error('Error withdrawing help:', err)
    }

    setLoading(false)
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    router.refresh()
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
              <>
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={loading}
                      variant="default"
                      className="min-h-[44px]"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Help Request</DialogTitle>
                      <DialogDescription>
                        Update the details of your help request. Changes will be visible immediately.
                      </DialogDescription>
                    </DialogHeader>
                    <EditRequestForm
                      request={request}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={loading}
                      variant="outline"
                    >
                      Cancel Request
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Help Request?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-2">
                          <p>Are you sure you want to cancel this request?</p>
                          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-destructive text-sm">
                            <strong>Warning:</strong> This will permanently remove your request from the public help board. This action cannot be undone.
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Request</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelRequest}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Yes, Cancel Request
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {request.status === 'in_progress' && (
              <>
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={loading}
                      variant="outline"
                      className="min-h-[44px]"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Help Request</DialogTitle>
                      <DialogDescription>
                        Update the details of your help request. Changes will be visible immediately.
                      </DialogDescription>
                    </DialogHeader>
                    <EditRequestForm
                      request={request}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  onClick={handleCompleteRequest}
                  disabled={loading}
                  variant="default"
                >
                  Mark as Completed
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={loading}
                      variant="outline"
                    >
                      Cancel Request
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Help Request?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-2">
                          <p>Are you sure you want to cancel this request?</p>
                          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-destructive text-sm">
                            <strong>Warning:</strong> This will permanently remove your request from the public help board. This action cannot be undone.
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Request</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelRequest}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Yes, Cancel Request
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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