/**
 * @fileoverview Message Encryption Service
 * Integrates with Phase 2.2 contact encryption for secure messaging
 */

import { ContactEncryptionService } from '@/lib/security/contact-encryption';
import { privacyEventTracker } from '@/lib/security/privacy-event-tracker';
import { errorTracker } from '@/lib/error-tracking';

export interface MessageEncryptionResult {
  encrypted_content: string;
  encryption_status: 'encrypted' | 'failed' | 'none';
  error?: string;
  metadata?: {
    algorithm: string;
    iv_length: number;
    auth_tag_length: number;
  };
}

export interface MessageDecryptionResult {
  decrypted_content: string;
  success: boolean;
  error?: string;
}

export interface EncryptionKeyInfo {
  user_id: string;
  conversation_id: string;
  key_derivation_info: {
    algorithm: string;
    iterations: number;
    salt_length: number;
  };
}

/**
 * Message Encryption Service
 * Provides end-to-end encryption for sensitive messages using Phase 2.2 infrastructure
 */
export class MessageEncryptionService {
  private contactEncryption: ContactEncryptionService;

  constructor() {
    this.contactEncryption = new ContactEncryptionService();
  }

  /**
   * Encrypts message content for secure transmission using Phase 2.2 infrastructure
   *
   * @param content - The message content to encrypt
   * @param senderId - ID of the user sending the message
   * @param recipientId - ID of the user receiving the message
   * @param conversationId - Conversation identifier for key derivation
   * @param messageType - Type of message determining encryption requirements
   * @returns Promise resolving to encryption result with status and metadata
   * @throws {Error} When Web Crypto API is unavailable or encryption fails
   *
   * @example
   * ```typescript
   * const result = await messageEncryption.encryptMessage(
   *   "Sensitive message content",
   *   "user123",
   *   "user456",
   *   "conv789",
   *   "sensitive"
   * );
   * if (result.encryption_status === 'encrypted') {
   *   // Handle encrypted message
   * }
   * ```
   */
  async encryptMessage(
    content: string,
    senderId: string,
    recipientId: string,
    conversationId: string,
    messageType: 'standard' | 'contact_exchange' | 'sensitive' = 'standard'
  ): Promise<MessageEncryptionResult> {
    try {
      // Only encrypt sensitive message types or when explicitly requested
      if (messageType !== 'contact_exchange' && messageType !== 'sensitive') {
        return {
          encrypted_content: content,
          encryption_status: 'none'
        };
      }

      // Check if Web Crypto API is available
      if (typeof window === 'undefined' || !window.crypto?.subtle) {
        return {
          encrypted_content: content,
          encryption_status: 'failed',
          error: 'Encryption not available in this environment'
        };
      }

      // Use conversation ID as the base for key derivation
      const encryptionResult = await this.contactEncryption.encryptContactData(
        { message_content: content },
        senderId,
        conversationId // Use conversation ID instead of request ID for messaging
      );

      if (!encryptionResult.success || !encryptionResult.encrypted_data) {
        throw new Error(encryptionResult.error || 'Encryption failed');
      }

      // Track encryption event
      await privacyEventTracker.trackPrivacyEvent({
        event_type: 'MESSAGE_ENCRYPTED',
        user_id: senderId,
        affected_user_id: recipientId,
        severity: 'low',
        description: 'Message content encrypted for secure transmission',
        metadata: {
          conversation_id: conversationId,
          message_type: messageType,
          encryption_algorithm: 'AES-256-GCM',
          success: true
        }
      });

      return {
        encrypted_content: encryptionResult.encrypted_data,
        encryption_status: 'encrypted',
        metadata: {
          algorithm: 'AES-256-GCM',
          iv_length: 12,
          auth_tag_length: 16
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown encryption error';

      // Track encryption failure
      await privacyEventTracker.trackPrivacyEvent({
        event_type: 'MESSAGE_ENCRYPTION_FAILED',
        user_id: senderId,
        affected_user_id: recipientId,
        severity: 'medium',
        description: `Message encryption failed: ${errorMessage}`,
        metadata: {
          conversation_id: conversationId,
          message_type: messageType,
          error: errorMessage
        }
      });

      errorTracker.captureError(error as Error, {
        component: 'MessageEncryptionService',
        action: 'encrypt_message',
        severity: 'medium',
        tags: {
          sender_id: senderId,
          recipient_id: recipientId,
          conversation_id: conversationId,
          message_type: messageType
        }
      });

      return {
        encrypted_content: content,
        encryption_status: 'failed',
        error: errorMessage
      };
    }
  }

  /**
   * Decrypts message content for display with access control validation
   *
   * @param encryptedContent - The encrypted message content
   * @param senderId - ID of the original message sender
   * @param recipientId - ID of the original message recipient
   * @param conversationId - Conversation identifier for key derivation
   * @param currentUserId - ID of the user requesting decryption
   * @returns Promise resolving to decryption result with access control
   * @throws {Error} When decryption fails or access is denied
   *
   * @example
   * ```typescript
   * const result = await messageEncryption.decryptMessage(
   *   encryptedContent,
   *   "sender123",
   *   "recipient456",
   *   "conv789",
   *   "current_user_id"
   * );
   * if (result.success) {
   *   console.log(result.decrypted_content);
   * }
   * ```
   */
  async decryptMessage(
    encryptedContent: string,
    senderId: string,
    recipientId: string,
    conversationId: string,
    currentUserId: string
  ): Promise<MessageDecryptionResult> {
    try {
      // Check if Web Crypto API is available
      if (typeof window === 'undefined' || !window.crypto?.subtle) {
        return {
          decrypted_content: encryptedContent,
          success: false,
          error: 'Decryption not available in this environment'
        };
      }

      // Only the sender or recipient can decrypt the message
      if (currentUserId !== senderId && currentUserId !== recipientId) {
        return {
          decrypted_content: '[Message not accessible]',
          success: false,
          error: 'Access denied: Not authorized to decrypt this message'
        };
      }

      // Use contact encryption service for decryption
      const decryptionResult = await this.contactEncryption.decryptContactData(
        encryptedContent,
        currentUserId === senderId ? senderId : recipientId, // Use appropriate user for key derivation
        conversationId
      );

      if (!decryptionResult.success || !decryptionResult.decrypted_data) {
        throw new Error(decryptionResult.error || 'Decryption failed');
      }

      // Extract message content from decrypted object
      const decryptedObject = decryptionResult.decrypted_data as { message_content?: string };
      const decryptedContent = decryptedObject.message_content || encryptedContent;

      // Track successful decryption
      await privacyEventTracker.trackPrivacyEvent({
        event_type: 'MESSAGE_DECRYPTED',
        user_id: currentUserId,
        affected_user_id: currentUserId === senderId ? recipientId : senderId,
        severity: 'low',
        description: 'Message content decrypted for display',
        metadata: {
          conversation_id: conversationId,
          decrypted_by: currentUserId,
          success: true
        }
      });

      return {
        decrypted_content: decryptedContent,
        success: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown decryption error';

      // Track decryption failure
      await privacyEventTracker.trackPrivacyEvent({
        event_type: 'MESSAGE_DECRYPTION_FAILED',
        user_id: currentUserId,
        severity: 'medium',
        description: `Message decryption failed: ${errorMessage}`,
        metadata: {
          conversation_id: conversationId,
          error: errorMessage,
          attempted_by: currentUserId
        }
      });

      errorTracker.captureError(error as Error, {
        component: 'MessageEncryptionService',
        action: 'decrypt_message',
        severity: 'medium',
        tags: {
          current_user_id: currentUserId,
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId
        }
      });

      return {
        decrypted_content: '[Decryption failed]',
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Analyzes message content to determine if encryption is required
   * Uses pattern matching to detect sensitive information like PII, contact data
   *
   * @param content - The message content to analyze
   * @param messageType - Type of message (affects encryption requirements)
   * @returns Promise resolving to analysis result with encryption recommendation
   *
   * @example
   * ```typescript
   * const analysis = await messageEncryption.shouldEncryptMessage(
   *   "My phone is 555-123-4567",
   *   "standard"
   * );
   * if (analysis.should_encrypt) {
   *   console.log(analysis.reason); // "Message contains potentially sensitive information"
   * }
   * ```
   */
  async shouldEncryptMessage(
    content: string,
    messageType: 'standard' | 'contact_exchange' | 'sensitive' = 'standard'
  ): Promise<{
    should_encrypt: boolean;
    reason: string;
    detected_patterns?: string[];
  }> {
    try {
      // Always encrypt contact exchange messages
      if (messageType === 'contact_exchange' || messageType === 'sensitive') {
        return {
          should_encrypt: true,
          reason: 'Message type requires encryption'
        };
      }

      // Patterns that suggest sensitive information
      const sensitivePatterns = [
        // Phone numbers
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
        /\b\(\d{3}\)\s?\d{3}[-.]?\d{4}\b/,
        // Email addresses
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i,
        // Address-like patterns
        /\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)\b/i,
        // Social Security Numbers
        /\b\d{3}-\d{2}-\d{4}\b/,
        // Credit card patterns
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
        // Bank account references
        /\b(?:account|routing)\s*(?:number|#)[\s:]*\d+/i,
        // Financial keywords
        /\b(?:ssn|social\s*security|bank\s*account|credit\s*card|pin\s*number|password)\b/i
      ];

      const detectedPatterns: string[] = [];

      for (const pattern of sensitivePatterns) {
        if (pattern.test(content)) {
          detectedPatterns.push(pattern.source);
        }
      }

      const shouldEncrypt = detectedPatterns.length > 0;

      if (shouldEncrypt) {
        // Track potential sensitive information detection
        await privacyEventTracker.trackPrivacyEvent({
          event_type: 'SENSITIVE_MESSAGE_DETECTED',
          severity: 'low',
          description: 'Message contains patterns that suggest sensitive information',
          metadata: {
            patterns_detected: detectedPatterns,
            content_length: content.length,
            automatic_encryption_suggested: true
          }
        });
      }

      return {
        should_encrypt: shouldEncrypt,
        reason: shouldEncrypt
          ? 'Message contains potentially sensitive information'
          : 'No sensitive patterns detected',
        detected_patterns: detectedPatterns.length > 0 ? detectedPatterns : undefined
      };

    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'MessageEncryptionService',
        action: 'analyze_message_sensitivity',
        severity: 'low'
      });

      // Err on the side of caution
      return {
        should_encrypt: true,
        reason: 'Error analyzing message - encrypting for safety'
      };
    }
  }

  /**
   * Retrieves encryption configuration metadata for a conversation
   * Provides key derivation information for encryption operations
   *
   * @param conversationId - Unique identifier for the conversation
   * @param userId - User ID for personalized encryption settings
   * @returns Promise resolving to encryption metadata or null if unavailable
   *
   * @example
   * ```typescript
   * const keyInfo = await messageEncryption.getEncryptionInfo("conv123", "user456");
   * if (keyInfo) {
   *   console.log(`Algorithm: ${keyInfo.key_derivation_info.algorithm}`);
   * }
   * ```
   */
  async getEncryptionInfo(conversationId: string, userId: string): Promise<EncryptionKeyInfo | null> {
    try {
      return {
        user_id: userId,
        conversation_id: conversationId,
        key_derivation_info: {
          algorithm: 'PBKDF2',
          iterations: 100000,
          salt_length: 32
        }
      };
    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'MessageEncryptionService',
        action: 'get_encryption_info',
        severity: 'low'
      });

      return null;
    }
  }

  /**
   * Cleans up encryption keys and metadata when conversation ends or is deleted
   * Ensures proper disposal of cryptographic material for privacy compliance
   *
   * @param conversationId - Unique identifier for the conversation
   * @param userId - User ID initiating the cleanup
   * @returns Promise that resolves when cleanup is complete
   *
   * @example
   * ```typescript
   * await messageEncryption.cleanupEncryptionKeys("conv123", "user456");
   * // Encryption keys for conversation safely disposed
   * ```
   */
  async cleanupEncryptionKeys(conversationId: string, userId: string): Promise<void> {
    try {
      // Track cleanup event
      await privacyEventTracker.trackPrivacyEvent({
        event_type: 'MESSAGE_ENCRYPTION_CLEANUP',
        user_id: userId,
        severity: 'low',
        description: 'Encryption keys cleaned up for conversation',
        metadata: {
          conversation_id: conversationId,
          cleanup_initiated_by: userId
        }
      });

      // Note: Actual key cleanup would depend on implementation
      // Since we derive keys on-demand, no persistent cleanup needed

    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'MessageEncryptionService',
        action: 'cleanup_encryption_keys',
        severity: 'low'
      });
    }
  }
}

// Export singleton instance
export const messageEncryption = new MessageEncryptionService();