/**
 * @fileoverview Session Synchronization Utilities
 * 
 * This module provides utilities to ensure authentication state consistency
 * between client-side and server-side Supabase clients, addressing the core
 * authentication issue identified in TESTING_PLAN.md
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Synchronization result interface
 */
interface SyncResult {
  success: boolean;
  user: User | null;
  session: Session | null;
  error?: string;
  needsRefresh?: boolean;
}

/**
 * Validates if a session is still valid based on expiry time
 */
function isSessionValid(session: Session | null): boolean {
  if (!session) return false;
  
  const now = Date.now() / 1000; // Convert to seconds
  const expiresAt = session.expires_at;
  
  // Consider session invalid if it expires within the next 5 minutes
  const bufferTime = 5 * 60; // 5 minutes
  
  return expiresAt > (now + bufferTime);
}

/**
 * Validates JWT token format and basic structure
 */
function isValidJWT(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Try to decode the header and payload (not verifying signature)
    JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempts to refresh the current session
 */
export async function refreshSession(): Promise<SyncResult> {
  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.warn('[Session Sync] Refresh failed:', error.message);
      return {
        success: false,
        user: null,
        session: null,
        error: error.message,
      };
    }

    if (!data.session || !data.user) {
      console.warn('[Session Sync] Refresh returned empty session/user');
      return {
        success: false,
        user: null,
        session: null,
        error: 'Session refresh returned empty data',
      };
    }

    // Validate the refreshed session
    if (!isSessionValid(data.session)) {
      console.warn('[Session Sync] Refreshed session is invalid');
      return {
        success: false,
        user: null,
        session: null,
        error: 'Refreshed session is invalid',
      };
    }

    console.log('[Session Sync] Session refreshed successfully');
    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    console.error('[Session Sync] Refresh error:', error);
    return {
      success: false,
      user: null,
      session: null,
      error: error instanceof Error ? error.message : 'Unknown refresh error',
    };
  }
}

/**
 * Gets the current authentication state with validation
 */
export async function getCurrentAuthState(): Promise<SyncResult> {
  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.warn('[Session Sync] Get user failed:', error.message);
      
      // If JWT expired, attempt to refresh
      if (error.message.includes('JWT') || error.message.includes('expired')) {
        console.log('[Session Sync] JWT expired, attempting refresh');
        return await refreshSession();
      }

      return {
        success: false,
        user: null,
        session: null,
        error: error.message,
      };
    }

    // Get current session
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    // If we have a user but no valid session, attempt refresh
    if (data.user && (!session || !isSessionValid(session))) {
      console.log('[Session Sync] User exists but session invalid, attempting refresh');
      return await refreshSession();
    }

    // If we have a session but no user, there's an inconsistency
    if (session && !data.user) {
      console.warn('[Session Sync] Session exists but no user, clearing session');
      await supabase.auth.signOut();
      return {
        success: true,
        user: null,
        session: null,
      };
    }

    return {
      success: true,
      user: data.user,
      session,
    };
  } catch (error) {
    console.error('[Session Sync] Auth state error:', error);
    return {
      success: false,
      user: null,
      session: null,
      error: error instanceof Error ? error.message : 'Unknown auth state error',
    };
  }
}

/**
 * Ensures authentication state consistency between client and potential server state
 * This is the main function to call when you need guaranteed auth state
 */
export async function ensureAuthSync(): Promise<SyncResult> {
  const authState = await getCurrentAuthState();
  
  // If auth state is successful and valid, return it
  if (authState.success && authState.user && authState.session) {
    if (isSessionValid(authState.session)) {
      return authState;
    }
  }

  // If auth state is not valid, attempt to refresh
  if (authState.user && (!authState.session || !isSessionValid(authState.session))) {
    console.log('[Session Sync] Session invalid, attempting sync refresh');
    return await refreshSession();
  }

  // Return the current state (which may be logged out)
  return authState;
}

/**
 * Utility to check if user is authenticated with valid session
 */
export async function isAuthenticated(): Promise<boolean> {
  const result = await ensureAuthSync();
  return result.success && !!result.user && !!result.session;
}

/**
 * Utility to get authenticated user with guaranteed valid session
 * Returns null if not authenticated or session invalid
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const result = await ensureAuthSync();
  return result.success ? result.user : null;
}

/**
 * Utility for components that need to handle auth state changes
 * This provides a consistent way to check auth status
 */
export async function requireAuthentication(): Promise<User> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Utility to handle authentication errors in a consistent way
 */
export function handleAuthError(error: any): { 
  shouldRedirect: boolean; 
  redirectTo?: string; 
  message: string 
} {
  const message = error?.message || 'Authentication error';
  
  // Common auth errors that should redirect to login
  const redirectErrors = [
    'JWT expired',
    'Invalid JWT',
    'No JWT present',
    'Authentication required',
    'User not found',
    'Session not found',
  ];
  
  const shouldRedirect = redirectErrors.some(errorType => 
    message.includes(errorType)
  );
  
  return {
    shouldRedirect,
    redirectTo: shouldRedirect ? '/login' : undefined,
    message,
  };
}