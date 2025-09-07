'use client'

import React, { ReactElement, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserDetailModal } from '@/components/admin/UserDetailModal'
import { UserActionDropdown } from '@/components/admin/UserActionDropdown'
import Link from 'next/link'
import Image from 'next/image'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

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

interface UsersPageState {
  users: Profile[]
  loading: boolean
  error: string | null
  selectedUserId: string | null
  searchTerm: string
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected'
}

export default function UsersPage(): ReactElement {
  const [state, setState] = useState<UsersPageState>({
    users: [],
    loading: true,
    error: null,
    selectedUserId: null,
    searchTerm: '',
    filterStatus: 'all'
  })

  const fetchUsers = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      setState(prev => ({ ...prev, users: data.users, loading: false }))
    } catch (error) {
      console.error('Error fetching users:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load users'
      }))
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users based on search and status filter
  const filteredUsers = state.users.filter(user => {
    const matchesSearch = state.searchTerm === '' || 
      user.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (user.location && user.location.toLowerCase().includes(state.searchTerm.toLowerCase()))
    
    const matchesStatus = state.filterStatus === 'all' || user.verification_status === state.filterStatus
    
    return matchesSearch && matchesStatus
  })

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
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link href="/admin" className="inline-block">
              <Button variant="ghost" size="sm">
                ← Back
              </Button>
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">User Management</h1>
              <p className="text-xs sm:text-sm text-secondary-foreground/70">Manage community members (Preview - Read Only)</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Admin Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-green-900 mb-1 sm:mb-2">🛡️ User Management Panel</h2>
          <p className="text-sm sm:text-base text-green-800">
            Full administrative capabilities: manage user verification, view detailed activity, and perform user actions.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or location..."
              value={state.searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-sage"
            />
          </div>
          <select
            value={state.filterStatus}
            onChange={(e) => setState(prev => ({ ...prev, filterStatus: e.target.value as any }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-sage"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Community Members ({state.users?.length || 0})</CardTitle>
            <CardDescription>
              All registered users in the CARE Collective
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading users...</div>
              </div>
            ) : state.error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">Error loading users</div>
                <div className="text-gray-500 text-sm">{state.error}</div>
                <Button 
                  onClick={() => fetchUsers()} 
                  className="mt-4"
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 sm:p-5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow gap-4"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-semibold text-sm sm:text-base">
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {user.name || 'No name set'}
                          </h3>
                          {getVerificationStatusBadge(user.verification_status)}
                          {user.is_admin && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-medium">
                              Admin
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-2">
                          {user.location && (
                            <span className="whitespace-nowrap flex items-center gap-1">
                              <span className="text-gray-400">📍</span>
                              <span>{user.location}</span>
                            </span>
                          )}
                          
                          <span className="whitespace-nowrap flex items-center gap-1">
                            <span className="text-gray-400">📅</span>
                            <span>{formatTimeAgo(user.created_at)}</span>
                          </span>
                          
                          {user.phone && (
                            <span className="whitespace-nowrap flex items-center gap-1">
                              <span className="text-gray-400">📞</span>
                              <span>{user.phone}</span>
                            </span>
                          )}
                        </div>
                        
                        {user.application_reason && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded text-ellipsis overflow-hidden">
                            <span className="font-medium">Reason:</span> {user.application_reason.substring(0, 100)}{user.application_reason.length > 100 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setState(prev => ({ ...prev, selectedUserId: user.id }))}
                        className="text-xs sm:text-sm"
                      >
                        View Details
                      </Button>
                      <UserActionDropdown 
                        user={user} 
                        onViewDetails={(userId) => setState(prev => ({ ...prev, selectedUserId: userId }))}
                        onUserUpdate={fetchUsers}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {state.searchTerm || state.filterStatus !== 'all' ? 'No users match your criteria' : 'No users found'}
                </h3>
                <p className="text-gray-600">
                  {state.searchTerm || state.filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter settings.' 
                    : 'No users have registered yet.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{state.users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {state.users.filter(u => u.verification_status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {state.users.filter(u => u.verification_status === 'approved').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {state.users.filter(u => u.is_admin).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Detail Modal */}
        <UserDetailModal 
          userId={state.selectedUserId}
          isOpen={state.selectedUserId !== null}
          onClose={() => setState(prev => ({ ...prev, selectedUserId: null }))}
        />
      </div>
    </main>
  )
}