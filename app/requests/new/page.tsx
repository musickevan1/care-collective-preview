'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'

const categories = [
  { value: 'groceries', label: 'Groceries & Shopping', icon: '🛒' },
  { value: 'transport', label: 'Transportation', icon: '🚗' },
  { value: 'household', label: 'Household Tasks', icon: '🏠' },
  { value: 'medical', label: 'Medical & Pharmacy', icon: '💊' },
  { value: 'meals', label: 'Meal Preparation', icon: '🍽️' },
  { value: 'childcare', label: 'Childcare & Family', icon: '👶' },
  { value: 'petcare', label: 'Pet Care', icon: '🐾' },
  { value: 'technology', label: 'Technology Help', icon: '💻' },
  { value: 'companionship', label: 'Companionship', icon: '👥' },
  { value: 'respite', label: 'Respite Care', icon: '💆' },
  { value: 'emotional', label: 'Emotional Support', icon: '💝' },
  { value: 'other', label: 'Other', icon: '📋' },
]

const urgencyLevels = [
  { value: 'normal', label: 'Normal - Can wait a few days' },
  { value: 'urgent', label: 'Urgent - Needed within 24 hours' },
  { value: 'critical', label: 'Critical - Emergency assistance needed' },
]

export default function NewRequestPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [locationOverride, setLocationOverride] = useState('')
  const [locationPrivacy, setLocationPrivacy] = useState('public')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [messagingData, setMessagingData] = useState({ unreadCount: 0, activeConversations: 0 })

  const router = useRouter()
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('User not authenticated, redirecting to login')
      router.push(`/login?redirectTo=${encodeURIComponent('/requests/new')}`)
    }
  }, [user, authLoading, router])

  // Fetch messaging data
  useEffect(() => {
    if (user) {
      const fetchMessagingData = async () => {
        try {
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact' })
            .eq('recipient_id', user.id)
            .is('read_at', null);

          const { data: conversations } = await supabase
            .from('conversations')
            .select(`
              id,
              conversation_participants!inner (
                user_id
              )
            `)
            .eq('conversation_participants.user_id', user.id)
            .is('conversation_participants.left_at', null);

          setMessagingData({
            unreadCount: unreadCount || 0,
            activeConversations: conversations?.length || 0
          });
        } catch (error) {
          console.error('Error fetching messaging data:', error);
        }
      };

      fetchMessagingData();
    }
  }, [user, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!user) {
        setError('You must be logged in to create a request')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('help_requests')
        .insert({
          title,
          description: description || null,
          category,
          urgency,
          user_id: user.id,
          location_override: locationOverride || null,
          location_privacy: locationPrivacy,
        })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
      
    } catch (err) {
      console.error('Request creation error:', err)
      setError('Failed to create request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <PlatformLayout user={null} messagingData={messagingData}>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PlatformLayout>
    )
  }

  // Show error state if not authenticated (fallback)
  if (!user) {
    return (
      <PlatformLayout user={null} messagingData={messagingData}>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground mb-2">Authentication Required</p>
                <p className="text-sm text-muted-foreground mb-4">
                  You must be logged in to create a help request.
                </p>
                <Link href="/login">
                  <Button>Go to Login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PlatformLayout>
    )
  }

  const breadcrumbs = [
    { label: 'Help Requests', href: '/requests' },
    { label: 'New Request' }
  ];

  return (
    <PlatformLayout 
      user={user} 
      messagingData={messagingData}
      breadcrumbs={breadcrumbs}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Create Help Request</h1>
            <p className="text-muted-foreground">Let the community know how they can help you</p>
          </div>
          <Link href="/requests">
            <Button variant="outline">
              ← Back to Requests
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Fill out the form below to let others know how they can help you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-foreground">
                  Request Title *
                </label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you need help with?"
                  required
                  disabled={loading}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Be clear and specific. For example: &quot;Need groceries picked up&quot; or &quot;Help moving furniture&quot;
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium text-foreground">
                  Category *
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-foreground">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide more details about what you need help with..."
                  disabled={loading}
                  rows={4}
                  maxLength={500}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Include any specific requirements, timing, or other helpful details
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Urgency Level *
                </label>
                <div className="space-y-3">
                  {urgencyLevels.map((level) => (
                    <label key={level.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="urgency"
                        value={level.value}
                        checked={urgency === level.value}
                        onChange={(e) => setUrgency(e.target.value)}
                        disabled={loading}
                        className="w-5 h-5 sm:w-4 sm:h-4 text-primary accent-primary flex-shrink-0"
                      />
                      <div>
                        <div className="text-sm font-medium text-foreground capitalize">{level.value}</div>
                        <div className="text-xs text-muted-foreground">{level.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium text-foreground">
                  Location for This Request (Optional)
                </label>
                <Input
                  id="location"
                  type="text"
                  value={locationOverride}
                  onChange={(e) => setLocationOverride(e.target.value)}
                  placeholder="e.g., Downtown, ZIP 65802, or specific address"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Override your profile location for this specific request if needed
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Who Can See the Location?
                </label>
                <select
                  value={locationPrivacy}
                  onChange={(e) => setLocationPrivacy(e.target.value)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="public">Everyone (Public)</option>
                  <option value="helpers_only">Only People Who Offer Help</option>
                  <option value="after_match">Only After I Accept Help</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Control who can see your location information
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Link href="/requests" className="flex-1">
                  <Button type="button" variant="outline" className="w-full" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={loading || !title || !category}>
                  {loading ? 'Creating...' : 'Create Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </PlatformLayout>
  )
}