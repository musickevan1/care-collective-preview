'use client'

import React, { ReactElement, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type HelpRequest = Database['public']['Tables']['help_requests']['Row'] & {
  profiles?: Profile
}
type ContactExchange = Database['public']['Tables']['contact_exchanges']['Row']
type Message = Database['public']['Tables']['messages']['Row']

interface UserDetailModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

interface UserActivity {
  helpRequestsCreated: HelpRequest[]
  helpRequestsHelped: HelpRequest[]
  contactExchanges: ContactExchange[]
  messages: Message[]
  loading: boolean
  error: string | null
}

function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 30) {
    return `${diffInDays} days ago`
  } else {
    return `${Math.floor(diffInDays / 30)} months ago`
  }
}

export function UserDetailModal({ userId, isOpen, onClose }: UserDetailModalProps): ReactElement {
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [userActivity, setUserActivity] = useState<UserActivity>({
    helpRequestsCreated: [],
    helpRequestsHelped: [],
    contactExchanges: [],
    messages: [],
    loading: false,
    error: null
  })

  useEffect(() => {
    if (!userId || !isOpen) {
      return
    }

    const fetchUserDetails = async () => {
      setUserActivity(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        // Fetch user profile and activity data
        const response = await fetch(`/api/admin/users/${userId}/details`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch user details')
        }
        
        const data = await response.json()
        setUserProfile(data.profile)
        setUserActivity(prev => ({
          ...prev,
          helpRequestsCreated: data.helpRequestsCreated || [],
          helpRequestsHelped: data.helpRequestsHelped || [],
          contactExchanges: data.contactExchanges || [],
          messages: data.messages || [],
          loading: false
        }))
      } catch (error) {
        console.error('Error fetching user details:', error)
        setUserActivity(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load user details'
        }))
      }
    }

    fetchUserDetails()
  }, [userId, isOpen])

  if (!userId) {
    return <div />
  }

  const getVerificationStatusBadge = (status: string) => {
    const config = {
      pending: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      approved: { className: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' }
    }[status] || { className: 'bg-gray-100 text-gray-800 border-gray-200', label: status }
    
    return (
      <Badge className={`${config.className} font-medium`}>
        {config.label}
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
              {(userProfile?.name || 'U').charAt(0).toUpperCase()}
            </div>
            {userProfile?.name || 'Loading...'}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Community member details and activity history
          </DialogDescription>
        </DialogHeader>

        {userActivity.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading user details...</div>
          </div>
        ) : userActivity.error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Error loading user details</div>
            <div className="text-gray-500 text-sm">{userActivity.error}</div>
          </div>
        ) : userProfile ? (
          <div className="space-y-6">
            {/* User Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  👤 Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <div className="text-gray-900">{userProfile.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <div className="text-gray-900">{userProfile.location || 'Not specified'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Member Since</label>
                    <div className="text-gray-900">{formatTimeAgo(userProfile.created_at)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Verification Status</label>
                    <div className="mt-1">
                      {getVerificationStatusBadge(userProfile.verification_status)}
                    </div>
                  </div>
                  {userProfile.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <div className="text-gray-900">{userProfile.phone}</div>
                    </div>
                  )}
                  {userProfile.is_admin && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Role</label>
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-medium">
                        Administrator
                      </Badge>
                    </div>
                  )}
                </div>
                {userProfile.application_reason && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Application Reason</label>
                    <div className="text-gray-900 text-sm bg-gray-50 p-3 rounded mt-1">
                      {userProfile.application_reason}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Requests Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-dusty-rose-accessible">
                    {userActivity.helpRequestsCreated.length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Help Provided</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-sage-accessible">
                    {userActivity.helpRequestsHelped.length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Contact Exchanges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-terracotta">
                    {userActivity.contactExchanges.length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Messages Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {userActivity.messages.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Help Requests Created */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📋 Help Requests Created ({userActivity.helpRequestsCreated.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userActivity.helpRequestsCreated.length > 0 ? (
                  <div className="space-y-3">
                    {userActivity.helpRequestsCreated.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{request.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTimeAgo(request.created_at)} • {request.category}
                          </div>
                        </div>
                        <StatusBadge status={request.status as any} />
                      </div>
                    ))}
                    {userActivity.helpRequestsCreated.length > 5 && (
                      <div className="text-center text-sm text-gray-500 pt-2">
                        And {userActivity.helpRequestsCreated.length - 5} more requests...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No help requests created yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help Provided */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🤝 Help Provided ({userActivity.helpRequestsHelped.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userActivity.helpRequestsHelped.length > 0 ? (
                  <div className="space-y-3">
                    {userActivity.helpRequestsHelped.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{request.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Helped on {formatTimeAgo(request.helped_at || request.updated_at || '')} • {request.category}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          Helper
                        </Badge>
                      </div>
                    ))}
                    {userActivity.helpRequestsHelped.length > 5 && (
                      <div className="text-center text-sm text-gray-500 pt-2">
                        And {userActivity.helpRequestsHelped.length - 5} more helped requests...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No help provided yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            User not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}