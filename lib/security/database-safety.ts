import { createClient } from '@/lib/supabase/server';
import { sanitizeSearchQuery } from './sanitization';

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validate UUID format to prevent injection
export function validateUUID(id: string): boolean {
  return uuidRegex.test(id);
}

// Safe parameterized queries for help requests
export async function safeGetHelpRequest(requestId: string) {
  // Validate UUID format
  if (!validateUUID(requestId)) {
    throw new Error('Invalid request ID format');
  }
  
  const supabase = await createClient();
  
  // Use parameterized query - safe from injection
  const { data, error } = await supabase
    .from('help_requests')
    .select('*')
    .eq('id', requestId) // Parameterized, safe from injection
    .single();
    
  if (error) throw error;
  return data;
}

// Safe search with sanitization
export async function safeSearchRequests(searchTerm: string, filters?: any) {
  const supabase = await createClient();
  
  // Sanitize search term
  const sanitized = sanitizeSearchQuery(searchTerm);
  
  if (!sanitized || sanitized.length < 2) {
    throw new Error('Invalid search query');
  }
  
  // Build safe query
  let query = supabase
    .from('help_requests')
    .select('*');
  
  // Safe text search using Supabase's built-in methods
  if (sanitized) {
    query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
  }
  
  // Apply safe filters
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters?.urgency) {
    query = query.eq('urgency', filters.urgency);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

// Safe user profile queries
export async function safeGetProfile(userId: string) {
  if (!validateUUID(userId)) {
    throw new Error('Invalid user ID format');
  }
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
}

// Safe update operations
export async function safeUpdateRequest(
  requestId: string, 
  updates: Record<string, any>,
  userId: string
) {
  if (!validateUUID(requestId) || !validateUUID(userId)) {
    throw new Error('Invalid ID format');
  }
  
  const supabase = await createClient();
  
  // First verify ownership
  const { data: request, error: fetchError } = await supabase
    .from('help_requests')
    .select('user_id')
    .eq('id', requestId)
    .single();
    
  if (fetchError) throw fetchError;
  
  if (request.user_id !== userId) {
    throw new Error('Unauthorized');
  }
  
  // Perform safe update
  const { data, error } = await supabase
    .from('help_requests')
    .update(updates)
    .eq('id', requestId)
    .eq('user_id', userId) // Double check ownership
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// Safe insert operations
export async function safeCreateRequest(
  requestData: Record<string, any>,
  userId: string
) {
  if (!validateUUID(userId)) {
    throw new Error('Invalid user ID format');
  }
  
  const supabase = await createClient();
  
  // Force user_id to prevent injection
  const safeData = {
    ...requestData,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('help_requests')
    .insert(safeData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// Safe delete operations
export async function safeDeleteRequest(requestId: string, userId: string) {
  if (!validateUUID(requestId) || !validateUUID(userId)) {
    throw new Error('Invalid ID format');
  }
  
  const supabase = await createClient();
  
  // Only delete if user owns the request
  const { error } = await supabase
    .from('help_requests')
    .delete()
    .eq('id', requestId)
    .eq('user_id', userId);
    
  if (error) throw error;
  return { success: true };
}

// Safe batch operations with transaction-like behavior
export async function safeBatchUpdate(
  updates: Array<{ id: string; data: Record<string, any> }>,
  userId: string
) {
  if (!validateUUID(userId)) {
    throw new Error('Invalid user ID format');
  }
  
  // Validate all IDs first
  for (const update of updates) {
    if (!validateUUID(update.id)) {
      throw new Error(`Invalid ID format: ${update.id}`);
    }
  }
  
  const supabase = await createClient();
  const results = [];
  
  for (const update of updates) {
    try {
      const result = await safeUpdateRequest(update.id, update.data, userId);
      results.push({ id: update.id, success: true, data: result });
    } catch (error) {
      results.push({ id: update.id, success: false, error });
    }
  }
  
  return results;
}

// Safe aggregation queries
export async function safeGetRequestStats(userId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from('help_requests')
    .select('status, urgency, category', { count: 'exact' });
  
  if (userId) {
    if (!validateUUID(userId)) {
      throw new Error('Invalid user ID format');
    }
    query = query.eq('user_id', userId);
  }
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  
  // Process data safely
  const stats = {
    total: count || 0,
    byStatus: {} as Record<string, number>,
    byUrgency: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
  };
  
  if (data) {
    data.forEach(item => {
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
      stats.byUrgency[item.urgency] = (stats.byUrgency[item.urgency] || 0) + 1;
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
    });
  }
  
  return stats;
}