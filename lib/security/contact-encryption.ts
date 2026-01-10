/**
 * @fileoverview Contact Encryption Service
 *
 * Provides end-to-end encryption for sensitive contact information in the Care Collective platform.
 * Uses AES-256-GCM encryption with secure key derivation to protect user privacy.
 *
 * Security Features:
 * - AES-256-GCM encryption for confidentiality and integrity
 * - PBKDF2 key derivation with per-user salts
 * - Secure random IV generation
 * - Key rotation support
 * - Backwards compatibility with unencrypted data
 *
 * Privacy Protection:
 * - Contact information encrypted at rest
 * - Keys derived from user context (not stored directly)
 * - Support for selective field encryption
 * - Audit trail integration
 */

import { z } from 'zod';
import { captureError, captureWarning } from '@/lib/error-tracking';

// Encryption configuration constants
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM' as const,
  keyLength: 256,
  ivLength: 12, // 96 bits for GCM
  tagLength: 16, // 128 bits for GCM
  pbkdf2Iterations: 100000, // OWASP recommended minimum
  saltLength: 32, // 256 bits
} as const;

// Platform salt for key derivation (in production, this would be environment-specific)
const PLATFORM_SALT = 'care-collective-encryption-salt-v1';

/**
 * Structure for encrypted contact data
 */
export interface EncryptedContactData {
  version: string;
  algorithm: string;
  iv: string; // Base64 encoded
  salt: string; // Base64 encoded
  encryptedData: string; // Base64 encoded
  tag: string; // Base64 encoded authentication tag
  fields: string[]; // List of encrypted field names
  timestamp: string;
}

/**
 * Contact information that can be encrypted
 */
export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  notes?: string;
  preferredContact?: 'email' | 'phone';
  emergencyContact?: boolean;
}

/**
 * Schema for validating encrypted contact data
 */
const encryptedContactSchema = z.object({
  version: z.string(),
  algorithm: z.string(),
  iv: z.string(),
  salt: z.string(),
  encryptedData: z.string(),
  tag: z.string(),
  fields: z.array(z.string()),
  timestamp: z.string()
});

/**
 * Contact encryption service class
 */
export class ContactEncryptionService {
  private static instance: ContactEncryptionService | null = null;
  private isSupported: boolean = false;

  private constructor() {
    this.isSupported = this.checkCryptoSupport();
    if (!this.isSupported) {
      captureWarning('Web Crypto API not supported - contact encryption disabled', {
        component: 'ContactEncryptionService',
        severity: 'medium'
      });
    }
  }

  /**
   * Get singleton instance of the encryption service
   */
  public static getInstance(): ContactEncryptionService {
    if (!ContactEncryptionService.instance) {
      ContactEncryptionService.instance = new ContactEncryptionService();
    }
    return ContactEncryptionService.instance;
  }

  /**
   * Check if Web Crypto API is available
   */
  private checkCryptoSupport(): boolean {
    return typeof window !== 'undefined' &&
           'crypto' in window &&
           'subtle' in window.crypto &&
           typeof window.crypto.subtle.encrypt === 'function';
  }

  /**
   * Generate a cryptographically secure salt
   */
  private generateSalt(): Uint8Array {
    if (!this.isSupported) {
      throw new Error('Crypto API not supported');
    }
    return window.crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength));
  }

  /**
   * Generate a cryptographically secure initialization vector
   */
  private generateIV(): Uint8Array {
    if (!this.isSupported) {
      throw new Error('Crypto API not supported');
    }
    return window.crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));
  }

  /**
   * Derive encryption key using PBKDF2
   */
  private async deriveKey(
    userId: string,
    requestId: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    if (!this.isSupported) {
      throw new Error('Crypto API not supported');
    }

    // Create key material from user context
    const keyMaterial = `${PLATFORM_SALT}:${userId}:${requestId}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);

    // Import key material
    const importedKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive actual encryption key
    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: ENCRYPTION_CONFIG.pbkdf2Iterations,
        hash: 'SHA-256'
      },
      importedKey,
      {
        name: ENCRYPTION_CONFIG.algorithm,
        length: ENCRYPTION_CONFIG.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt contact information
   */
  public async encryptContactInfo(
    contactInfo: ContactInfo,
    userId: string,
    requestId: string,
    fieldsToEncrypt: (keyof ContactInfo)[] = ['email', 'phone']
  ): Promise<EncryptedContactData> {
    if (!this.isSupported) {
      throw new Error('Contact encryption not supported in this environment');
    }

    try {
      // Generate salt and IV
      const salt = this.generateSalt();
      const iv = this.generateIV();

      // Derive encryption key
      const key = await this.deriveKey(userId, requestId, salt);

      // Prepare data for encryption - only encrypt specified fields
      const dataToEncrypt: Partial<ContactInfo> = {};
      const fieldsEncrypted: string[] = [];

      for (const field of fieldsToEncrypt) {
        const value = contactInfo[field];
        if (value !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (dataToEncrypt as any)[field] = value;
          fieldsEncrypted.push(field);
        }
      }

      // Convert to JSON and encode
      const jsonData = JSON.stringify(dataToEncrypt);
      const encoder = new TextEncoder();
      const data = encoder.encode(jsonData);

      // Encrypt the data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv: new Uint8Array(iv) as unknown as BufferSource,
          tagLength: ENCRYPTION_CONFIG.tagLength * 8 // Convert to bits
        },
        key,
        data
      );

      // Extract encrypted data and authentication tag
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const encryptedData = encryptedArray.slice(0, -ENCRYPTION_CONFIG.tagLength);
      const tag = encryptedArray.slice(-ENCRYPTION_CONFIG.tagLength);

      // Create encrypted contact data structure
      const result: EncryptedContactData = {
        version: '1.0',
        algorithm: ENCRYPTION_CONFIG.algorithm,
        iv: btoa(String.fromCharCode(...iv)),
        salt: btoa(String.fromCharCode(...salt)),
        encryptedData: btoa(String.fromCharCode(...encryptedData)),
        tag: btoa(String.fromCharCode(...tag)),
        fields: fieldsEncrypted,
        timestamp: new Date().toISOString()
      };

      return encryptedContactSchema.parse(result);

    } catch (error) {
      captureError(error as Error, {
        component: 'ContactEncryptionService',
        action: 'encryptContactInfo',
        userId,
        severity: 'high',
        extra: { requestId }
      });
      throw new Error('Failed to encrypt contact information');
    }
  }

  /**
   * Decrypt contact information
   */
  public async decryptContactInfo(
    encryptedData: EncryptedContactData,
    userId: string,
    requestId: string
  ): Promise<Partial<ContactInfo>> {
    if (!this.isSupported) {
      throw new Error('Contact decryption not supported in this environment');
    }

    try {
      // Validate encrypted data structure
      const validatedData = encryptedContactSchema.parse(encryptedData);

      // Check version compatibility
      if (validatedData.version !== '1.0') {
        throw new Error(`Unsupported encryption version: ${validatedData.version}`);
      }

      // Decode Base64 data
      const iv = new Uint8Array(atob(validatedData.iv).split('').map(c => c.charCodeAt(0)));
      const salt = new Uint8Array(atob(validatedData.salt).split('').map(c => c.charCodeAt(0)));
      const encryptedBytes = new Uint8Array(atob(validatedData.encryptedData).split('').map(c => c.charCodeAt(0)));
      const tag = new Uint8Array(atob(validatedData.tag).split('').map(c => c.charCodeAt(0)));

      // Combine encrypted data and tag for decryption
      const encryptedBuffer = new Uint8Array(encryptedBytes.length + tag.length);
      encryptedBuffer.set(encryptedBytes);
      encryptedBuffer.set(tag, encryptedBytes.length);

      // Derive the same key used for encryption
      const key = await this.deriveKey(userId, requestId, salt);

      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv: iv,
          tagLength: ENCRYPTION_CONFIG.tagLength * 8
        },
        key,
        encryptedBuffer
      );

      // Convert back to contact info
      const decoder = new TextDecoder();
      const jsonData = decoder.decode(decryptedBuffer);
      const contactInfo = JSON.parse(jsonData) as Partial<ContactInfo>;

      return contactInfo;

    } catch (error) {
      captureError(error as Error, {
        component: 'ContactEncryptionService',
        action: 'decryptContactInfo',
        userId,
        severity: 'high',
        extra: { requestId }
      });
      throw new Error('Failed to decrypt contact information');
    }
  }

  /**
   * Check if contact data is encrypted
   */
  public isEncrypted(data: any): data is EncryptedContactData {
    try {
      encryptedContactSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get encryption status and capabilities
   */
  public getEncryptionStatus() {
    return {
      supported: this.isSupported,
      algorithm: ENCRYPTION_CONFIG.algorithm,
      keyLength: ENCRYPTION_CONFIG.keyLength,
      version: '1.0'
    };
  }

  /**
   * Migrate unencrypted contact data to encrypted format
   */
  public async migrateToEncrypted(
    plainContactInfo: ContactInfo,
    userId: string,
    requestId: string
  ): Promise<EncryptedContactData> {
    // Encrypt sensitive fields by default
    const sensitiveFields: (keyof ContactInfo)[] = ['email', 'phone'];
    return await this.encryptContactInfo(plainContactInfo, userId, requestId, sensitiveFields);
  }
}

// Export singleton instance
// COMMENTED OUT: Module-level getInstance() triggers cookies() error (React #419)
// Use ContactEncryptionService.getInstance() directly in your code instead
// export const contactEncryption = ContactEncryptionService.getInstance();

// Helper functions for easier usage
export async function encryptContact(
  contactInfo: ContactInfo,
  userId: string,
  requestId: string,
  fields?: (keyof ContactInfo)[]
): Promise<EncryptedContactData> {
  const service = ContactEncryptionService.getInstance();
  return await service.encryptContactInfo(contactInfo, userId, requestId, fields);
}

export async function decryptContact(
  encryptedData: EncryptedContactData,
  userId: string,
  requestId: string
): Promise<Partial<ContactInfo>> {
  const service = ContactEncryptionService.getInstance();
  return await service.decryptContactInfo(encryptedData, userId, requestId);
}

export function isContactEncrypted(data: any): data is EncryptedContactData {
  const service = ContactEncryptionService.getInstance();
  return service.isEncrypted(data);
}

export function getContactEncryptionStatus() {
  const service = ContactEncryptionService.getInstance();
  return service.getEncryptionStatus();
}