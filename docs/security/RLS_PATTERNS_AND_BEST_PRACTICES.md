# Row Level Security (RLS) Patterns and Best Practices

**Care Collective Platform - Security Documentation**
**Last Updated:** October 13, 2025
**Author:** Care Collective Development Team

## Table of Contents

1. [Overview](#overview)
2. [Critical Security Incident Resolution](#critical-security-incident-resolution)
3. [RLS Policy Patterns](#rls-policy-patterns)
4. [Best Practices](#best-practices)
5. [Common Pitfalls](#common-pitfalls)
6. [Testing Guidelines](#testing-guidelines)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Row Level Security (RLS) is PostgreSQL's built-in feature for controlling which rows users can access in database tables. For Care Collective, RLS is critical for:

- **Privacy Protection**: Users should only see their own profile data
- **Access Control**: Different user types (pending, approved, rejected) have different permissions
- **Security by Default**: Even if application logic fails, database enforces access control

### When to Use RLS vs. Application Logic

| Use RLS For | Use Application Logic For |
|-------------|---------------------------|
| User can only view own profile | Complex multi-step workflows |
| User can only edit own content | Business logic validation |
| Preventing data leaks | UI/UX decisions |
| Defense in depth | Rate limiting |
| Audit requirements | External API calls |

---

## Critical Security Incident Resolution

### The Infinite Recursion Bug (October 2025)

**Incident:** RLS policy caused infinite recursion error, preventing user authentication.

**Root Cause:**
```sql
-- ❌ PROBLEMATIC POLICY (DO NOT USE)
CREATE POLICY "Users can view their own profile and approved users" ON profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles  -- ⚠️ Queries same table = recursion!
    WHERE id = auth.uid()
      AND verification_status = 'approved'
  )
);
```

**Problem:** The EXISTS subquery queries the `profiles` table, which triggers the same RLS policy, creating infinite recursion.

**Solution:**
```sql
-- ✅ CORRECT POLICY
CREATE POLICY "profiles_select_own_only"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);  -- Simple, no recursion
```

**Key Lesson:** **Never query the same table within its own RLS policy**. Use middleware or application logic for complex checks.

### Migration History

1. **Initial Policy**: Complex EXISTS subquery (caused recursion)
2. **Fixed Policy** (Migration `20251013200635`): Simplified to self-only access
3. **Security Layer**: Middleware handles verification status checks

---

## RLS Policy Patterns

### Pattern 1: Self-Only Access (Safest)

**Use Case:** Users can only access their own data

```sql
CREATE POLICY "table_name_select_own"
ON table_name
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**Pros:**
- No recursion risk
- Fast execution (index on user_id)
- Easy to understand

**Cons:**
- Cannot share data between users without additional logic

### Pattern 2: Relationship-Based Access

**Use Case:** Users can access data through relationships (e.g., conversation participants)

```sql
CREATE POLICY "messages_select_for_participants"
ON messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants  -- Different table = OK
    WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
  )
);
```

**Pros:**
- Enables collaboration features
- Still maintains security

**Cons:**
- Requires careful index management
- Can be slower than Pattern 1

### Pattern 3: Role-Based Access (Admin)

**Use Case:** Admins need elevated access

```sql
CREATE POLICY "table_name_admins_full_access"
ON table_name
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles  -- Query different context
    WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
  )
);
```

**Pros:**
- Flexible admin access
- Database-enforced roles

**Cons:**
- Potential performance impact
- Risk of recursion if not careful

**⚠️ Warning:** Always query `profiles` for admin checks, never query the table being protected!

### Pattern 4: Service Role Bypass

**Use Case:** System operations that need to bypass RLS

```typescript
// lib/supabase/admin.ts
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE  // ⚡ Bypasses all RLS
  )
}
```

**Use Cases:**
- Middleware authentication checks
- Admin operations
- System maintenance

**⚠️ Critical:** Never expose service role key to client-side code!

---

## Best Practices

### 1. Simplicity is Security

```sql
-- ✅ GOOD: Simple and fast
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- ❌ BAD: Complex and fragile
CREATE POLICY "profiles_complex"
ON profiles FOR SELECT
USING (
  auth.uid() = id
  OR (SELECT is_admin FROM profiles WHERE id = auth.uid())  -- Recursion risk!
  OR EXISTS (SELECT 1 FROM friends WHERE ...)  -- Performance risk!
);
```

**Rule:** If a policy needs more than one EXISTS clause, consider using middleware instead.

### 2. Test for Recursion

Before deploying any RLS policy:

```sql
-- Test query that triggers the policy
SELECT * FROM profiles WHERE id = 'test-user-id';

-- If you see: ERROR: infinite recursion detected in policy for relation "profiles"
-- Then simplify the policy or move logic to middleware
```

### 3. Index for Performance

Every RLS policy should have supporting indexes:

```sql
-- Policy uses: WHERE auth.uid() = user_id
-- Index needed:
CREATE INDEX idx_table_name_user_id ON table_name(user_id);

-- Policy uses: WHERE conversation_id = X
-- Index needed:
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

### 4. Defense in Depth

RLS is one layer. Always combine with:

1. **Middleware checks** (first line of defense)
2. **RLS policies** (database enforcement)
3. **Application validation** (business logic)
4. **Audit logging** (detection and compliance)

Example middleware check before RLS:

```typescript
// Middleware checks verification status BEFORE allowing access
if (profile.verification_status === 'rejected') {
  await supabase.auth.signOut()
  return NextResponse.redirect('/access-denied')
}
// If they bypass middleware, RLS will still block at database level
```

### 5. Explicit is Better Than Implicit

```sql
-- ✅ GOOD: Clear intent
CREATE POLICY "users_view_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ❌ BAD: Unclear what this does
CREATE POLICY "access_policy"
ON profiles
USING (check_access(id));
```

### 6. Separate Policies by Operation

```sql
-- ✅ GOOD: Clear permissions per operation
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT ...;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE ...;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT ...;

-- ❌ BAD: One policy for everything
CREATE POLICY "profiles_all" ON profiles FOR ALL ...;
```

---

## Common Pitfalls

### Pitfall 1: Self-Referencing Policies

```sql
-- ❌ CAUSES INFINITE RECURSION
CREATE POLICY "bad_policy" ON profiles
USING (
  EXISTS (SELECT 1 FROM profiles WHERE ...)  -- 🚨 Same table!
);

-- ✅ SOLUTION: Use middleware or different table
```

### Pitfall 2: Missing Indexes

```sql
-- Policy without index = full table scan for every query
CREATE POLICY "messages_policy" ON messages
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id  -- Needs index!
      AND user_id = auth.uid()
  )
);

-- ✅ ADD INDEX
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
```

### Pitfall 3: Overly Permissive Policies

```sql
-- ❌ TOO PERMISSIVE
CREATE POLICY "profiles_anyone" ON profiles
FOR SELECT TO public  -- 🚨 Anyone can read!
USING (true);

-- ✅ RESTRICT ACCESS
CREATE POLICY "profiles_authenticated_only" ON profiles
FOR SELECT TO authenticated  -- Only logged-in users
USING (auth.uid() = id);
```

### Pitfall 4: Forgotten RLS Enable

```sql
-- ❌ Policies defined but RLS not enabled = policies ignored!
CREATE POLICY "my_policy" ON profiles ...;

-- ✅ ALWAYS ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

Check with:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- rowsecurity should be 't' (true)
```

---

## Testing Guidelines

### Unit Tests for RLS Policies

```typescript
describe('RLS Policy: profiles_select_own', () => {
  it('should allow user to view own profile', async () => {
    const supabase = createClient() // User client
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .single()

    expect(error).toBeNull()
    expect(data.id).toBe(currentUserId)
  })

  it('should block user from viewing other profiles', async () => {
    const supabase = createClient() // User client
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', otherUserId)  // Different user
      .single()

    // RLS blocks this - returns empty, not error
    expect(data).toBeNull()
  })
})
```

### Integration Tests

Test complete user workflows:

1. **Rejected User Flow**
   - Login → Immediate sign out
   - Attempt dashboard access → Blocked
   - Verify no data leakage

2. **Pending User Flow**
   - Login → Redirect to waitlist
   - Attempt protected routes → Redirect to waitlist
   - Can view own profile only

3. **Approved User Flow**
   - Login → Redirect to dashboard
   - Can access all appropriate features
   - Cannot access admin features (unless admin)

### Performance Tests

```sql
-- Test query execution time
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM profiles WHERE id = auth.uid();

-- Should show:
-- - Index Scan (not Seq Scan)
-- - Execution time < 1ms
-- - No "infinite recursion" error
```

---

## Performance Optimization

### 1. Index All Foreign Keys

```sql
-- Every foreign key used in RLS needs an index
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_help_requests_user_id ON help_requests(user_id);
CREATE INDEX idx_contact_exchanges_requester_id ON contact_exchanges(requester_id);
CREATE INDEX idx_contact_exchanges_helper_id ON contact_exchanges(helper_id);
```

### 2. Use Partial Indexes for Common Filters

```sql
-- If RLS policy filters by status
CREATE INDEX idx_help_requests_open_status ON help_requests(status)
WHERE status = 'open';
```

### 3. Monitor with pg_stat_statements

```sql
CREATE EXTENSION pg_stat_statements;

-- Find slow RLS queries
SELECT
  LEFT(query, 100),
  calls,
  mean_exec_time
FROM pg_stat_statements
WHERE query ILIKE '%profiles%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 4. Avoid N+1 Queries

```typescript
// ❌ BAD: N+1 queries due to RLS on each row
for (const request of requests) {
  const profile = await supabase
    .from('profiles')
    .select('name')
    .eq('id', request.user_id)
    .single()
}

// ✅ GOOD: Join to fetch all at once
const { data } = await supabase
  .from('help_requests')
  .select(`
    *,
    profiles(name, location)
  `)
```

---

## Troubleshooting

### Error: "infinite recursion detected in policy for relation X"

**Cause:** Policy queries the same table it protects

**Solution:**
1. Simplify policy to remove self-reference
2. Move complex logic to middleware
3. Use SECURITY DEFINER functions sparingly

### Error: "permission denied for table X"

**Check:**
1. Is RLS enabled? `ALTER TABLE X ENABLE ROW LEVEL SECURITY;`
2. Does a policy exist for the operation?
3. Is the user authenticated?
4. Does the policy's USING clause return true?

**Debug:**
```sql
-- Check policies for table
SELECT * FROM pg_policies WHERE tablename = 'X';

-- Test policy logic manually
SELECT auth.uid() = '...' AS policy_result;
```

### Slow Query Performance

**Check:**
1. Run EXPLAIN ANALYZE on the query
2. Verify indexes exist on filtered columns
3. Check for sequential scans
4. Review pg_stat_statements for slow queries

---

## Summary Checklist

Before deploying RLS policies:

- [ ] Policy does NOT query the same table it protects
- [ ] All filtered columns have indexes
- [ ] RLS is ENABLED on the table
- [ ] Policy tested with actual user sessions
- [ ] Performance tested with EXPLAIN ANALYZE
- [ ] Documented policy purpose and logic
- [ ] Unit tests written for policy
- [ ] Integration tests cover user workflows
- [ ] Monitoring alerts configured

---

## Additional Resources

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Care Collective Security Audit](./SECURITY_AUDIT_FINDINGS.md)
- [Authentication Bug Resolution](../development/NEXT_SESSION_PROMPT.md)

---

**Remember:** RLS is powerful but can be dangerous if misconfigured. When in doubt, keep policies simple and move complex logic to middleware.
