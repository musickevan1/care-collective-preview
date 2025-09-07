'use client'

import React, { ReactElement, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Database } from '@/lib/database.types'
import { ChevronDown, UserCheck, UserX, Shield, Eye, MessageSquare } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UserActionDropdownProps {
  user: Profile
  onViewDetails: (userId: string) => void
  onUserUpdate?: () => void
}

interface ActionDialogState {
  type: 'approve' | 'reject' | 'deactivate' | 'admin' | null
  user: Profile | null
}

export function UserActionDropdown({ user, onViewDetails, onUserUpdate }: UserActionDropdownProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({ type: null, user: null })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = async (action: string, userId: string, data?: any) => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      })

      if (!response.ok) {
        throw new Error('Failed to perform action')
      }

      onUserUpdate?.()
      setActionDialog({ type: null, user: null })
    } catch (error) {
      console.error('Action failed:', error)
      // In a real app, you'd show a toast notification here
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmAction = (type: ActionDialogState['type'], user: Profile) => {
    setActionDialog({ type, user })
  }

  const ActionButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    variant = 'ghost' as any, 
    disabled = false 
  }: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: () => void
    variant?: any
    disabled?: boolean
  }) => (
    <Button
      variant={variant}
      size="sm"
      className="w-full justify-start text-left"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </Button>
  )

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1"
        >
          Actions
          <ChevronDown className="w-3 h-3" />
        </Button>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
            <div className="p-1 space-y-1">
              <ActionButton
                icon={Eye}
                label="View Details"
                onClick={() => {
                  onViewDetails(user.id)
                  setIsOpen(false)
                }}
              />
              
              {user.verification_status === 'pending' && (
                <>
                  <ActionButton
                    icon={UserCheck}
                    label="Approve User"
                    variant="ghost"
                    onClick={() => {
                      confirmAction('approve', user)
                      setIsOpen(false)
                    }}
                  />
                  <ActionButton
                    icon={UserX}
                    label="Reject User"
                    variant="ghost"
                    onClick={() => {
                      confirmAction('reject', user)
                      setIsOpen(false)
                    }}
                  />
                </>
              )}
              
              {user.verification_status === 'approved' && (
                <ActionButton
                  icon={UserX}
                  label="Deactivate User"
                  variant="ghost"
                  onClick={() => {
                    confirmAction('deactivate', user)
                    setIsOpen(false)
                  }}
                />
              )}
              
              {!user.is_admin && (
                <ActionButton
                  icon={Shield}
                  label="Make Admin"
                  variant="ghost"
                  onClick={() => {
                    confirmAction('admin', user)
                    setIsOpen(false)
                  }}
                />
              )}
              
              <ActionButton
                icon={MessageSquare}
                label="Send Message"
                variant="ghost"
                onClick={() => {
                  // TODO: Implement messaging functionality
                  setIsOpen(false)
                }}
                disabled={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Confirmation Dialogs */}
      <Dialog 
        open={actionDialog.type !== null} 
        onOpenChange={() => setActionDialog({ type: null, user: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' && 'Approve User'}
              {actionDialog.type === 'reject' && 'Reject User'}
              {actionDialog.type === 'deactivate' && 'Deactivate User'}
              {actionDialog.type === 'admin' && 'Make Administrator'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'approve' && 
                `Are you sure you want to approve ${actionDialog.user?.name}? They will gain full access to the platform.`
              }
              {actionDialog.type === 'reject' && 
                `Are you sure you want to reject ${actionDialog.user?.name}'s application? This action cannot be undone.`
              }
              {actionDialog.type === 'deactivate' && 
                `Are you sure you want to deactivate ${actionDialog.user?.name}? They will lose access to the platform.`
              }
              {actionDialog.type === 'admin' && 
                `Are you sure you want to make ${actionDialog.user?.name} an administrator? They will have full admin access.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ type: null, user: null })}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.type === 'reject' || actionDialog.type === 'deactivate' ? 'destructive' : 'default'}
              onClick={() => {
                if (actionDialog.user && actionDialog.type) {
                  handleAction(actionDialog.type, actionDialog.user.id)
                }
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Click outside to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}