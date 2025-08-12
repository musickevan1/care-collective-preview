'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

const categories = [
  { value: 'groceries', label: 'Groceries & Shopping' },
  { value: 'transport', label: 'Transportation' },
  { value: 'household', label: 'Household Tasks' },
  { value: 'medical', label: 'Medical Assistance' },
  { value: 'other', label: 'Other' },
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    
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
      })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link href="/requests" className="inline-block">
              <Button variant="ghost" size="sm">
                ← Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Create Help Request</h1>
              <p className="text-xs sm:text-sm text-secondary-foreground/70">Let the community know how they can help you</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
    </main>
  )
}