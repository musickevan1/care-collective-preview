# Care Collective Beta Test Users

## Test User Accounts

### 1. Terry Barakat
- **Email**: tmbarakat1958@gmail.com
- **Username**: terry_barakat
- **Password**: `CareTest2024!Terry`
- **Role**: Beta Tester
- **Location**: Springfield, MO
- **Test Focus**: General platform testing

### 2. Ariadne Miranda
- **Email**: ariadne.miranda.phd@gmail.com
- **Username**: ariadne_miranda
- **Password**: `CareTest2024!Ariadne`
- **Role**: Beta Tester
- **Location**: Springfield, MO
- **Test Focus**: General platform testing

### 3. Christy Conaway
- **Email**: cconaway@missouristate.edu
- **Username**: christy_conaway
- **Password**: `CareTest2024!Christy`
- **Role**: Beta Tester
- **Location**: Springfield, MO
- **Test Focus**: General platform testing

### 4. Keith Templeman
- **Email**: templemk@gmail.com
- **Username**: keith_templeman
- **Password**: `CareTest2024!Keith`
- **Role**: Beta Tester
- **Location**: Springfield, MO
- **Test Focus**: General platform testing

### 5. Diane Musick
- **Email**: dianemusick@att.net
- **Username**: diane_musick
- **Password**: `CareTest2024!Diane`
- **Role**: Beta Tester
- **Location**: Springfield, MO
- **Test Focus**: General platform testing

---

## Account Setup Notes

**Status**: Pre-created accounts
**Verification**: Email verification bypassed
**Approval**: Auto-approved (no waitlist)
**Beta Flag**: Marked as beta testers in database
**Permissions**: Full access to all features

---

## Platform Access

**URL**: https://care-collective-preview.vercel.app

**Login Page**: https://care-collective-preview.vercel.app/auth/login

---

## Test Scenarios

These users should test with each other:

### Scenario Pairings
- **Terry & Ariadne**: One creates request, other offers help
- **Christy & Keith**: Test messaging and contact exchange
- **Diane**: Test multiple requests and browse functionality
- **All**: Cross-test by responding to each other's requests

---

## Account Creation Script

To create these accounts in the database, run:

```bash
node scripts/create-beta-users.js
```

Or use the SQL script:

```bash
psql $DATABASE_URL < scripts/database/create-beta-users.sql
```

---

## Security Notes

**Password Policy**:
- All passwords follow pattern: `CareTest2024![FirstName]`
- Users can change passwords after first login
- Passwords shared via secure method only

**Account Management**:
- Accounts will be active for beta test period
- May be reset or deleted after beta completion
- Users notified before any data deletion

---

## Communication Plan

### Initial Email
- Welcome to beta test
- Login credentials (sent individually for security)
- Link to Simple Beta Plan
- Contact information for support

### Mid-Test Check-in
- "How's it going?" email after 3-4 days
- Address any issues or questions
- Encourage continued testing

### Final Survey
- Send on day 12-13
- Collect feedback on experience
- Ask about bugs and improvements

---

## Contact Information

**Primary Contact**: [Your Email]
**Support**: [Support Email]
**Bug Reports**: Use in-app button or email

---

## Beta Test Timeline

**Preparation**: Create accounts and verify setup
**Week 1**: Core feature testing (help requests, messaging)
**Week 2**: Advanced features and final feedback
**Wrap-up**: Survey collection and analysis

---

## Success Criteria

By end of beta:
- [ ] All 5 users successfully logged in
- [ ] At least 10 help requests created total
- [ ] At least 5 conversations initiated
- [ ] All users tested on mobile
- [ ] Feedback survey completed by all users
- [ ] Major bugs identified and documented

---

*Last Updated: November 2, 2025*
*Status: Ready for account creation*
