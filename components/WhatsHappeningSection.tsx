'use client'

import { ReactElement, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Bell, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start_date: string
  location: string | null
}

interface CommunityUpdate {
  id: string
  title: string
  description: string | null
  highlight_value: string | null
  icon: string | null
}

interface WhatsHappeningSectionProps {
  variant?: 'default' | 'dark'
}

export default function WhatsHappeningSection({ variant = 'default' }: WhatsHappeningSectionProps): ReactElement {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [updates, setUpdates] = useState<CommunityUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isDark = variant === 'dark'

  useEffect(() => {
    async function fetchCMSContent() {
      try {
        const supabase = createClient()

        // Fetch upcoming published events
        const { data: eventsData, error: eventsError } = await supabase
          .from('calendar_events')
          .select('id, title, description, start_date, location')
          .eq('status', 'published')
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })
          .limit(3)

        if (eventsError) {
          console.error('Error fetching events:', eventsError)
        } else {
          setEvents(eventsData || [])
        }

        // Fetch published community updates
        const { data: updatesData, error: updatesError } = await supabase
          .from('community_updates')
          .select('id, title, description, highlight_value, icon')
          .eq('status', 'published')
          .order('display_order', { ascending: true })
          .limit(4)

        if (updatesError) {
          console.error('Error fetching updates:', updatesError)
        } else {
          setUpdates(updatesData || [])
        }
      } catch (err) {
        console.error('Error fetching CMS content:', err)
        setError('Unable to load content')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCMSContent()
  }, [])

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'MMM d')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-dusty-rose' : 'text-sage'}`} />
        <span className={`ml-3 ${isDark ? 'text-white/70' : 'text-muted-foreground'}`}>Loading community updates...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className={isDark ? 'text-white/70' : 'text-muted-foreground'}>{error}</p>
      </div>
    )
  }

  // Dark variant - simplified two-box layout for combined section
  if (isDark) {
    return (
      <div className="space-y-6">
        {/* Upcoming Events Box */}
        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
          <h3 className="text-xl font-bold mb-2 text-dusty-rose">Upcoming Events</h3>
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex gap-3 items-start">
                  <span className="bg-dusty-rose text-teal px-2 py-1 rounded text-xs font-bold min-w-[50px] text-center">
                    {formatEventDate(event.start_date)}
                  </span>
                  <div>
                    <p className="text-white font-semibold">{event.title}</p>
                    {event.description && (
                      <p className="text-white/60 text-sm">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/70 font-medium">Events Coming Soon</p>
          )}
        </div>

        {/* Community Updates Box */}
        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
          <h3 className="text-xl font-bold mb-2 text-dusty-rose">Community Updates</h3>
          {updates.length > 0 ? (
            <div className="space-y-3">
              {updates.map((update) => (
                <div key={update.id}>
                  <p className="text-white font-semibold">
                    {update.title}
                    {update.highlight_value && (
                      <span className="ml-2 text-dusty-rose">{update.highlight_value}</span>
                    )}
                  </p>
                  {update.description && (
                    <p className="text-white/60 text-sm">{update.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/70 font-medium">Stay Tuned</p>
          )}
        </div>
      </div>
    )
  }

  // Default variant - original two-column layout
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-4xl mx-auto text-left">
      {/* Events Section */}
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-sage-light">
          Upcoming Events
        </h3>
        <div className="space-y-4">
          {events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                className="flex gap-4 p-4 bg-white rounded-lg border-l-4 border-dusty-rose shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-sage-dark text-white px-3 py-2 rounded-lg text-sm font-bold text-center min-w-[60px] flex-shrink-0 shadow-md">
                  {formatEventDate(event.start_date)}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-1">
                    {event.title}
                  </h4>
                  <p className="text-muted-foreground">
                    {event.description || event.location || 'Details coming soon'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 bg-white rounded-lg border-l-4 border-sage shadow-sm text-center">
              <Calendar className="w-10 h-10 text-sage mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Events Coming Soon
              </h4>
              <p className="text-muted-foreground">
                We&apos;re planning exciting community gatherings. Check back soon!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Community Updates Section */}
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-sage-light">
          Community Updates
        </h3>
        <div className="space-y-4">
          {updates.length > 0 ? (
            updates.map((update) => (
              <div
                key={update.id}
                className="p-4 bg-white rounded-lg border-l-4 border-dusty-rose shadow-sm hover:shadow-md transition-shadow"
              >
                <h4 className="text-lg font-semibold text-foreground mb-1">
                  {update.title}
                  {update.highlight_value && (
                    <span className="ml-2 text-sage-dark font-bold">
                      {update.highlight_value}
                    </span>
                  )}
                </h4>
                {update.description && (
                  <p className="text-muted-foreground">{update.description}</p>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 bg-white rounded-lg border-l-4 border-sage shadow-sm text-center">
              <Bell className="w-10 h-10 text-sage mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Stay Tuned
              </h4>
              <p className="text-muted-foreground">
                Community updates will appear here as our collective grows.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
