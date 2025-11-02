export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          is_beta_tester: boolean | null
          is_admin: boolean | null
          location: string | null
          phone: string | null
          created_at: string | null
        }
      }
      community_updates: {
        Row: {
          id: string
          title: string
          description: string | null
          icon: string | null
          highlight_value: string | null
          display_order: number
          status: 'draft' | 'published' | 'archived'
          published_at: string | null
          published_by: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
      }
      site_content: {
        Row: {
          id: string
          section_key: 'events_updates' | 'mission' | 'about'
          content: Json
          status: 'draft' | 'published'
          published_version: Json | null
          published_at: string | null
          published_by: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
      }
      event_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string
          icon: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
      }
      calendar_events: {
        Row: {
          id: string
          title: string
          description: string | null
          category_id: string | null
          start_date: string
          end_date: string
          all_day: boolean
          timezone: string | null
          location: string | null
          location_type: 'in_person' | 'virtual' | 'hybrid' | null
          virtual_link: string | null
          is_recurring: boolean
          recurrence_rule: string | null
          recurrence_end_date: string | null
          parent_event_id: string | null
          google_calendar_id: string | null
          google_calendar_event_id: string | null
          last_synced_at: string | null
          status: 'draft' | 'published' | 'cancelled' | 'archived'
          published_at: string | null
          published_by: string | null
          max_attendees: number | null
          registration_required: boolean
          registration_link: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
      }
    }
  }
}

// Helper type to extract table row types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
