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
          location: string | null
          created_at: string | null
          is_admin: boolean | null
          phone: string | null
          contact_preferences: Json | null
          verification_status: string | null
          application_reason: string | null
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          rejection_reason: string | null
          email_confirmed: boolean | null
          email_confirmed_at: string | null
          auth_mismatch: boolean | null
          is_beta_tester: boolean | null
          terms_accepted_at: string | null
          terms_version: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          created_at?: string | null
          is_admin?: boolean | null
          phone?: string | null
          contact_preferences?: Json | null
          verification_status?: string | null
          application_reason?: string | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          auth_mismatch?: boolean | null
          is_beta_tester?: boolean | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          created_at?: string | null
          is_admin?: boolean | null
          phone?: string | null
          contact_preferences?: Json | null
          verification_status?: string | null
          application_reason?: string | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          auth_mismatch?: boolean | null
          is_beta_tester?: boolean | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          avatar_url?: string | null
        }
      }
      help_requests: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string | null
          urgency: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          helped_at: string | null
          helper_id: string | null
          completed_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          expires_at: string | null
          location_override: string | null
          location_privacy: string | null
          subcategory: string | null
          is_ongoing: boolean | null
          exchange_offer: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: string | null
          urgency?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          helped_at?: string | null
          helper_id?: string | null
          completed_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          expires_at?: string | null
          location_override?: string | null
          location_privacy?: string | null
          subcategory?: string | null
          is_ongoing?: boolean | null
          exchange_offer?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string | null
          urgency?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          helped_at?: string | null
          helper_id?: string | null
          completed_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          expires_at?: string | null
          location_override?: string | null
          location_privacy?: string | null
          subcategory?: string | null
          is_ongoing?: boolean | null
          exchange_offer?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          recipient_id: string
          content: string
          created_at: string | null
          updated_at: string | null
          read_at: string | null
          status: string | null
          message_type: string | null
          is_flagged: boolean | null
          flagged_reason: string | null
          moderation_status: string | null
          deleted_at: string | null
          help_request_id: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          recipient_id: string
          content: string
          created_at?: string | null
          updated_at?: string | null
          read_at?: string | null
          status?: string | null
          message_type?: string | null
          is_flagged?: boolean | null
          flagged_reason?: string | null
          moderation_status?: string | null
          deleted_at?: string | null
          help_request_id?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          created_at?: string | null
          updated_at?: string | null
          read_at?: string | null
          status?: string | null
          message_type?: string | null
          is_flagged?: boolean | null
          flagged_reason?: string | null
          moderation_status?: string | null
          deleted_at?: string | null
          help_request_id?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string | null
          updated_at: string | null
          created_by: string
          help_request_id: string | null
          status: string | null
          title: string | null
          last_message_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          created_by: string
          help_request_id?: string | null
          status?: string | null
          title?: string | null
          last_message_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          created_by?: string
          help_request_id?: string | null
          status?: string | null
          title?: string | null
          last_message_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
