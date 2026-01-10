# Security Fix: Database Views, Functions, and Policies

## Issue Summary (January 2026)

The Supabase security linter detected multiple security issues across two rounds of fixes:

### Round 1: Errors (Fixed)
| Issue Type | Count | Status |
|------------|-------|--------|
| SECURITY DEFINER views | 6 | Fixed |
| Table with RLS disabled | 1 | Fixed |

### Round 2: Warnings (Fixed)
| Issue Type | Count | Status |
|------------|-------|--------|
| Function search_path mutable | 42 | Fixed |
| RLS policy always true | 2 | Fixed |

---

## What is SECURITY DEFINER?

When a view or function is created with `SECURITY DEFINER`, it executes with the permissions of the creator, not the querying user. This bypasses Row Level Security (RLS) policies and can expose restricted data.

## What is Function Search Path?

When a function uses `SECURITY DEFINER` without `SET search_path`, an attacker could manipulate the search path to call malicious functions instead of the intended ones. For example, they could create a fake `auth.uid()` function that always returns an admin user ID.

---

## Views Fixed (Round 1)

| View Name | Purpose | Migration |
|-----------|---------|-----------|
| `pending_applications` | Admin view of pending user applications | 20260110000000 |
| `demo_summary` | Demo data statistics overview | 20260110000000 |
| `beta_tester_stats` | Beta testing program statistics | 20260110000000 |
| `bug_report_stats` | Bug report aggregations | 20260110000000 |
| `active_user_restrictions` | Non-expired user restrictions | 20260110000000 |
| `user_conversations` | User's conversation list with unread counts | 20260110000000 |

## Table Removed (Round 1)

| Table Name | Issue | Action |
|------------|-------|--------|
| `profiles_audit_backup` | RLS disabled, orphaned | Dropped |

## Functions Fixed (Round 2)

All 42 SECURITY DEFINER functions now have `SET search_path = public`:

**Session/Auth Functions:**
- `is_current_user_admin()`, `is_current_user_approved()`, `is_admin(uuid)`
- `log_verification_status_change()`, `has_pending_session_invalidation(uuid)`, `mark_session_invalidated(uuid)`
- `handle_new_user_verification()`, `handle_user_registration()`, `handle_email_confirmation_update()`
- `verify_user_registration_system()`

**Messaging Functions:**
- `create_conversation_atomic()`, `send_message_v2()`, `get_conversation_v2()`
- `list_conversations_v2()` (2 overloads), `accept_conversation()`, `reject_conversation()`
- `update_conversation_timestamp()`, `log_message_action()`, `can_user_message()`
- `is_conversation_participant()`, `start_help_conversation()`
- `update_conversations_v2_updated_at()`, `update_messages_v2_updated_at()`
- `initialize_messaging_preferences()`, `update_user_presence()`

**Admin Functions:**
- `approve_user_application()`, `apply_user_restriction()`
- `get_user_restrictions()`, `get_daily_message_count()`
- `log_security_event()`, `verify_rls_security()`, `verify_policy_documentation()`
- `verify_authentication_fixes()`

**Utility/Trigger Functions:**
- `update_updated_at_column()`, `update_site_content_updated_at()`
- `update_user_restrictions_updated_at()`, `update_bug_reports_updated_at()`
- `log_content_change()`, `get_upcoming_events()`, `check_event_conflicts()`

## RLS Policies Fixed (Round 2)

| Table | Old Policy | Issue | New Policy |
|-------|-----------|-------|------------|
| `conversation_participants` | "Allow inserting participants for new conversations" | `WITH CHECK (true)` | Dropped (orphan) |
| `user_restrictions` | "Admins can manage restrictions" | `USING (true)` | Proper admin check |

---

## Migration Files

| File | Purpose |
|------|---------|
| `20260110000000_fix_security_definer_views.sql` | Fix views and drop orphan table |
| `20260110000001_fix_function_search_paths.sql` | Fix function search_path and RLS policies |

## How to Apply

### For Production (Supabase SQL Editor)
1. Copy contents of `20260110000000_fix_security_definer_views.sql` and run
2. Copy contents of `20260110000001_fix_function_search_paths.sql` and run

### For Local Development
```bash
supabase migration up
# Or reset: supabase db reset
```

---

## Configuration Warnings (Manual Action Required)

These warnings require Supabase Dashboard changes, not code:

| Warning | Location | Action |
|---------|----------|--------|
| auth_otp_long_expiry | Auth > Email Templates | Set OTP expiry ≤ 1 hour |
| auth_leaked_password_protection | Auth > Security | Enable leaked password protection |
| vulnerable_postgres_version | Settings > Infrastructure | Upgrade PostgreSQL |

---

## Best Practices Going Forward

### For Views
1. Always use `WITH (security_invoker = true)` explicitly
2. Never use SECURITY DEFINER for views

### For Functions
1. Always add `SET search_path = public` to SECURITY DEFINER functions
2. Use the pattern:
```sql
CREATE OR REPLACE FUNCTION my_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Required for security
AS $$
BEGIN
  -- function body
END;
$$;
```

### For RLS Policies
1. Never use `USING (true)` or `WITH CHECK (true)` for UPDATE/INSERT/DELETE
2. Always verify proper authorization checks
3. Use helper functions with SECURITY DEFINER + search_path for complex checks

### General
1. Run Supabase linter regularly
2. Never create database objects manually in production
3. Always use migrations for schema changes

---

## Reference

- [Function Search Path Linter](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Security Definer View Linter](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [PostgreSQL ALTER FUNCTION](https://www.postgresql.org/docs/current/sql-alterfunction.html)
- [PostgreSQL View Security](https://www.postgresql.org/docs/current/sql-createview.html)
