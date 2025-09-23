# Waitlist System - Issues and Fix Plan

## Current Issues

### 1. Sign Out Error
**Problem:** When trying to sign out, the system throws an error instead of logging the user out and redirecting to the homepage.

**Expected Behavior:** 
- User clicks sign out
- Session is cleared
- User is redirected to homepage
- No errors displayed

### 2. Signup Flow - Email Confirmation Issue
**Problem:** After initial signup, users are:
1. Correctly brought to waitlist page
2. But then get an error saying "you must sign in to view waitlist status"
3. When trying to sign in, they get "email not confirmed" error

**Root Cause:** Supabase's default behavior requires email confirmation before allowing login, which conflicts with our waitlist approval flow.

### 3. Email Confirmation Timing
**Current Issue:** Users are required to confirm email before they can access waitlist status page.

**Desired Flow:**
- Users sign up → Added to waitlist (no email confirmation required yet)
- Users can log in and view waitlist status without email confirmation
- Email confirmation only required AFTER admin approval
- Rejected users never need to confirm email

## Proposed Solution

### Phase 1: Fix Sign Out Error
1. Update `/api/auth/logout` route to properly clear session
2. Ensure proper redirect to homepage after logout
3. Add error handling for edge cases

### Phase 2: Restructure Email Confirmation Flow

#### A. Disable Email Confirmation Requirement for Pending Users
1. Update Supabase Auth settings to allow unconfirmed users to log in
2. OR implement custom auth flow that bypasses email confirmation for pending users
3. Track email confirmation status separately from verification status

#### B. Update User Flow
```
New User Signup:
1. User fills form → Account created (pending status)
2. Send "Added to waitlist" email (no confirmation link)
3. User can immediately log in to view waitlist status
4. Admin reviews application

If Approved:
1. Update status to approved
2. Send approval email WITH confirmation link
3. User must confirm email to access full platform
4. After confirmation → Full access granted

If Rejected:
1. Update status to rejected
2. Send rejection email (no action required)
3. User can still log in to see rejection and reapply
4. No email confirmation ever required
```

### Phase 3: Email Notification Updates

#### Email Templates Needed:
1. **Waitlist Confirmation** (on signup)
   - Subject: "You're on the waitlist for Care Collective"
   - Content: Explain review process, no action needed
   
2. **Approval Email** (when approved)
   - Subject: "Welcome to Care Collective - Please Confirm Your Email"
   - Content: Congratulations + confirmation link required
   
3. **Rejection Email** (when rejected)
   - Subject: "Care Collective Application Update"
   - Content: Reason for rejection + reapplication instructions

### Phase 4: Implementation Steps

#### 1. Fix Logout Issue
- [ ] Debug `/api/auth/logout` route
- [ ] Add proper session cleanup
- [ ] Implement redirect to homepage
- [ ] Add error boundaries

#### 2. Update Authentication Flow
- [ ] Modify Supabase auth configuration
- [ ] Update middleware to allow unconfirmed pending users
- [ ] Add email_confirmed field to profiles table
- [ ] Separate email confirmation from verification status

#### 3. Update Signup Process
- [ ] Remove immediate email confirmation requirement
- [ ] Allow login without email confirmation for pending users
- [ ] Update waitlist page access logic

#### 4. Update Approval Process
- [ ] Add email confirmation trigger on approval
- [ ] Update approval action to send confirmation email
- [ ] Block full platform access until email confirmed (for approved users only)

#### 5. Update Email Notifications
- [ ] Create proper email templates
- [ ] Implement conditional confirmation links
- [ ] Test all email scenarios

## Database Changes Required

```sql
-- Add email confirmation tracking separate from auth
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies to consider email confirmation
-- Only approved users need email confirmation for full access
```

## Testing Checklist

### Signup Flow
- [ ] User can sign up without email confirmation
- [ ] User receives waitlist email (no confirmation required)
- [ ] User can immediately log in after signup
- [ ] User can view waitlist status page

### Approval Flow
- [ ] Admin can approve user
- [ ] Approved user receives email with confirmation link
- [ ] User must confirm email to access full platform
- [ ] Unconfirmed approved users see prompt to confirm

### Rejection Flow
- [ ] Admin can reject user
- [ ] Rejected user receives notification email
- [ ] Rejected user can still log in
- [ ] Rejected user can reapply

### Logout Flow
- [ ] Sign out works without errors
- [ ] User is redirected to homepage
- [ ] Session is properly cleared

## Priority Order

1. **CRITICAL:** Fix logout error (prevents users from signing out)
2. **HIGH:** Fix email confirmation blocking waitlist access
3. **MEDIUM:** Implement proper email notification flow
4. **LOW:** Polish and optimize the experience

## Notes

- Consider using Supabase's `autoConfirm` setting for initial signup
- May need to implement custom session management for pending users
- Ensure backward compatibility with existing users
- Test thoroughly with both new and existing accounts