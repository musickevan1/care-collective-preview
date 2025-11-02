# Beta Test Documentation

Complete beta testing framework for Care Collective platform. This directory contains all documentation and templates needed to run a successful 2-week beta test with 4 testers.

## 📚 Documentation Files

### Planning & Strategy
- **[BETA_TEST_MASTER_PLAN.md](./BETA_TEST_MASTER_PLAN.md)** - Comprehensive beta test plan
  - Test objectives and success metrics
  - Timeline and milestones
  - Bug triage process
  - Post-beta activities

### Tester Onboarding
- **[BETA_TESTER_WELCOME_EMAIL.md](./BETA_TESTER_WELCOME_EMAIL.md)** - Email template
  - Welcome message with credentials
  - Getting started guide
  - Key links and resources
  - Support contact information

- **[BETA_TESTER_GUIDE.md](./BETA_TESTER_GUIDE.md)** - Comprehensive tester guide
  - Platform overview
  - Key features to test
  - How to report bugs
  - Testing tips and best practices

### Testing Resources
- **[BETA_TEST_SCENARIOS.md](./BETA_TEST_SCENARIOS.md)** - Detailed test scenarios
  - Week 1: Core functionality scenarios
  - Week 2: Advanced feature scenarios
  - Edge cases and error handling
  - Scenario selection guide

- **[BETA_FEEDBACK_TEMPLATE.md](./BETA_FEEDBACK_TEMPLATE.md)** - Feedback collection template
  - Feature-specific feedback sections
  - Bug reporting guidelines
  - User experience questions
  - Open-ended feedback areas

### Administration
- **[BETA_CREDENTIALS_TEMPLATE.md](./BETA_CREDENTIALS_TEMPLATE.md)** - Credentials management
  - 4 beta tester account templates
  - Password generation guidelines
  - Account setup checklist
  - SQL scripts for account creation
  - **⚠️ NOTE**: Create `BETA_CREDENTIALS.md` with real data (already in `.gitignore`)

---

## 🚀 Quick Start Guide

### For Beta Test Administrators

**1. Prepare Infrastructure** (Before Beta)
```bash
# Apply database migration
cd care-collective-preview
npm run db:start

# Run migration
supabase db reset  # Or apply specific migration
```

**2. Create Beta Tester Accounts**
- Copy `BETA_CREDENTIALS_TEMPLATE.md` to `BETA_CREDENTIALS.md`
- Fill in tester information (names, emails)
- Generate secure passwords
- Run SQL scripts to create accounts
- Mark accounts as approved and beta testers

**3. Send Welcome Emails**
- Customize `BETA_TESTER_WELCOME_EMAIL.md` for each tester
- Replace placeholders with actual data
- Send via secure method
- Confirm receipt from all testers

**4. Monitor Beta Test**
- Check bug reports daily via `/api/beta/bug-report` (admin)
- Review engagement metrics
- Send mid-week survey (Day 3-4)
- Send final survey (Day 13-14)

**5. Post-Beta Analysis**
- Compile bug reports
- Analyze survey responses
- Document findings
- Plan iteration roadmap

### For Beta Testers

**1. Receive Welcome Email**
- Get credentials and platform URL
- Read beta tester guide
- Understand test objectives

**2. Get Started**
- Log in to platform
- Complete profile
- Familiarize with features
- Find bug report button

**3. Test Throughout 2 Weeks**
- Week 1: Core functionality
- Week 2: Advanced features
- Complete surveys
- Report bugs as found

---

## 🛠️ Technical Implementation

### Components Created

**1. Bug Report Button**
- **File**: `components/beta/BugReportButton.tsx`
- **Features**:
  - Floating button (bottom-right corner)
  - Non-intrusive design
  - Modal form for bug details
  - Auto-captures context (URL, device, etc.)

**2. Beta Tester Wrapper**
- **File**: `components/beta/BetaTesterWrapper.tsx`
- **Features**:
  - Conditionally shows bug button
  - Only visible to beta testers
  - Client-side check for `is_beta_tester` flag

**3. Bug Report API**
- **File**: `app/api/beta/bug-report/route.ts`
- **Endpoints**:
  - `POST /api/beta/bug-report` - Submit bug report
  - `GET /api/beta/bug-report` - List bug reports (admin only)
- **Features**:
  - Authentication required
  - Input validation with Zod
  - Context capture
  - RLS policies

### Database Changes

**Migration**: `supabase/migrations/20251102000000_add_beta_testing_support.sql`

**Tables Created**:
- `bug_reports` - Bug report storage with RLS
  - Columns: title, severity, category, description, steps_to_reproduce, context, status
  - Indexes: user_id, status, severity, is_from_beta_tester, created_at
  - RLS: Users view/create own, admins manage all

**Columns Added**:
- `profiles.is_beta_tester` (boolean) - Beta tester flag

**Views Created**:
- `beta_tester_stats` - Beta tester statistics
- `bug_report_stats` - Bug report statistics

---

## 📋 Pre-Launch Checklist

### Infrastructure
- [ ] Database migration applied to production
- [ ] Bug report API endpoint deployed
- [ ] Bug report button visible (test with beta flag)
- [ ] Database types updated
- [ ] Build succeeds with no errors

### Accounts
- [ ] 4 beta tester accounts created
- [ ] All accounts approved (`verification_status = 'approved'`)
- [ ] All accounts marked as beta testers (`is_beta_tester = true`)
- [ ] Emails confirmed (`email_confirmed = true`)
- [ ] Test login with each account

### Documentation
- [ ] Welcome email template customized
- [ ] Beta tester guide reviewed and finalized
- [ ] Test scenarios validated
- [ ] Feedback template prepared
- [ ] Credentials file created (not committed!)

### Communication
- [ ] Support email set up and monitored
- [ ] Emergency contact method defined
- [ ] Survey forms created (mid-week + final)
- [ ] Notification system for bug reports configured

### Testing
- [ ] Bug report button works for beta testers
- [ ] Bug report button hidden for non-beta testers
- [ ] Bug submission works end-to-end
- [ ] Admin can view bug reports
- [ ] Context capture works correctly

---

## 🎯 Success Metrics

### Engagement Metrics (Target)
- 100% of testers log in successfully
- 100% complete at least one test scenario
- 75%+ create multiple help requests
- 75%+ initiate conversations
- 50%+ test on both mobile and desktop

### Quality Metrics (Target)
- <10 critical bugs discovered
- <25 medium-priority bugs discovered
- 90%+ uptime during beta period
- <2 seconds average page load time

### Feedback Metrics (Target)
- 100% complete mid-week survey
- 100% complete final survey
- Average satisfaction score: 4+/5
- 75%+ would recommend to others

---

## 🐛 Bug Report Workflow

### For Beta Testers

1. **Encounter Issue** → Click bug report button (bottom-right)
2. **Fill Form**:
   - Title (brief description)
   - Severity (low, medium, high, critical)
   - Category (functionality, UI, performance, security, content)
   - Description (what happened, what expected)
   - Steps to reproduce (optional but helpful)
3. **Submit** → Confirmation message
4. **Auto-captured**: URL, browser, device, timestamp

### For Administrators

1. **Receive Notification** → Bug report submitted
2. **Review** → Assess via `GET /api/beta/bug-report?beta=true`
3. **Triage** → Assign severity and priority
4. **Fix** → Develop and test solution
5. **Deploy** → Push fix to production
6. **Verify** → Confirm fix with reporter
7. **Close** → Mark as resolved

---

## 📊 Admin Queries

### View All Beta Bug Reports
```bash
curl -X GET "https://care-collective-preview.vercel.app/api/beta/bug-report?beta=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Critical Bugs
```bash
curl -X GET "https://care-collective-preview.vercel.app/api/beta/bug-report?severity=critical" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database Queries

**Beta Tester Statistics**:
```sql
SELECT * FROM beta_tester_stats;
```

**Bug Report Statistics**:
```sql
SELECT * FROM bug_report_stats;
```

**Recent Critical Bugs**:
```sql
SELECT
  id,
  title,
  severity,
  category,
  reporter_name,
  created_at
FROM bug_reports
WHERE severity IN ('critical', 'high')
  AND status = 'open'
ORDER BY created_at DESC;
```

---

## 🔐 Security & Privacy

### Credentials Management
- Use strong passwords (16+ characters)
- Store credentials securely (password manager)
- Share credentials via encrypted channel
- Don't commit `BETA_CREDENTIALS.md` to git
- Testers change passwords on first login

### Data Privacy
- Beta tester data protected by same privacy policies
- Bug reports contain auto-captured context
- Admins can view all bug reports
- Testers can export/delete their data
- Anonymize feedback in reports

### Access Control
- Bug report button only visible to beta testers
- Beta tester flag checked client-side and server-side
- RLS policies enforce report access
- Admin-only endpoints protected by role check

---

## 📞 Support Information

### For Beta Testers
- **Bug Reports**: Use in-app bug report button
- **Account Issues**: [Your support email]
- **General Questions**: [Your support email]
- **Emergency**: [Your emergency contact]

**Response Times**:
- Bug reports: Within 24 hours
- General questions: Within 1 business day
- Critical issues: Within 4 hours

### For Administrators
- **Migration Issues**: Check `supabase/migrations/`
- **API Issues**: Review `app/api/beta/bug-report/route.ts`
- **Component Issues**: Check `components/beta/`
- **Database Schema**: Run `npm run db:types`

---

## 🎓 Resources

### Internal Documentation
- [Master Plan](../../docs/context-engineering/master-plan.md)
- [Project Status](../../PROJECT_STATUS.md)
- [CLAUDE.md](../../CLAUDE.md)

### External Resources
- [Beta Testing Best Practices](https://www.usertesting.com/blog/beta-testing)
- [Effective Bug Reports](https://www.chiark.greenend.org.uk/~sgtatham/bugs.html)
- [Survey Design Guide](https://www.surveymonkey.com/mp/survey-guidelines/)

---

## 📝 Next Steps

### Before Beta Launch
1. Apply database migration
2. Create and test beta tester accounts
3. Customize and send welcome emails
4. Set up monitoring and support

### During Beta (Week 1)
1. Monitor daily for critical bugs
2. Send mid-week survey (Day 3-4)
3. Respond to bug reports within 24 hours
4. Track engagement metrics

### During Beta (Week 2)
1. Continue bug monitoring
2. Send final survey (Day 13-14)
3. Address critical and high-priority bugs
4. Prepare for wrap-up

### After Beta (Week 3)
1. Compile and analyze all feedback
2. Create beta test results report
3. Prioritize post-beta fixes
4. Thank beta testers
5. Plan public launch

---

**Last Updated**: November 2, 2025
**Status**: Ready for Beta Launch
**Version**: 1.0

*Care Collective - Building community through mutual aid and technology*
