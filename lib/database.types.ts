export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_exchanges: {
        Row: {
          confirmed_at: string | null
          contact_shared: Json | null
          exchange_type: string | null
          exchanged_at: string | null
          helper_id: string | null
          id: string
          request_id: string | null
          requester_id: string | null
        }
        Insert: {
          confirmed_at?: string | null
          contact_shared?: Json | null
          exchange_type?: string | null
          exchanged_at?: string | null
          helper_id?: string | null
          id?: string
          request_id?: string | null
          requester_id?: string | null
        }
        Update: {
          confirmed_at?: string | null
          contact_shared?: Json | null
          exchange_type?: string | null
          exchanged_at?: string | null
          helper_id?: string | null
          id?: string
          request_id?: string | null
          requester_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_exchanges_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_exchanges_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_exchanges_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_exchanges_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_exchanges_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_sharing_history: {
        Row: {
          created_at: string | null
          exchange_id: string | null
          expires_at: string | null
          fields_shared: string[]
          help_request_id: string | null
          id: string
          revoked_at: string | null
          shared_at: string | null
          shared_with_user_id: string | null
          sharing_context: Json | null
          sharing_purpose: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          exchange_id?: string | null
          expires_at?: string | null
          fields_shared: string[]
          help_request_id?: string | null
          id?: string
          revoked_at?: string | null
          shared_at?: string | null
          shared_with_user_id?: string | null
          sharing_context?: Json | null
          sharing_purpose: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          exchange_id?: string | null
          expires_at?: string | null
          fields_shared?: string[]
          help_request_id?: string | null
          id?: string
          revoked_at?: string | null
          shared_at?: string | null
          shared_with_user_id?: string | null
          sharing_context?: Json | null
          sharing_purpose?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_sharing_history_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "contact_exchanges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_sharing_history_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_sharing_history_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_sharing_history_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_sharing_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_sharing_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string | null
          left_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          created_by: string
          help_request_id: string | null
          id: string
          last_message_at: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          help_request_id?: string | null
          id?: string
          last_message_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          help_request_id?: string | null
          id?: string
          last_message_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations_v2: {
        Row: {
          created_at: string | null
          help_request_id: string
          helper_id: string
          id: string
          initial_message: string
          requester_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          help_request_id: string
          helper_id: string
          id?: string
          initial_message: string
          requester_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          help_request_id?: string
          helper_id?: string
          id?: string
          initial_message?: string
          requester_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_v2_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          download_token: string | null
          downloads_count: number | null
          error_message: string | null
          export_file_size_bytes: number | null
          export_file_url: string | null
          export_format: string | null
          file_expires_at: string | null
          id: string
          ip_address: unknown
          max_downloads: number | null
          processed_at: string | null
          request_type: string | null
          requested_at: string | null
          status: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          download_token?: string | null
          downloads_count?: number | null
          error_message?: string | null
          export_file_size_bytes?: number | null
          export_file_url?: string | null
          export_format?: string | null
          file_expires_at?: string | null
          id?: string
          ip_address?: unknown
          max_downloads?: number | null
          processed_at?: string | null
          request_type?: string | null
          requested_at?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          download_token?: string | null
          downloads_count?: number | null
          error_message?: string | null
          export_file_size_bytes?: number | null
          export_file_url?: string | null
          export_format?: string | null
          file_expires_at?: string | null
          id?: string
          ip_address?: unknown
          max_downloads?: number | null
          processed_at?: string | null
          request_type?: string | null
          requested_at?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_export_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_requests: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          helped_at: string | null
          helper_id: string | null
          id: string
          is_ongoing: boolean | null
          location_override: string | null
          location_privacy: string | null
          status: string | null
          subcategory: string | null
          title: string
          updated_at: string | null
          urgency: string | null
          user_id: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          helped_at?: string | null
          helper_id?: string | null
          id?: string
          is_ongoing?: boolean | null
          location_override?: string | null
          location_privacy?: string | null
          status?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
          urgency?: string | null
          user_id: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          helped_at?: string | null
          helper_id?: string | null
          id?: string
          is_ongoing?: boolean | null
          location_override?: string | null
          location_privacy?: string | null
          status?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
          urgency?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_audit_log: {
        Row: {
          action_type: string | null
          created_at: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          restriction_id: string | null
          user_id: string | null
        }
        Insert: {
          action_type?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          restriction_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          restriction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_audit_log_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_audit_log_restriction_id_fkey"
            columns: ["restriction_id"]
            isOneToOne: false
            referencedRelation: "active_user_restrictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_audit_log_restriction_id_fkey"
            columns: ["restriction_id"]
            isOneToOne: false
            referencedRelation: "user_restrictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          message_id: string
          reason: string
          reported_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          message_id: string
          reason: string
          reported_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          message_id?: string
          reason?: string
          reported_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          flagged_reason: string | null
          help_request_id: string | null
          id: string
          is_flagged: boolean | null
          message_type: string | null
          moderation_status: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          flagged_reason?: string | null
          help_request_id?: string | null
          id?: string
          is_flagged?: boolean | null
          message_type?: string | null
          moderation_status?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          flagged_reason?: string | null
          help_request_id?: string | null
          id?: string
          is_flagged?: boolean | null
          message_type?: string | null
          moderation_status?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_v2: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_v2_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_preferences: {
        Row: {
          auto_accept_help_requests: boolean | null
          can_receive_from: string | null
          created_at: string | null
          email_notifications: boolean | null
          push_notifications: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_accept_help_requests?: boolean | null
          can_receive_from?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          push_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_accept_help_requests?: boolean | null
          can_receive_from?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          push_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messaging_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messaging_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          application_reason: string | null
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          auth_mismatch: boolean | null
          contact_preferences: Json | null
          created_at: string | null
          email_confirmed: boolean | null
          email_confirmed_at: string | null
          id: string
          is_admin: boolean | null
          location: string | null
          name: string
          phone: string | null
          rejection_reason: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          application_reason?: string | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auth_mismatch?: boolean | null
          contact_preferences?: Json | null
          created_at?: string | null
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          id?: string
          is_admin?: boolean | null
          location?: string | null
          name: string
          phone?: string | null
          rejection_reason?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          application_reason?: string | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auth_mismatch?: boolean | null
          contact_preferences?: Json | null
          created_at?: string | null
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          id?: string
          is_admin?: boolean | null
          location?: string | null
          name?: string
          phone?: string | null
          rejection_reason?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_audit_backup: {
        Row: {
          application_reason: string | null
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          contact_preferences: Json | null
          created_at: string | null
          email_confirmed: boolean | null
          email_confirmed_at: string | null
          id: string | null
          is_admin: boolean | null
          location: string | null
          name: string | null
          phone: string | null
          rejection_reason: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          application_reason?: string | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          contact_preferences?: Json | null
          created_at?: string | null
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          id?: string | null
          is_admin?: boolean | null
          location?: string | null
          name?: string | null
          phone?: string | null
          rejection_reason?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          application_reason?: string | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          contact_preferences?: Json | null
          created_at?: string | null
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          id?: string | null
          is_admin?: boolean | null
          location?: string | null
          name?: string | null
          phone?: string | null
          rejection_reason?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      user_privacy_settings: {
        Row: {
          allow_emergency_override: boolean | null
          auto_delete_exchanges_after_days: number | null
          category_privacy_overrides: Json | null
          created_at: string | null
          default_contact_sharing: Json | null
          gdpr_consent_date: string | null
          gdpr_consent_given: boolean | null
          id: string
          notification_preferences: Json | null
          privacy_policy_accepted_at: string | null
          privacy_policy_version: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allow_emergency_override?: boolean | null
          auto_delete_exchanges_after_days?: number | null
          category_privacy_overrides?: Json | null
          created_at?: string | null
          default_contact_sharing?: Json | null
          gdpr_consent_date?: string | null
          gdpr_consent_given?: boolean | null
          id?: string
          notification_preferences?: Json | null
          privacy_policy_accepted_at?: string | null
          privacy_policy_version?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allow_emergency_override?: boolean | null
          auto_delete_exchanges_after_days?: number | null
          category_privacy_overrides?: Json | null
          created_at?: string | null
          default_contact_sharing?: Json | null
          gdpr_consent_date?: string | null
          gdpr_consent_given?: boolean | null
          id?: string
          notification_preferences?: Json | null
          privacy_policy_accepted_at?: string | null
          privacy_policy_version?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_restrictions: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          can_send_messages: boolean | null
          can_start_conversations: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          message_limit_per_day: number | null
          reason: string
          requires_pre_approval: boolean | null
          restriction_level: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          can_send_messages?: boolean | null
          can_start_conversations?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message_limit_per_day?: number | null
          reason: string
          requires_pre_approval?: boolean | null
          restriction_level: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          can_send_messages?: boolean | null
          can_start_conversations?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message_limit_per_day?: number | null
          reason?: string
          requires_pre_approval?: boolean | null
          restriction_level?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_status_changes: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          session_invalidated: boolean | null
          session_invalidated_at: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          session_invalidated?: boolean | null
          session_invalidated_at?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          session_invalidated?: boolean | null
          session_invalidated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_user_restrictions: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          can_send_messages: boolean | null
          can_start_conversations: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          message_limit_per_day: number | null
          reason: string | null
          requires_pre_approval: boolean | null
          restriction_level: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          can_send_messages?: boolean | null
          can_start_conversations?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          message_limit_per_day?: number | null
          reason?: string | null
          requires_pre_approval?: boolean | null
          restriction_level?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          can_send_messages?: boolean | null
          can_start_conversations?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          message_limit_per_day?: number | null
          reason?: string | null
          requires_pre_approval?: boolean | null
          restriction_level?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      demo_summary: {
        Row: {
          active_helpers: number | null
          admin_users: number | null
          cancelled_requests: number | null
          completed_requests: number | null
          in_progress_requests: number | null
          open_requests: number | null
          title: string | null
          total_requests: number | null
          total_users: number | null
        }
        Relationships: []
      }
      pending_applications: {
        Row: {
          application_reason: string | null
          applied_at: string | null
          email_confirmed: boolean | null
          email_confirmed_at: string | null
          id: string | null
          location: string | null
          name: string | null
          rejection_reason: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          application_reason?: string | null
          applied_at?: string | null
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          rejection_reason?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          application_reason?: string | null
          applied_at?: string | null
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          rejection_reason?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      user_conversations: {
        Row: {
          created_at: string | null
          created_by: string | null
          help_request_category: string | null
          help_request_id: string | null
          help_request_title: string | null
          id: string | null
          last_message_at: string | null
          status: string | null
          title: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_user_restriction: {
        Args: {
          applied_by_user_id?: string
          expires_at_param?: string
          message_limit?: number
          new_reason: string
          new_restriction_level: string
          target_user_id: string
        }
        Returns: string
      }
      approve_user_application: {
        Args: { admin_id: string; user_id: string }
        Returns: boolean
      }
      can_user_message: {
        Args: { recipient_uuid: string; sender_uuid: string }
        Returns: boolean
      }
      create_conversation_atomic: {
        Args: {
          p_help_request_id: string
          p_helper_id: string
          p_initial_message: string
        }
        Returns: Json
      }
      get_conversation_v2: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: Json
      }
      get_daily_message_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_user_restrictions: {
        Args: { target_user_id: string }
        Returns: {
          can_send_messages: boolean
          can_start_conversations: boolean
          expires_at: string
          message_limit_per_day: number
          reason: string
          requires_pre_approval: boolean
          restriction_level: string
        }[]
      }
      has_pending_session_invalidation: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { conversation_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_current_user_approved: { Args: never; Returns: boolean }
      list_conversations_v2: { Args: { p_user_id: string }; Returns: Json }
      log_security_event: {
        Args: {
          details?: Json
          entity_id?: string
          entity_type?: string
          event_type: string
        }
        Returns: undefined
      }
      mark_session_invalidated: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      send_message_v2: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_sender_id: string
        }
        Returns: Json
      }
      start_help_conversation: {
        Args: {
          help_request_uuid: string
          initial_message: string
          recipient_uuid: string
        }
        Returns: string
      }
      verify_authentication_fixes: {
        Args: never
        Returns: {
          details: string
          status: string
          test_name: string
        }[]
      }
      verify_policy_documentation: {
        Args: never
        Returns: {
          documentation_length: number
          has_documentation: boolean
          policy_name: string
          table_name: string
        }[]
      }
      verify_rls_security: {
        Args: never
        Returns: {
          has_rls: boolean
          policy_count: number
          status: string
          table_name: string
        }[]
      }
      verify_user_registration_system: {
        Args: never
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
    }
    Enums: {
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
