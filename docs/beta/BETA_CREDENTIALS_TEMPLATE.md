# Beta Tester Credentials

**CONFIDENTIAL** - Do not commit this file to version control with real credentials!

---

## 🔐 Security Notes

- **Generate unique passwords** for each tester using a password generator
- **Passwords should be**: 16+ characters, mix of letters/numbers/symbols
- **Share credentials securely**: Use encrypted email or secure messaging
- **Instruct testers** to change passwords on first login
- **Do NOT commit** this file with real passwords to git

---

## 👥 Beta Tester Accounts

### Tester #1

**Personal Information**:
- **Full Name**: [Tester 1 Name]
- **Email**: [tester1@example.com]
- **Phone** (optional): [Phone number]
- **Location**: [City, State]

**Account Credentials**:
- **Email for Login**: [tester1@example.com]
- **Temporary Password**: [GENERATE_SECURE_PASSWORD_HERE]
- **Account Status**: ✅ Pre-approved (verification_status: 'approved')
- **Beta Tester Flag**: ✅ Enabled (is_beta_tester: true)

**Account Created**: [Date]
**Credentials Sent**: [Date]
**First Login**: [Date or "Pending"]

**Notes**:
- [Any special notes about this tester - e.g., "Primary mobile tester", "Admin panel access needed", etc.]

---

### Tester #2

**Personal Information**:
- **Full Name**: [Tester 2 Name]
- **Email**: [tester2@example.com]
- **Phone** (optional): [Phone number]
- **Location**: [City, State]

**Account Credentials**:
- **Email for Login**: [tester2@example.com]
- **Temporary Password**: [GENERATE_SECURE_PASSWORD_HERE]
- **Account Status**: ✅ Pre-approved (verification_status: 'approved')
- **Beta Tester Flag**: ✅ Enabled (is_beta_tester: true)

**Account Created**: [Date]
**Credentials Sent**: [Date]
**First Login**: [Date or "Pending"]

**Notes**:
- [Any special notes about this tester]

---

### Tester #3

**Personal Information**:
- **Full Name**: [Tester 3 Name]
- **Email**: [tester3@example.com]
- **Phone** (optional): [Phone number]
- **Location**: [City, State]

**Account Credentials**:
- **Email for Login**: [tester3@example.com]
- **Temporary Password**: [GENERATE_SECURE_PASSWORD_HERE]
- **Account Status**: ✅ Pre-approved (verification_status: 'approved')
- **Beta Tester Flag**: ✅ Enabled (is_beta_tester: true)

**Account Created**: [Date]
**Credentials Sent**: [Date]
**First Login**: [Date or "Pending"]

**Notes**:
- [Any special notes about this tester]

---

### Tester #4

**Personal Information**:
- **Full Name**: [Tester 4 Name]
- **Email**: [tester4@example.com]
- **Phone** (optional): [Phone number]
- **Location**: [City, State]

**Account Credentials**:
- **Email for Login**: [tester4@example.com]
- **Temporary Password**: [GENERATE_SECURE_PASSWORD_HERE]
- **Account Status**: ✅ Pre-approved (verification_status: 'approved')
- **Beta Tester Flag**: ✅ Enabled (is_beta_tester: true)

**Account Created**: [Date]
**Credentials Sent**: [Date]
**First Login**: [Date or "Pending"]

**Notes**:
- [Any special notes about this tester]

---

## 📋 Account Setup Checklist

For each tester account, ensure:

**Database Setup**:
- [ ] User created in `auth.users` table
- [ ] Email marked as confirmed (`email_confirmed = true`)
- [ ] Profile created in `profiles` table
- [ ] Verification status set to 'approved' (`verification_status = 'approved'`)
- [ ] Beta tester flag enabled (`is_beta_tester = true`)
- [ ] No pending application required

**Pre-Population** (optional):
- [ ] Name added to profile
- [ ] Location added to profile
- [ ] Profile picture placeholder set
- [ ] Account creation date recorded

**Communication**:
- [ ] Welcome email prepared with personalized template
- [ ] Credentials inserted into email template
- [ ] Beta tester guide link included
- [ ] Support contact information provided
- [ ] Email sent and confirmed received

**Access Verification**:
- [ ] Tested login with credentials
- [ ] Verified dashboard access
- [ ] Confirmed all features accessible
- [ ] Checked notification settings work
- [ ] Validated privacy controls available

---

## 🔑 Password Generation

**Recommended Password Generator**:
```bash
# Using openssl (Linux/Mac):
openssl rand -base64 24

# Using pwgen (if installed):
pwgen -s 20 1

# Online (use reputable source):
# https://bitwarden.com/password-generator/
# https://1password.com/password-generator/
```

**Example Secure Passwords** (DO NOT USE THESE ACTUAL EXAMPLES):
- `Kx9$mP2@vL5#nQ8*wR4%`
- `7Hy#2Np@9Qx$4Km*6Tz!`
- `3Vm*8Rz@1Lx#5Pq$9Jw%`
- `6Qw#4Ny@8Km*2Vx$7Tz!`

---

## 📧 Welcome Email Personalization

For each tester, customize the welcome email template (`BETA_TESTER_WELCOME_EMAIL.md`) with:

1. **Replace placeholders**:
   - `[TESTER_NAME]` → First name
   - `[TESTER_EMAIL]` → Their email address
   - `[GENERATED_PASSWORD]` → Their temporary password
   - `[START_DATE]` → Beta test start date
   - `[END_DATE]` → Beta test end date (2 weeks from start)
   - `[SUPPORT_EMAIL]` → Your support email
   - `[EMERGENCY_CONTACT]` → Emergency contact method

2. **Personalize greeting** based on your relationship with tester

3. **Add any tester-specific instructions** if needed

---

## 📊 SQL Scripts for Account Creation

### Create Beta Tester Account (Template)

```sql
-- Step 1: Create auth user (run via Supabase Admin or Auth API)
-- This should be done through Supabase Auth signup flow or admin API
-- Example using Supabase Admin SDK:
-- const { data, error } = await supabase.auth.admin.createUser({
--   email: 'tester1@example.com',
--   password: 'GENERATED_PASSWORD_HERE',
--   email_confirm: true,
-- })

-- Step 2: Update profile (after user created)
UPDATE profiles
SET
  name = 'Beta Tester 1',
  location = 'Springfield, MO',
  verification_status = 'approved',
  email_confirmed = true,
  is_beta_tester = true,
  updated_at = NOW()
WHERE email = 'tester1@example.com';

-- Step 3: Verify account setup
SELECT
  id,
  email,
  name,
  location,
  verification_status,
  email_confirmed,
  is_beta_tester,
  created_at
FROM profiles
WHERE email = 'tester1@example.com';
```

**Repeat for each tester**, replacing:
- Email address
- Name
- Location

---

## 🔍 Verification Queries

### Check All Beta Tester Accounts

```sql
SELECT
  id,
  email,
  name,
  location,
  verification_status,
  email_confirmed,
  is_beta_tester,
  created_at
FROM profiles
WHERE is_beta_tester = true
ORDER BY created_at DESC;
```

### Verify Account Can Access Dashboard

```sql
-- Check profile is approved and confirmed
SELECT
  email,
  verification_status,
  email_confirmed,
  CASE
    WHEN verification_status = 'approved' AND email_confirmed = true
      THEN 'Can Access Dashboard ✅'
    ELSE 'Access Blocked ❌'
  END as access_status
FROM profiles
WHERE email IN (
  'tester1@example.com',
  'tester2@example.com',
  'tester3@example.com',
  'tester4@example.com'
);
```

---

## 📅 Timeline Tracking

**Beta Test Schedule**:
- **Preparation**: [Dates for account setup]
- **Email Sending**: [When welcome emails will go out]
- **Beta Start**: [Official start date]
- **Mid-Week Check**: [Day 3-4]
- **Week 2 Start**: [Day 8]
- **Final Survey**: [Day 13-14]
- **Beta End**: [Day 14]
- **Review**: [Week after beta ends]

**Account Status Updates**:
| Tester | Account Created | Email Sent | First Login | Last Active | Status |
|--------|----------------|------------|-------------|-------------|--------|
| Tester 1 | [Date] | [Date] | [Date] | [Date] | [Active/Inactive] |
| Tester 2 | [Date] | [Date] | [Date] | [Date] | [Active/Inactive] |
| Tester 3 | [Date] | [Date] | [Date] | [Date] | [Active/Inactive] |
| Tester 4 | [Date] | [Date] | [Date] | [Date] | [Active/Inactive] |

---

## 🔒 Security Best Practices

**Credential Management**:
1. Store this file ONLY locally (add to `.gitignore`)
2. Use password manager for secure storage
3. Delete passwords after testers change them
4. Never send passwords via unencrypted email
5. Use temporary passwords that expire on first login (if possible)

**Access Control**:
1. Beta tester accounts have same permissions as regular approved users
2. No admin access unless specifically needed
3. Monitor for suspicious activity
4. Can disable accounts if needed

**Data Privacy**:
1. Treat beta tester data with same privacy standards
2. Don't share tester identities without permission
3. Anonymize feedback in reports
4. Allow testers to request data deletion

---

## 🆘 Emergency Procedures

**If Credentials Compromised**:
1. Immediately reset passwords
2. Notify affected testers
3. Review access logs
4. Check for unauthorized activity
5. Generate new temporary passwords

**If Tester Can't Login**:
1. Verify email is correct
2. Check password was entered correctly
3. Reset password if needed
4. Verify account isn't disabled
5. Check database for account status

**If Account Needs Removal**:
```sql
-- Disable beta access (don't delete - preserve data)
UPDATE profiles
SET
  is_beta_tester = false,
  verification_status = 'pending',
  updated_at = NOW()
WHERE email = 'tester@example.com';
```

---

## 📞 Support Contact Information

**For Tester Questions**:
- Email: [your-support-email@example.com]
- Response Time: Within 24 hours
- Emergency: [emergency-contact-method]

**For Internal Team**:
- Account Issues: [admin-contact]
- Database Access: [db-admin-contact]
- Security Concerns: [security-contact]

---

## ✅ Pre-Launch Checklist

Before sending welcome emails, verify:

- [ ] All 4 accounts created successfully
- [ ] All passwords generated and securely stored
- [ ] All accounts set to 'approved' status
- [ ] All `is_beta_tester` flags enabled
- [ ] All emails confirmed
- [ ] Tested login with each account
- [ ] Welcome emails personalized for each tester
- [ ] Beta tester guide finalized
- [ ] Bug report button deployed
- [ ] Support email monitored
- [ ] Timeline dates finalized

---

**Last Updated**: November 2, 2025
**Template Version**: 1.0
**Status**: Ready for Beta Account Creation

**⚠️ REMEMBER**: Add this file to `.gitignore` before adding real credentials!

*Care Collective - Building community through mutual aid and technology*
