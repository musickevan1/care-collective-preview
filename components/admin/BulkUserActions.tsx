'use client'

import { useState, ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Users,
  UserCheck,
  UserX,
  UserMinus,
  Shield,
  ShieldOff,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface User {
  id: string
  name: string
  email?: string
  verification_status: string | null
  is_admin: boolean
  created_at: string
}

interface BulkUserActionsProps {
  selectedUsers: User[]
  onClearSelection: () => void
  onRefresh: () => void
}

const BULK_OPERATIONS = [
  {
    value: 'bulk_user_activate',
    label: 'Activate Users',
    description: 'Approve and activate selected users',
    icon: UserCheck,
    color: 'text-green-600',
    requiresReason: false
  },
  {
    value: 'bulk_user_deactivate',
    label: 'Deactivate Users',
    description: 'Deactivate selected user accounts',
    icon: UserX,
    color: 'text-red-600',
    requiresReason: true
  },
  {
    value: 'bulk_user_suspend',
    label: 'Suspend Users',
    description: 'Temporarily suspend selected users',
    icon: UserMinus,
    color: 'text-yellow-600',
    requiresReason: true
  },
  {
    value: 'bulk_user_make_admin',
    label: 'Grant Admin Access',
    description: 'Give admin privileges to selected users',
    icon: Shield,
    color: 'text-blue-600',
    requiresReason: false
  },
  {
    value: 'bulk_user_remove_admin',
    label: 'Remove Admin Access',
    description: 'Remove admin privileges from selected users',
    icon: ShieldOff,
    color: 'text-gray-600',
    requiresReason: false
  }
] as const

interface BulkOperationResult {
  success: boolean
  operationId?: string
  summary?: {
    total: number
    successful: number
    failed: number
    successRate: number
  }
  results?: string[]
  error?: string
}

export function BulkUserActions({ selectedUsers, onClearSelection, onRefresh }: BulkUserActionsProps): ReactElement {
  const [selectedOperation, setSelectedOperation] = useState<string>('')
  const [reason, setReason] = useState('')
  const [sendNotifications, setSendNotifications] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<BulkOperationResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const selectedOperationConfig = BULK_OPERATIONS.find(op => op.value === selectedOperation)

  const handleExecute = () => {
    if (!selectedOperation || selectedUsers.length === 0) return

    // Show confirmation for destructive operations
    const destructiveOperations = ['bulk_user_deactivate', 'bulk_user_suspend', 'bulk_user_remove_admin']
    if (destructiveOperations.includes(selectedOperation)) {
      setShowConfirmDialog(true)
      return
    }

    executeOperation()
  }

  const executeOperation = async () => {
    setIsExecuting(true)
    setExecutionResult(null)
    setShowConfirmDialog(false)

    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: selectedOperation,
          userIds: selectedUsers.map(user => user.id),
          reason: reason.trim() || undefined,
          sendNotifications
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setExecutionResult({
          success: false,
          error: result.error || 'Operation failed'
        })
        return
      }

      setExecutionResult({
        success: true,
        operationId: result.operationId,
        summary: result.summary,
        results: result.results
      })

      // Clear form after successful operation
      setSelectedOperation('')
      setReason('')
      onClearSelection()
      onRefresh()

    } catch (error) {
      console.error('Bulk operation error:', error)
      setExecutionResult({
        success: false,
        error: 'Network error occurred'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const canExecute = selectedOperation && selectedUsers.length > 0 &&
    (!selectedOperationConfig?.requiresReason || reason.trim().length > 0)

  if (selectedUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk User Actions
          </CardTitle>
          <CardDescription>
            Select users from the list above to perform bulk actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No users selected</p>
            <p className="text-sm">Use the checkboxes in the user list to select users for bulk operations</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk User Actions
        </CardTitle>
        <CardDescription>
          Perform actions on {selectedUsers.length} selected user{selectedUsers.length === 1 ? '' : 's'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected Users Summary */}
        <div>
          <h4 className="font-medium mb-2">Selected Users ({selectedUsers.length})</h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {selectedUsers.map(user => (
              <Badge key={user.id} variant="secondary" className="text-xs">
                {user.name}
                {user.is_admin && <Shield className="h-3 w-3 ml-1" />}
              </Badge>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="mt-2"
          >
            Clear Selection
          </Button>
        </div>

        {/* Operation Selection */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Operation</label>
            <Select value={selectedOperation} onValueChange={setSelectedOperation}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an operation to perform" />
              </SelectTrigger>
              <SelectContent>
                {BULK_OPERATIONS.map(operation => {
                  const Icon = operation.icon
                  return (
                    <SelectItem key={operation.value} value={operation.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${operation.color}`} />
                        <div>
                          <div className="font-medium">{operation.label}</div>
                          <div className="text-xs text-muted-foreground">{operation.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Reason Field */}
          {selectedOperationConfig?.requiresReason && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for this action..."
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This reason will be included in user notifications and audit logs
              </p>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-notifications"
                checked={sendNotifications}
                onCheckedChange={(checked) => setSendNotifications(checked as boolean)}
              />
              <label htmlFor="send-notifications" className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send email notifications to affected users
              </label>
            </div>
          </div>
        </div>

        {/* Execution Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleExecute}
            disabled={!canExecute || isExecuting}
            className="flex-1"
          >
            {isExecuting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                {selectedOperationConfig?.icon && (
                  <selectedOperationConfig.icon className="h-4 w-4 mr-2" />
                )}
                Execute Operation
              </>
            )}
          </Button>
        </div>

        {/* Execution Progress */}
        {isExecuting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing {selectedUsers.length} users...</span>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* Execution Results */}
        {executionResult && (
          <Alert className={executionResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {executionResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className="flex-1">
                {executionResult.success ? (
                  <div>
                    <div className="font-medium text-green-800 mb-2">Operation completed successfully!</div>
                    {executionResult.summary && (
                      <div className="text-sm text-green-700 space-y-1">
                        <div>
                          <strong>{executionResult.summary.successful}</strong> of <strong>{executionResult.summary.total}</strong> users processed successfully
                          ({executionResult.summary.successRate}% success rate)
                        </div>
                        {executionResult.summary.failed > 0 && (
                          <div className="text-yellow-700">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            {executionResult.summary.failed} operations failed
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="font-medium text-red-800">
                    Operation failed: {executionResult.error}
                  </div>
                )}
              </AlertDescription>
            </div>

            {/* Detailed Results */}
            {executionResult.results && executionResult.results.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium">View detailed results</summary>
                <div className="mt-2 space-y-1 text-xs">
                  {executionResult.results.slice(0, 20).map((result, index) => (
                    <div key={index} className="font-mono">{result}</div>
                  ))}
                  {executionResult.results.length > 20 && (
                    <div className="text-muted-foreground">
                      ... and {executionResult.results.length - 20} more results
                    </div>
                  )}
                </div>
              </details>
            )}
          </Alert>
        )}

        {/* Warning for sensitive operations */}
        {selectedOperationConfig && ['bulk_user_deactivate', 'bulk_user_suspend', 'bulk_user_remove_admin'].includes(selectedOperation) && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action will affect user access to the platform.
              {sendNotifications && ' Users will receive email notifications about this change.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Bulk Operation
            </DialogTitle>
            <DialogDescription>
              You are about to perform <strong>{selectedOperationConfig?.label.toLowerCase()}</strong> on{' '}
              <strong>{selectedUsers.length}</strong> user{selectedUsers.length === 1 ? '' : 's'}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Affected users preview */}
            <div>
              <h4 className="font-medium text-sm mb-2">Affected users:</h4>
              <div className="max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {selectedUsers.slice(0, 10).map(user => (
                    <Badge key={user.id} variant="secondary" className="text-xs">
                      {user.name}
                    </Badge>
                  ))}
                  {selectedUsers.length > 10 && (
                    <Badge variant="secondary" className="text-xs">
                      +{selectedUsers.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Reason preview if provided */}
            {reason.trim() && (
              <div>
                <h4 className="font-medium text-sm mb-2">Reason:</h4>
                <div className="bg-muted p-3 rounded-md text-sm">
                  {reason.trim()}
                </div>
              </div>
            )}

            {/* Notification settings */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {sendNotifications ? 'Email notifications will be sent' : 'No email notifications will be sent'}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeOperation} className="bg-red-600 hover:bg-red-700">
              Confirm Operation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}