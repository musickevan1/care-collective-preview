export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          location: string | null
          created_at: string
          verification_status: 'pending' | 'approved' | 'rejected'
          application_reason: string | null
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          rejection_reason: string | null
          is_admin?: boolean
          contact_preferences: Json | null
          phone: string | null
        }
        Insert: {
          id: string
          name: string
          location?: string | null
          created_at?: string
          verification_status?: 'pending' | 'approved' | 'rejected'
          application_reason?: string | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          is_admin?: boolean
          contact_preferences?: Json | null
          phone?: string | null
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          created_at?: string
          verification_status?: 'pending' | 'approved' | 'rejected'
          application_reason?: string | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          is_admin?: boolean
          contact_preferences?: Json | null
          phone?: string | null
        }
      }
      help_requests: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          urgency: string
          status: string
          created_at: string
          updated_at: string | null
          helper_id: string | null
          helped_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancel_reason: string | null
          location_override: string | null
          location_privacy: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: string
          urgency?: string
          status?: string
          created_at?: string
          updated_at?: string | null
          helper_id?: string | null
          helped_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancel_reason?: string | null
          location_override?: string | null
          location_privacy?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          urgency?: string
          status?: string
          created_at?: string
          updated_at?: string | null
          helper_id?: string | null
          helped_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancel_reason?: string | null
          location_override?: string | null
          location_privacy?: string | null
        }
      }
      contact_exchanges: {
        Row: {
          id: string
          request_id: string
          helper_id: string
          requester_id: string
          exchange_type: string
          contact_shared: Json
          exchanged_at: string
          confirmed_at: string | null
        }
        Insert: {
          id?: string
          request_id: string
          helper_id: string
          requester_id: string
          exchange_type?: string
          contact_shared?: Json
          exchanged_at?: string
          confirmed_at?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          helper_id?: string
          requester_id?: string
          exchange_type?: string
          contact_shared?: Json
          exchanged_at?: string
          confirmed_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          request_id: string
          sender_id: string
          recipient_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          sender_id: string
          recipient_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      pending_applications: {
        Row: {
          id: string
          name: string
          location: string | null
          application_reason: string | null
          applied_at: string | null
          verification_status: 'pending' | 'approved' | 'rejected'
          rejection_reason: string | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      verification_status: 'pending' | 'approved' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}