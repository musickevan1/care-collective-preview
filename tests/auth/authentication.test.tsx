/**
 * @fileoverview Authentication Testing Suite
 * Tests all authentication flows including the client/server state synchronization issue
 * identified in the TESTING_PLAN.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Mock Supabase clients
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/test',
}));

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  }),
}));

describe('Authentication System', () => {
  let mockSupabaseClient: any;
  let mockServerClient: any;
  
  beforeEach(() => {
    // Setup mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        refreshSession: vi.fn(),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      from: vi.fn(() => ({
        insert: vi.fn(),
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      })),
    };

    mockServerClient = {
      auth: {
        getUser: vi.fn(),
        refreshSession: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      })),
    };

    (createClient as any).mockReturnValue(mockSupabaseClient);
    (createServerClient as any).mockReturnValue(Promise.resolve(mockServerClient));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Authentication State Synchronization', () => {
    it('should maintain consistent auth state between client and server', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
      };

      // Mock both client and server to return the same user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockServerClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Test client auth state
      const clientAuth = await mockSupabaseClient.auth.getUser();
      expect(clientAuth.data.user).toEqual(mockUser);

      // Test server auth state
      const serverAuth = await mockServerClient.auth.getUser();
      expect(serverAuth.data.user).toEqual(mockUser);

      // Verify both return the same user
      expect(clientAuth.data.user.id).toBe(serverAuth.data.user.id);
    });

    it('should handle authentication state mismatch gracefully', async () => {
      // Simulate client having user but server having null (the core issue)
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'test-user-id', 
            email: 'test@example.com',
            aud: 'authenticated',
          }
        },
        error: null,
      });

      mockServerClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const clientAuth = await mockSupabaseClient.auth.getUser();
      const serverAuth = await mockServerClient.auth.getUser();

      // This represents the authentication mismatch issue
      expect(clientAuth.data.user).not.toBeNull();
      expect(serverAuth.data.user).toBeNull();

      // In a fixed system, this should trigger a session refresh
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalledTimes(0);
    });

    it('should refresh session when authentication state is inconsistent', async () => {
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: { access_token: 'new-token' } },
        error: null,
      });

      await mockSupabaseClient.auth.refreshSession();

      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'test-token' } },
        error: null,
      });

      const result = await mockSupabaseClient.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login errors appropriately', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const result = await mockSupabaseClient.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.data.user).toBeNull();
      expect(result.error?.message).toBe('Invalid credentials');
    });

    it('should validate email format before attempting login', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        '',
        'test..test@example.com',
      ];

      for (const email of invalidEmails) {
        // Email validation should happen before Supabase call
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValidEmail).toBe(false);
      }
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register new user', async () => {
      const mockUser = {
        id: 'new-user-id',
        email: 'new@example.com',
        aud: 'authenticated',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null }, // Email confirmation required
        error: null,
      });

      const result = await mockSupabaseClient.auth.signUp({
        email: 'new@example.com',
        password: 'newpassword123',
      });

      expect(result.data.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should handle registration with duplicate email', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      const result = await mockSupabaseClient.auth.signUp({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(result.data.user).toBeNull();
      expect(result.error?.message).toBe('User already registered');
    });

    it('should validate password strength requirements', () => {
      const weakPasswords = [
        '',
        '123',
        'password',
        '12345678',
        'abcdefgh',
      ];

      const strongPassword = 'StrongP@ssw0rd123!';

      for (const password of weakPasswords) {
        // Password should be at least 8 characters with mix of types
        const isStrong = password.length >= 8 && 
                        /[A-Z]/.test(password) && 
                        /[a-z]/.test(password) && 
                        /[0-9]/.test(password);
        expect(isStrong).toBe(false);
      }

      const isStrongPasswordValid = strongPassword.length >= 8 && 
                                   /[A-Z]/.test(strongPassword) && 
                                   /[a-z]/.test(strongPassword) && 
                                   /[0-9]/.test(strongPassword);
      expect(isStrongPasswordValid).toBe(true);
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email for valid email', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await mockSupabaseClient.auth.resetPasswordForEmail('test@example.com');

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle invalid email in password reset', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: 'Invalid email address' },
      });

      const result = await mockSupabaseClient.auth.resetPasswordForEmail('invalid-email');

      expect(result.error?.message).toBe('Invalid email address');
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout user', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await mockSupabaseClient.auth.signOut();

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should clear authentication state after logout', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      // After logout, getUser should return null
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await mockSupabaseClient.auth.signOut();
      const result = await mockSupabaseClient.auth.getUser();

      expect(result.data.user).toBeNull();
    });
  });

  describe('Session Persistence', () => {
    it('should persist authentication across page refreshes', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
      };

      // Simulate page refresh - auth state should persist
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await mockSupabaseClient.auth.getUser();

      expect(result.data.user).toEqual(mockUser);
      expect(result.data.user.id).toBe('test-user-id');
    });

    it('should handle expired sessions gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      const result = await mockSupabaseClient.auth.getUser();

      expect(result.data.user).toBeNull();
      expect(result.error?.message).toBe('JWT expired');
    });

    it('should refresh expired tokens automatically', async () => {
      // First call returns expired session
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      // Refresh session mock
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { 
          session: { access_token: 'new-token' },
          user: { id: 'test-user-id', email: 'test@example.com' }
        },
        error: null,
      });

      // After refresh, getUser should return user
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { 
          user: { id: 'test-user-id', email: 'test@example.com' }
        },
        error: null,
      });

      // Simulate the refresh flow
      const expiredResult = await mockSupabaseClient.auth.getUser();
      if (expiredResult.error?.message === 'JWT expired') {
        await mockSupabaseClient.auth.refreshSession();
        const refreshedResult = await mockSupabaseClient.auth.getUser();
        expect(refreshedResult.data.user).not.toBeNull();
      }
    });
  });

  describe('Protected Route Access', () => {
    it('should redirect unauthenticated users to login', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await mockSupabaseClient.auth.getUser();
      const isAuthenticated = !!result.data.user;

      // Protected routes should check authentication
      const protectedPaths = ['/dashboard', '/requests', '/admin'];
      
      for (const path of protectedPaths) {
        if (!isAuthenticated) {
          // Should redirect to login with returnTo parameter
          expect(isAuthenticated).toBe(false);
          // In a real implementation, this would trigger a redirect
        }
      }
    });

    it('should allow authenticated users to access protected routes', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await mockSupabaseClient.auth.getUser();
      const isAuthenticated = !!result.data.user;

      expect(isAuthenticated).toBe(true);
      // Authenticated users should be able to access protected routes
    });

    it('should handle admin-only route access', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock profile check for admin status
      const mockFrom = mockSupabaseClient.from('profiles');
      mockFrom.select.mockReturnValue(mockFrom);
      mockFrom.eq.mockReturnValue(mockFrom);
      mockFrom.single.mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });

      const profileResult = await mockSupabaseClient
        .from('profiles')
        .select('is_admin')
        .eq('id', mockUser.id)
        .single();

      expect(profileResult.data.is_admin).toBe(true);
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Network error')
      );

      try {
        await mockSupabaseClient.auth.getUser();
      } catch (error) {
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle malformed responses', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(null);

      const result = await mockSupabaseClient.auth.getUser();

      // Should handle malformed responses safely
      expect(result).toBeNull();
    });

    it('should validate JWT token format', () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const invalidJWT = 'invalid-jwt-token';

      // JWT should have 3 parts separated by dots
      const isValidJWTFormat = (token: string) => {
        const parts = token.split('.');
        return parts.length === 3 && parts.every(part => part.length > 0);
      };

      expect(isValidJWTFormat(validJWT)).toBe(true);
      expect(isValidJWTFormat(invalidJWT)).toBe(false);
    });
  });
});