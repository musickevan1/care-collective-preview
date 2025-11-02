/**
 * @fileoverview User Privacy Controls Service
 *
 * Provides comprehensive privacy control functionality for the Care Collective platform.
 * Manages user privacy settings, data sharing preferences, and GDPR compliance features.
 *
 * Features:
 * - Granular privacy settings per contact type and category
 * - Data retention policy management
 * - Contact sharing history tracking
 * - Emergency override protocols
 * - GDPR compliance utilities
 * - Privacy preference validation
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { captureError, captureWarning, addBreadcrumb } from '@/lib/error-tracking';

// Privacy settings schema
const privacySettingsSchema = z.object({
  user_id: z.string().uuid(),

  // Default contact sharing preferences
  default_contact_sharing: z.object({
    email: z.boolean().default(true),
    phone: z.boolean().default(false),
    location: z.boolean().default(true),
    preferred_method: z.enum(['email', 'phone']).default('email')
  }),

  // Category-specific privacy overrides
  category_privacy_overrides: z.record(z.object({
    email: z.boolean().optional(),
    phone: z.boolean().optional(),
    location: z.boolean().optional(),
    emergency_override: z.boolean().optional()
  })).default({}),

  // Data retention preferences
  auto_delete_exchanges_after_days: z.number().min(7).max(365).default(90),
  allow_emergency_override: z.boolean().default(true),

  // Communication preferences
  notification_preferences: z.object({
    contact_requests: z.boolean().default(true),
    privacy_updates: z.boolean().default(true),
    data_retention_reminders: z.boolean().default(true)
  }),

  // GDPR and legal compliance
  // NOTE: nullable().optional() handles both null and undefined from database
  gdpr_consent_given: z.boolean().default(false),
  gdpr_consent_date: z.string().nullable().optional(),
  privacy_policy_version: z.string().nullable().optional(),
  privacy_policy_accepted_at: z.string().nullable().optional()
});

export type UserPrivacySettings = z.infer<typeof privacySettingsSchema>;

// Contact sharing preference for specific request
const contactSharingPreferenceSchema = z.object({
  help_request_id: z.string().uuid(),
  category: z.string(),
  urgency: z.enum(['normal', 'urgent', 'critical']),
  sharing_preferences: z.object({
    email: z.boolean(),
    phone: z.boolean(),
    location: z.boolean(),
    notes: z.string().optional()
  }),
  emergency_override_applied: z.boolean().default(false)
});

export type ContactSharingPreference = z.infer<typeof contactSharingPreferenceSchema>;

// Data export request schema
const dataExportRequestSchema = z.object({
  request_type: z.enum(['full_export', 'contact_data_only', 'privacy_audit', 'sharing_history']),
  export_format: z.enum(['json', 'csv', 'pdf']).default('json'),
  include_deleted_data: z.boolean().default(false)
});

export type DataExportRequest = z.infer<typeof dataExportRequestSchema>;

/**
 * Privacy Controls Service Class
 */
export class UserPrivacyControlsService {
  private static instance: UserPrivacyControlsService | null = null;

  // Lazy-load Supabase client to avoid calling cookies() at module load time
  private async getClient() {
    return await createClient();
  }

  private constructor() {}

  public static getInstance(): UserPrivacyControlsService {
    if (!UserPrivacyControlsService.instance) {
      UserPrivacyControlsService.instance = new UserPrivacyControlsService();
    }
    return UserPrivacyControlsService.instance;
  }

  /**
   * Get user privacy settings, creating defaults if none exist
   */
  async getUserPrivacySettings(userId: string): Promise<UserPrivacySettings> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Create default privacy settings
        const defaultSettings = this.createDefaultPrivacySettings(userId);
        await this.updateUserPrivacySettings(userId, defaultSettings);
        return defaultSettings;
      }

      return privacySettingsSchema.parse(data);

    } catch (error) {
      captureError(error as Error, {
        component: 'UserPrivacyControlsService',
        action: 'getUserPrivacySettings',
        userId,
        severity: 'medium'
      });

      // Return safe defaults on error
      return this.createDefaultPrivacySettings(userId);
    }
  }

  /**
   * Update user privacy settings
   */
  async updateUserPrivacySettings(
    userId: string,
    settings: Partial<UserPrivacySettings>
  ): Promise<UserPrivacySettings> {
    try {
      // Validate the settings
      const validatedSettings = privacySettingsSchema.parse({
        user_id: userId,
        ...settings
      });

      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('user_privacy_settings')
        .upsert({
          ...validatedSettings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      addBreadcrumb({
        message: 'Privacy settings updated',
        category: 'privacy_controls',
        level: 'info',
        data: {
          userId,
          settingsUpdated: Object.keys(settings)
        }
      });

      return data;

    } catch (error) {
      captureError(error as Error, {
        component: 'UserPrivacyControlsService',
        action: 'updateUserPrivacySettings',
        userId,
        severity: 'high'
      });
      throw new Error('Failed to update privacy settings');
    }
  }

  /**
   * Get effective contact sharing preferences for a help request
   */
  async getContactSharingPreferences(
    userId: string,
    helpRequestId: string,
    category: string,
    urgency: 'normal' | 'urgent' | 'critical'
  ): Promise<ContactSharingPreference> {
    try {
      const privacySettings = await this.getUserPrivacySettings(userId);

      // Start with default preferences
      let preferences = { ...privacySettings.default_contact_sharing };
      let emergencyOverrideApplied = false;

      // Apply category-specific overrides
      const categoryOverride = privacySettings.category_privacy_overrides[category];
      if (categoryOverride) {
        if (categoryOverride.email !== undefined) preferences.email = categoryOverride.email;
        if (categoryOverride.phone !== undefined) preferences.phone = categoryOverride.phone;
        if (categoryOverride.location !== undefined) preferences.location = categoryOverride.location;
      }

      // Apply emergency override for critical requests
      if (urgency === 'critical' && privacySettings.allow_emergency_override) {
        // Emergency override enables all contact methods
        preferences.email = true;
        preferences.phone = true;
        preferences.location = true;
        emergencyOverrideApplied = true;

        addBreadcrumb({
          message: 'Emergency privacy override applied',
          category: 'privacy_controls',
          level: 'warning',
          data: {
            userId,
            helpRequestId,
            urgency
          }
        });
      }

      return {
        help_request_id: helpRequestId,
        category,
        urgency,
        sharing_preferences: {
          email: preferences.email,
          phone: preferences.phone,
          location: preferences.location
        },
        emergency_override_applied: emergencyOverrideApplied
      };

    } catch (error) {
      captureError(error as Error, {
        component: 'UserPrivacyControlsService',
        action: 'getContactSharingPreferences',
        userId,
        severity: 'medium',
        extra: { helpRequestId }
      });

      // Return safe defaults
      return {
        help_request_id: helpRequestId,
        category,
        urgency,
        sharing_preferences: {
          email: true,
          phone: false,
          location: true
        },
        emergency_override_applied: false
      };
    }
  }

  /**
   * Get user's contact sharing history
   */
  async getContactSharingHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: 'active' | 'revoked' | 'expired';
    }
  ) {
    try {
      const supabase = await this.getClient();
      let query = supabase
        .from('contact_sharing_history')
        .select(`
          *,
          help_requests (
            id,
            title,
            category,
            urgency,
            status
          ),
          profiles!shared_with_user_id (
            id,
            name,
            location
          )
        `)
        .eq('user_id', userId)
        .order('shared_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];

    } catch (error) {
      captureError(error as Error, {
        component: 'UserPrivacyControlsService',
        action: 'getContactSharingHistory',
        userId,
        severity: 'medium'
      });
      return [];
    }
  }

  /**
   * Revoke contact sharing for a specific exchange
   */
  async revokeContactSharing(
    userId: string,
    exchangeId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getClient();

      // Update contact exchange status
      const { error: exchangeError } = await supabase
        .from('contact_exchanges')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revocation_reason: reason,
          encrypted_contact_data: null,
          contact_shared: null
        })
        .eq('id', exchangeId)
        .or(`helper_id.eq.${userId},requester_id.eq.${userId}`);

      if (exchangeError) throw exchangeError;

      // Update sharing history
      const { error: historyError } = await supabase
        .from('contact_sharing_history')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString()
        })
        .eq('exchange_id', exchangeId)
        .eq('user_id', userId);

      if (historyError) {
        captureWarning('Failed to update sharing history during revocation', {
          component: 'UserPrivacyControlsService',
          extra: {
            exchangeId,
            error: historyError.message
          }
        });
      }

      // Create audit trail
      const { error: auditError } = await supabase
        .from('contact_exchange_audit')
        .insert({
          action: 'CONTACT_EXCHANGE_REVOKED',
          request_id: null, // Will be filled by trigger
          helper_id: userId,
          requester_id: null, // Will be filled by trigger
          timestamp: new Date().toISOString(),
          metadata: {
            revoked_by: 'user_request',
            reason: reason || 'User initiated revocation'
          }
        });

      if (auditError) {
        captureWarning('Failed to create audit trail for contact revocation', {
          component: 'UserPrivacyControlsService',
          extra: {
            exchangeId,
            error: auditError.message
          }
        });
      }

      addBreadcrumb({
        message: 'Contact sharing revoked',
        category: 'privacy_controls',
        level: 'info',
        data: {
          userId,
          exchangeId
        }
      });

      return true;

    } catch (error) {
      captureError(error as Error, {
        component: 'UserPrivacyControlsService',
        action: 'revokeContactSharing',
        userId,
        severity: 'high',
        extra: { exchangeId }
      });
      return false;
    }
  }

  /**
   * Request data export for user
   */
  async requestDataExport(
    userId: string,
    exportRequest: DataExportRequest
  ): Promise<string> {
    try {
      const validatedRequest = dataExportRequestSchema.parse(exportRequest);

      // Generate unique download token
      const downloadToken = crypto.getRandomValues(new Uint8Array(32))
        .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: userId,
          request_type: validatedRequest.request_type,
          export_format: validatedRequest.export_format,
          status: 'pending',
          download_token: downloadToken,
          requested_at: new Date().toISOString(),
          // File expires after 7 days
          file_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      addBreadcrumb({
        message: 'Data export requested',
        category: 'privacy_controls',
        level: 'info',
        data: {
          userId,
          requestType: validatedRequest.request_type,
          format: validatedRequest.export_format
        }
      });

      return data.id;

    } catch (error) {
      captureError(error as Error, {
        component: 'UserPrivacyControlsService',
        action: 'requestDataExport',
        userId,
        severity: 'medium'
      });
      throw new Error('Failed to request data export');
    }
  }

  /**
   * Get user's data export requests
   */
  async getDataExportRequests(userId: string) {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('data_export_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      captureError(error as Error, {
        component: 'UserPrivacyControlsService',
        action: 'getDataExportRequests',
        userId,
        severity: 'low'
      });
      return [];
    }
  }

  /**
   * Delete user account and all associated data (GDPR Right to be Forgotten)
   */
  async deleteUserAccount(userId: string, confirmationCode: string): Promise<boolean> {
    try {
      // This would need additional verification in production
      if (confirmationCode !== 'DELETE_MY_ACCOUNT') {
        throw new Error('Invalid confirmation code');
      }

      const supabase = await this.getClient();

      // Mark all contact exchanges as deleted
      await supabase
        .from('contact_exchanges')
        .update({
          status: 'deleted',
          encrypted_contact_data: null,
          contact_shared: null
        })
        .or(`helper_id.eq.${userId},requester_id.eq.${userId}`);

      // Mark sharing history as deleted
      await supabase
        .from('contact_sharing_history')
        .update({ status: 'deleted' })
        .eq('user_id', userId);

      // Delete privacy settings
      await supabase
        .from('user_privacy_settings')
        .delete()
        .eq('user_id', userId);

      // Create final audit entry
      await supabase
        .from('contact_exchange_audit')
        .insert({
          action: 'DATA_DELETION_REQUESTED',
          helper_id: userId,
          timestamp: new Date().toISOString(),
          metadata: {
            deletion_type: 'user_account',
            gdpr_request: true
          }
        });

      addBreadcrumb({
        message: 'User account deletion initiated',
        category: 'privacy_controls',
        level: 'warning',
        data: { userId }
      });

      return true;

    } catch (error) {
      captureError(error as Error, {
        component: 'UserPrivacyControlsService',
        action: 'deleteUserAccount',
        userId,
        severity: 'critical'
      });
      return false;
    }
  }

  /**
   * Update GDPR consent status
   */
  async updateGDPRConsent(userId: string, consent: boolean, policyVersion: string): Promise<void> {
    try {
      await this.updateUserPrivacySettings(userId, {
        gdpr_consent_given: consent,
        gdpr_consent_date: new Date().toISOString(),
        privacy_policy_version: policyVersion,
        privacy_policy_accepted_at: new Date().toISOString()
      });

      addBreadcrumb({
        message: 'GDPR consent updated',
        category: 'privacy_controls',
        level: 'info',
        data: {
          userId,
          consent,
          policyVersion
        }
      });

    } catch (error) {
      captureError(error as Error, {
        component: 'UserPrivacyControlsService',
        action: 'updateGDPRConsent',
        userId,
        severity: 'high'
      });
      throw new Error('Failed to update GDPR consent');
    }
  }

  /**
   * Create default privacy settings for new users
   */
  private createDefaultPrivacySettings(userId: string): UserPrivacySettings {
    return {
      user_id: userId,
      default_contact_sharing: {
        email: true,
        phone: false,
        location: true,
        preferred_method: 'email'
      },
      category_privacy_overrides: {
        medical: {
          email: true,
          phone: true,
          location: true,
          emergency_override: true
        },
        emergency: {
          email: true,
          phone: true,
          location: true,
          emergency_override: true
        }
      },
      auto_delete_exchanges_after_days: 90,
      allow_emergency_override: true,
      notification_preferences: {
        contact_requests: true,
        privacy_updates: true,
        data_retention_reminders: true
      },
      gdpr_consent_given: false
    };
  }
}

// Export singleton instance
// COMMENTED OUT: Module-level getInstance() triggers cookies() error (React #419)
// Use UserPrivacyControlsService.getInstance() directly in your code instead
// export const userPrivacyControls = UserPrivacyControlsService.getInstance();

// Helper functions for easier usage
export async function getUserPrivacySettings(userId: string): Promise<UserPrivacySettings> {
  return await UserPrivacyControlsService.getInstance().getUserPrivacySettings(userId);
}

export async function updateUserPrivacySettings(
  userId: string,
  settings: Partial<UserPrivacySettings>
): Promise<UserPrivacySettings> {
  return await UserPrivacyControlsService.getInstance().updateUserPrivacySettings(userId, settings);
}

export async function getContactSharingPreferences(
  userId: string,
  helpRequestId: string,
  category: string,
  urgency: 'normal' | 'urgent' | 'critical'
): Promise<ContactSharingPreference> {
  return await UserPrivacyControlsService.getInstance().getContactSharingPreferences(userId, helpRequestId, category, urgency);
}

export async function revokeContactSharing(
  userId: string,
  exchangeId: string,
  reason?: string
): Promise<boolean> {
  return await UserPrivacyControlsService.getInstance().revokeContactSharing(userId, exchangeId, reason);
}

export async function requestDataExport(
  userId: string,
  exportRequest: DataExportRequest
): Promise<string> {
  return await UserPrivacyControlsService.getInstance().requestDataExport(userId, exportRequest);
}

// Export schemas
export {
  privacySettingsSchema,
  contactSharingPreferenceSchema,
  dataExportRequestSchema
};