export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_action_audit: {
        Row: {
          action_details: Json
          action_type: string
          admin_id: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          session_id: string | null
          success: boolean | null
          target_id: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action_details?: Json
          action_type: string
          admin_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          success?: boolean | null
          target_id?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action_details?: Json
          action_type?: string
          admin_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          success?: boolean | null
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_action_audit_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_action_audit_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_bulk_operations: {
        Row: {
          admin_id: string
          affected_users: string[]
          completed_at: string | null
          created_at: string | null
          error_details: string | null
          failure_count: number
          id: string
          operation_type: string
          parameters: Json | null
          results: Json | null
          started_at: string | null
          status: string | null
          success_count: number
          total_count: number
        }
        Insert: {
          admin_id: string
          affected_users?: string[]
          completed_at?: string | null
          created_at?: string | null
          error_details?: string | null
          failure_count?: number
          id?: string
          operation_type: string
          parameters?: Json | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
          success_count?: number
          total_count?: number
        }
        Update: {
          admin_id?: string
          affected_users?: string[]
          completed_at?: string | null
          created_at?: string | null
          error_details?: string | null
          failure_count?: number
          id?: string
          operation_type?: string
          parameters?: Json | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
          success_count?: number
          total_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_bulk_operations_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_bulk_operations_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_reviews: {
        Row: {
          application_id: string
          created_at: string | null
          decision: string
          flags: Json | null
          id: string
          reasoning: string | null
          review_duration_minutes: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string
          risk_score: number | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          decision: string
          flags?: Json | null
          id?: string
          reasoning?: string | null
          review_duration_minutes?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id: string
          risk_score?: number | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          decision?: string
          flags?: Json | null
          id?: string
          reasoning?: string | null
          review_duration_minutes?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string
          risk_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "application_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      contact_exchange_audit: {
        Row: {
          action: string
          created_at: string | null
          helper_id: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          request_id: string | null
          requester_id: string | null
          session_id: string | null
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          helper_id?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          request_id?: string | null
          requester_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          helper_id?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          request_id?: string | null
          requester_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_exchange_audit_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_exchange_audit_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_exchange_audit_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_exchange_audit_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests_with_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_exchange_audit_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_exchange_audit_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_exchanges: {
        Row: {
          auto_expire_days: number | null
          completed_at: string | null
          confirmed_at: string | null
          consent_given: boolean | null
          contact_shared: Json | null
          data_retention_until: string | null
          emergency_override: boolean | null
          encrypted_contact_data: Json | null
          encryption_version: string | null
          exchange_type: string | null
          exchanged_at: string | null
          helper_id: string | null
          id: string
          initiated_at: string | null
          message: string | null
          privacy_level: string | null
          request_id: string | null
          requester_id: string | null
          revocation_reason: string | null
          revoked_at: string | null
          status: string | null
        }
        Insert: {
          auto_expire_days?: number | null
          completed_at?: string | null
          confirmed_at?: string | null
          consent_given?: boolean | null
          contact_shared?: Json | null
          data_retention_until?: string | null
          emergency_override?: boolean | null
          encrypted_contact_data?: Json | null
          encryption_version?: string | null
          exchange_type?: string | null
          exchanged_at?: string | null
          helper_id?: string | null
          id?: string
          initiated_at?: string | null
          message?: string | null
          privacy_level?: string | null
          request_id?: string | null
          requester_id?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string | null
        }
        Update: {
          auto_expire_days?: number | null
          completed_at?: string | null
          confirmed_at?: string | null
          consent_given?: boolean | null
          contact_shared?: Json | null
          data_retention_until?: string | null
          emergency_override?: boolean | null
          encrypted_contact_data?: Json | null
          encryption_version?: string | null
          exchange_type?: string | null
          exchanged_at?: string | null
          helper_id?: string | null
          id?: string
          initiated_at?: string | null
          message?: string | null
          privacy_level?: string | null
          request_id?: string | null
          requester_id?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string | null
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
            foreignKeyName: "contact_exchanges_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests_with_profiles"
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
            foreignKeyName: "contact_sharing_history_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests_with_profiles"
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
          {
            foreignKeyName: "conversations_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests_with_profiles"
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      email_notifications: {
        Row: {
          created_at: string | null
          delivery_status: string | null
          email_address: string
          error_message: string | null
          id: string
          metadata: Json | null
          provider_message_id: string | null
          sent_at: string | null
          subject: string
          template_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_status?: string | null
          email_address: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_message_id?: string | null
          sent_at?: string | null
          subject: string
          template_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_status?: string | null
          email_address?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_message_id?: string | null
          sent_at?: string | null
          subject?: string
          template_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_notifications_user_id_fkey"
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
      message_threads: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_ids: string[]
          request_id: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_ids: string[]
          request_id?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_ids?: string[]
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests_with_profiles"
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
          edited_at: string | null
          encryption_status: string | null
          flagged_reason: string | null
          help_request_id: string | null
          id: string
          is_flagged: boolean | null
          message_type: string | null
          moderation_status: string | null
          parent_message_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          status: string | null
          thread_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          encryption_status?: string | null
          flagged_reason?: string | null
          help_request_id?: string | null
          id?: string
          is_flagged?: boolean | null
          message_type?: string | null
          moderation_status?: string | null
          parent_message_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          status?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          encryption_status?: string | null
          flagged_reason?: string | null
          help_request_id?: string | null
          id?: string
          is_flagged?: boolean | null
          message_type?: string | null
          moderation_status?: string | null
          parent_message_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          status?: string | null
          thread_id?: string | null
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
            foreignKeyName: "messages_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests_with_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
      privacy_violation_alerts: {
        Row: {
          alert_type: string
          assigned_to: string | null
          conversation_id: string | null
          created_at: string | null
          description: string
          details: Json | null
          detected_at: string | null
          exchange_id: string | null
          help_request_id: string | null
          id: string
          message_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string | null
          description: string
          details?: Json | null
          detected_at?: string | null
          exchange_id?: string | null
          help_request_id?: string | null
          id?: string
          message_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string | null
          description?: string
          details?: Json | null
          detected_at?: string | null
          exchange_id?: string | null
          help_request_id?: string | null
          id?: string
          message_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "privacy_violation_alerts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_violation_alerts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_violation_alerts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_violation_alerts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_violation_alerts_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "contact_exchanges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_violation_alerts_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_violation_alerts_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests_with_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_violation_alerts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_violation_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_violation_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
          terms_accepted_at: string | null
          terms_version: string | null
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
          id?: string
          is_admin?: boolean | null
          location?: string | null
          name: string
          phone?: string | null
          rejection_reason?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
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
          id?: string
          is_admin?: boolean | null
          location?: string | null
          name?: string
          phone?: string | null
          rejection_reason?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
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
      user_presence: {
        Row: {
          current_conversation_id: string | null
          is_typing_in_conversation: string | null
          last_seen: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_conversation_id?: string | null
          is_typing_in_conversation?: string | null
          last_seen?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_conversation_id?: string | null
          is_typing_in_conversation?: string | null
          last_seen?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_current_conversation_id_fkey"
            columns: ["current_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_presence_current_conversation_id_fkey"
            columns: ["current_conversation_id"]
            isOneToOne: false
            referencedRelation: "user_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_presence_is_typing_in_conversation_fkey"
            columns: ["is_typing_in_conversation"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_presence_is_typing_in_conversation_fkey"
            columns: ["is_typing_in_conversation"]
            isOneToOne: false
            referencedRelation: "user_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "pending_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      admin_statistics: {
        Row: {
          admin_users: number | null
          approved_users: number | null
          cancelled_requests: number | null
          completed_requests: number | null
          confirmed_exchanges: number | null
          in_progress_requests: number | null
          new_exchanges_week: number | null
          new_requests_week: number | null
          new_users_week: number | null
          open_requests: number | null
          pending_users: number | null
          rejected_users: number | null
          total_exchanges: number | null
          total_requests: number | null
          total_users: number | null
        }
        Relationships: []
      }
      community_health_metrics: {
        Row: {
          active_users: number | null
          avg_resolution_hours: number | null
          completed_requests: number | null
          last_updated: string | null
          messages_24h: number | null
          new_requests_7d: number | null
          new_users_30d: number | null
          open_requests: number | null
          pending_reports: number | null
          pending_users: number | null
          total_help_requests: number | null
          total_messages: number | null
          total_reports: number | null
          total_users: number | null
        }
        Relationships: []
      }
      dashboard_stats: {
        Row: {
          active_categories: number | null
          active_helpers: number | null
          completed_requests: number | null
          critical_requests: number | null
          in_progress_requests: number | null
          last_updated: number | null
          open_requests: number | null
          total_requesters: number | null
          urgent_requests: number | null
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
      help_requests_with_profiles: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          helped_at: string | null
          helper_id: string | null
          helper_location: string | null
          helper_name: string | null
          id: string | null
          location_override: string | null
          location_privacy: string | null
          requester_location: string | null
          requester_name: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          urgency: string | null
          user_id: string | null
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
      request_statistics: {
        Row: {
          cancelled_count: number | null
          closed_count: number | null
          completed_count: number | null
          in_progress_count: number | null
          open_count: number | null
          total_count: number | null
          unique_helpers: number | null
          unique_requesters: number | null
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
          {
            foreignKeyName: "conversations_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests_with_profiles"
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
      can_user_send_message: {
        Args: { conversation_uuid?: string; user_uuid: string }
        Returns: boolean
      }
      cleanup_expired_contact_data: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_thread_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_daily_message_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_message_thread: {
        Args: { thread_uuid: string; user_uuid: string }
        Returns: {
          content: string
          created_at: string
          id: string
          is_current_user: boolean
          message_type: string
          parent_message_id: string
          sender_id: string
          sender_name: string
        }[]
      }
      get_unread_message_count: {
        Args: { user_uuid: string }
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
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_approved: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action_details?: Json
          p_action_type: string
          p_admin_id: string
          p_error_message?: string
          p_success?: boolean
          p_target_id?: string
          p_target_type: string
        }
        Returns: string
      }
      mark_messages_read: {
        Args: { conversation_uuid: string; user_uuid: string }
        Returns: number
      }
      mark_session_invalidated: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      refresh_community_health_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_help_requests: {
        Args: { search_query: string }
        Returns: {
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
        }[]
      }
      start_help_conversation: {
        Args: {
          help_request_uuid: string
          initial_message: string
          recipient_uuid: string
        }
        Returns: string
      }
      track_email_notification: {
        Args: {
          p_email_address: string
          p_metadata?: Json
          p_provider_message_id?: string
          p_subject: string
          p_template_type: string
          p_user_id: string
        }
        Returns: string
      }
      update_email_delivery_status: {
        Args: {
          p_delivery_status: string
          p_error_message?: string
          p_notification_id: string
        }
        Returns: undefined
      }
      update_user_presence: {
        Args: {
          conversation_uuid?: string
          new_status?: string
          typing_in_conversation?: string
          user_uuid: string
        }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const

