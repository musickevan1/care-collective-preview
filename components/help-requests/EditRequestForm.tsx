'use client'

import { useState } from 'react'
import { ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface HelpRequest {
  id: string
  title: string
  description?: string | null
  category: string
  subcategory?: string | null
  urgency: string
  location_override?: string | null
  location_privacy?: string | null
  exchange_offer?: string | null
  status: string
}

interface EditRequestFormProps {
  request: HelpRequest
  onSuccess?: () => void
  onCancel?: () => void
}

const categories = [
  { value: 'groceries', label: 'Groceries & Food' },
  { value: 'transport', label: 'Transportation' },
  { value: 'household', label: 'Household Tasks' },
  { value: 'medical', label: 'Medical Support' },
  { value: 'other', label: 'Other' }
]

const urgencyLevels = [
  { value: 'normal', label: 'Normal', description: 'Can wait a few days' },
  { value: 'urgent', label: 'Urgent', description: 'Needed within 24-48 hours' },
  { value: 'critical', label: 'Critical', description: 'Immediate need' }
]

const locationPrivacyOptions = [
  { value: 'public', label: 'Public', description: 'Show to everyone' },
  { value: 'helpers_only', label: 'Helpers Only', description: 'Show only to those who offer help' },
  { value: 'after_match', label: 'After Match', description: 'Show only after accepting help' }
]

export function EditRequestForm({ request, onSuccess, onCancel }: EditRequestFormProps): ReactElement {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nothingToOffer, setNothingToOffer] = useState(!request.exchange_offer)

  // Form state initialized with existing request data
  const [formData, setFormData] = useState({
    title: request.title,
    description: request.description || '',
    category: request.category || '',
    subcategory: request.subcategory || '',
    urgency: request.urgency,
    location_override: request.location_override || '',
    location_privacy: request.location_privacy || 'public',
    exchange_offer: request.exchange_offer || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Only send changed fields
      const changes: Record<string, unknown> = {}
      let hasChanges = false

      if (formData.title !== request.title) {
        changes.title = formData.title
        hasChanges = true
      }
      if (formData.description !== (request.description || '')) {
        changes.description = formData.description
        hasChanges = true
      }
      if (formData.category !== request.category) {
        changes.category = formData.category
        hasChanges = true
      }
      if (formData.subcategory !== (request.subcategory || '')) {
        changes.subcategory = formData.subcategory
        hasChanges = true
      }
      if (formData.urgency !== request.urgency) {
        changes.urgency = formData.urgency
        hasChanges = true
      }
      if (formData.location_override !== (request.location_override || '')) {
        changes.location_override = formData.location_override
        hasChanges = true
      }
      if (formData.location_privacy !== (request.location_privacy || 'public')) {
        changes.location_privacy = formData.location_privacy
        hasChanges = true
      }
      // Handle exchange_offer - if nothingToOffer is checked, we send null/empty
      const newExchangeOffer = nothingToOffer ? '' : formData.exchange_offer
      if (newExchangeOffer !== (request.exchange_offer || '')) {
        changes.exchange_offer = newExchangeOffer || null
        hasChanges = true
      }

      if (!hasChanges) {
        setError('No changes detected')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/requests/${request.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.userMessage || data.error || 'Failed to update request')
      }

      // Success!
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
        router.push(`/requests/${request.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Request Title *
        </label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of what you need help with"
          required
          minLength={5}
          maxLength={100}
          disabled={loading}
          className="min-h-[44px]"
        />
        <p className="text-xs text-muted-foreground">
          5-100 characters
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium text-foreground">
          Category *
        </label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
          disabled={loading}
        >
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="subcategory" className="text-sm font-medium text-foreground">
          Subcategory <span className="text-muted-foreground">(Optional)</span>
        </label>
        <Input
          id="subcategory"
          value={formData.subcategory}
          onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
          placeholder="e.g., Grocery shopping, Prescription pickup"
          maxLength={100}
          disabled={loading}
          className="min-h-[44px]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Additional Details <span className="text-muted-foreground">(Optional)</span>
        </label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Any additional information that would help someone assist you..."
          maxLength={500}
          rows={4}
          disabled={loading}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Exchange Offer Section - Mutual Aid Reciprocity */}
      <div className="space-y-3 p-4 bg-sage/5 border border-sage/20 rounded-lg">
        <div>
          <label htmlFor="exchange_offer" className="text-sm font-medium text-foreground">
            What Can You Offer in Exchange? <span className="text-muted-foreground">(Optional)</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Mutual aid is about community members supporting each other.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={nothingToOffer}
            onChange={(e) => {
              setNothingToOffer(e.target.checked)
              if (e.target.checked) {
                setFormData({ ...formData, exchange_offer: '' })
              }
            }}
            disabled={loading}
            className="w-5 h-5 sm:w-4 sm:h-4 text-primary accent-primary flex-shrink-0 mt-0.5"
          />
          <div>
            <div className="text-sm font-medium text-foreground">I don&apos;t have anything to exchange right now</div>
            <div className="text-xs text-muted-foreground">
              That&apos;s completely okay
            </div>
          </div>
        </label>

        {!nothingToOffer && (
          <div className="space-y-2">
            <Textarea
              id="exchange_offer"
              value={formData.exchange_offer}
              onChange={(e) => setFormData({ ...formData, exchange_offer: e.target.value })}
              placeholder="e.g., Fresh tomatoes from my garden, can help with computer questions..."
              maxLength={300}
              rows={3}
              disabled={loading}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Share what you can - skills, produce, favors
              </p>
              <span className="text-xs text-muted-foreground">{formData.exchange_offer.length}/300</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="urgency" className="text-sm font-medium text-foreground">
          Urgency Level *
        </label>
        <Select
          value={formData.urgency}
          onValueChange={(value) => setFormData({ ...formData, urgency: value })}
          disabled={loading}
        >
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="Select urgency level" />
          </SelectTrigger>
          <SelectContent>
            {urgencyLevels.map(level => (
              <SelectItem key={level.value} value={level.value}>
                <div>
                  <div className="font-medium">{level.label}</div>
                  <div className="text-xs text-muted-foreground">{level.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="location_override" className="text-sm font-medium text-foreground">
          Specific Location <span className="text-muted-foreground">(Optional)</span>
        </label>
        <Input
          id="location_override"
          value={formData.location_override}
          onChange={(e) => setFormData({ ...formData, location_override: e.target.value })}
          placeholder="Override your profile location for this request"
          maxLength={200}
          disabled={loading}
          className="min-h-[44px]"
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to use your profile location
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="location_privacy" className="text-sm font-medium text-foreground">
          Location Privacy
        </label>
        <Select
          value={formData.location_privacy}
          onValueChange={(value) => setFormData({ ...formData, location_privacy: value })}
          disabled={loading}
        >
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="Select privacy level" />
          </SelectTrigger>
          <SelectContent>
            {locationPrivacyOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="min-h-[44px] flex-1"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="min-h-[44px]"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
