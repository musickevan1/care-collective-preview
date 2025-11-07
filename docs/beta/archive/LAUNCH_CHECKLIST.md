# Beta Test Launch Checklist

## 📦 What's Been Created

### Documentation (Ready to Share with Client)
- ✅ **`SIMPLE_BETA_PLAN.md`** - Friendly testing plan for 5 testers
- ✅ **`WELCOME_EMAIL_TEMPLATE.md`** - Email template with credentials
- ✅ **`BETA_TEST_USERS.md`** - All tester information documented
- ✅ **`READY_TO_LAUNCH.md`** - Complete launch guide

### Technical Setup (Ready to Execute)
- ✅ **`scripts/create-beta-users.js`** - Account creation script updated
- ✅ All 5 testers configured with Springfield, MO location
- ✅ Passwords generated following secure pattern

---

## 👥 Beta Testers (All Springfield, MO)

| Name | Email | Password |
|------|-------|----------|
| Terry Barakat | tmbarakat1958@gmail.com | `CareTest2024!Terry` |
| Ariadne Miranda | ariadne.miranda.phd@gmail.com | `CareTest2024!Ariadne` |
| Christy Conaway | cconaway@missouristate.edu | `CareTest2024!Christy` |
| Keith Templeman | templemk@gmail.com | `CareTest2024!Keith` |
| Diane Musick | dianemusick@att.net | `CareTest2024!Diane` |

---

## 🚀 Quick Start Guide

### For Client Review (Now)
Send these files to client for approval:
1. `docs/beta/SIMPLE_BETA_PLAN.md` - Testing plan
2. `docs/beta/WELCOME_EMAIL_TEMPLATE.md` - Email template

### Once Approved (Next)

**Step 1: Reset database for clean slate**
```bash
node scripts/reset-database-for-beta.js
```
(Follow prompts, type "yes" then "RESET DATABASE")

**Step 2: Create beta test accounts**
```bash
node scripts/create-beta-users.js
```

### Then Send Emails (After Accounts Created)
Use the welcome email template to send individual emails to each tester with their credentials.

---

## ✅ Pre-Launch Checklist

### Before Creating Accounts
- [ ] Client approved the testing plan
- [ ] Client approved the welcome email
- [ ] Confirmed support email address
- [ ] Verified `.env` has `SUPABASE_SERVICE_ROLE` key
- [ ] Platform is stable and working

### Database Reset & Account Creation
- [ ] Run `node scripts/reset-database-for-beta.js` (clean slate)
- [ ] Confirm reset completed successfully (0 users, 0 requests)
- [ ] Run `node scripts/create-beta-users.js`
- [ ] Verify all 5 accounts created successfully
- [ ] Test login for each account
- [ ] Verify profiles show "approved" status
- [ ] Confirm no old test data visible

### Sending Invitations
- [ ] Customize welcome email for each tester
- [ ] Send emails individually (not as group)
- [ ] Include credentials securely
- [ ] Attach or link to testing plan

### During Testing
- [ ] Monitor for bug reports
- [ ] Respond to questions within 24 hours
- [ ] Check in mid-week with testers
- [ ] Fix critical issues quickly

---

## 📧 Email Sending Order (Suggested)

1. **Terry Barakat** - tmbarakat1958@gmail.com
2. **Ariadne Miranda** - ariadne.miranda.phd@gmail.com
3. **Christy Conaway** - cconaway@missouristate.edu
4. **Keith Templeman** - templemk@gmail.com
5. **Diane Musick** - dianemusick@att.net

---

## 🎯 Success Metrics

**Week 1 Goals**:
- All 5 testers log in successfully
- At least 5-10 help requests created
- At least 3-5 conversations started
- At least 3 testers try mobile

**Week 2 Goals**:
- All testers complete feedback survey
- Major bugs identified and documented
- Decision made on public launch readiness

---

## 🆘 Troubleshooting

**If script fails**:
```bash
# Check environment variables
cat .env | grep SUPABASE_SERVICE_ROLE

# Verify Supabase connection
curl https://care-collective-preview.vercel.app
```

**If login fails**:
- Verify password was copied exactly (case-sensitive)
- Check Supabase dashboard for user existence
- Try password reset flow

**If bugs reported**:
- Use in-app bug button to track issues
- Prioritize by severity (critical → low)
- Fix critical bugs within 24-48 hours

---

## 📞 Contact Plan

**Your Email**: [Update this]
**Response Time**: Within 24 hours
**Urgent Issues**: Respond same day
**Mid-Week Check**: Day 3-4 of testing

---

## 🎉 You're Ready to Launch!

Everything is prepared. Next steps:
1. ✅ Review with client → Get approval
2. ✅ Run script → Create accounts
3. ✅ Send emails → Start testing!

---

*Last Updated: November 2, 2025*
*All testers located in Springfield, MO*
