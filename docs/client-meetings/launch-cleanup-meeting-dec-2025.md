# Care Collective Launch Cleanup Meeting
**Meeting Date**: [To be scheduled]
**Duration**: 1 hour
**Launch Target**: January 1, 2026
**Focus**: Content review, feature polish, and final cleanup

---

## Meeting Purpose
Quick review of user-facing content, features, and polish items before Jan 1 launch. This is about making sure everything looks right, reads right, and works the way you want it to for your community.

---

## Section 1: Content & Messaging Review (15 min)

### Landing Page
- [ ] **Q1**: Is the Hero section messaging right? "Community. Assistance. Resources. Empowerment."
- [ ] **Q2**: Any text changes needed on the landing page?
- [ ] **Q3**: Are the feature highlights clear and compelling for new visitors?

### About Page
- [ ] **Q4**: Does the About page tell your story the way you want?
- [ ] **Q5**: Background check information accurate and clear?
- [ ] **Q6**: Any mission statement or values changes?

### Help Request Categories
**Current**: Groceries, Transport, Household, Medical, Other
- [ ] **Q7**: Are these the right categories, or do you want to add/change any?
- [ ] **Q8**: Any category descriptions that need updating?

### Email Templates
We send 5 types of emails:
1. Waitlist confirmation
2. Application approved
3. Application rejected
4. Help request status updates
5. Someone offered help notification

- [ ] **Q9**: Do you want to review any email templates before launch?
- [ ] **Q10**: Sender name/email acceptable? (Currently from Resend)

---

## Section 2: Features & Functionality (20 min)

### User Signup & Approval
**Current flow**: Sign up → Waitlist → Admin manually reviews → Approve/Reject
- [ ] **Q11**: Is the manual approval process what you want, or should we auto-approve trusted users?
- [ ] **Q12**: Required fields (name, location, "Why join") - add or remove anything?
- [ ] **Q13**: How quickly should you approve new users? Same day, 24 hours, 48 hours?

### Help Requests
- [ ] **Q14**: Can users see who posted requests, or keep it more anonymous?
- [ ] **Q15**: What happens if a request goes unanswered for several days? (Auto-close, admin follow-up, stays open?)
- [ ] **Q16**: Should there be a limit on how many open requests one person can have?

### Messaging System
- [ ] **Q17**: Messaging flow clear enough for users? (Offer help → Conversation starts → Exchange contact)
- [ ] **Q18**: Any concerns about how contact exchange works? (Must consent, encrypted, auto-deletes after 90 days)

### Admin Dashboard
- [ ] **Q19**: What admin features are most important day-to-day? (User review, help requests, moderation, content management?)
- [ ] **Q20**: Any missing admin capabilities you'll need at launch?

---

## Section 3: Community Guidelines & Policies (10 min)

### Moderation & Safety
**Current**: Automated detection of profanity, personal info sharing, spam, scams. 4 restriction levels.
- [ ] **Q21**: Should we create a public "Community Guidelines" page explaining rules?
- [ ] **Q22**: Who handles moderation appeals when users dispute restrictions?
- [ ] **Q23**: Urgent/critical help requests - should admins get immediate alerts?

### Legal Requirements
- [ ] **Q24**: **CRITICAL**: Do you have a Terms of Service ready? (Can't launch without one)
- [ ] **Q25**: Has your attorney reviewed the Privacy Policy?
- [ ] **Q26**: Any liability disclaimers or age restrictions we need to clarify?

---

## Section 4: Launch Readiness (10 min)

### Pre-Launch Testing
- [ ] **Q27**: Want a quick beta test Dec 23-29 with a few trusted community members?
- [ ] **Q28**: Launch day: Full public launch or soft launch (invite only initially)?

### Launch Day Plan
- [ ] **Q29**: Launch day communication: How are you announcing? (Social media, email, partners?)
- [ ] **Q30**: Expected initial user count: 10, 25, 50, 100+?
- [ ] **Q31**: Geographic scope: Springfield only, or include Branson/Joplin from day 1?

### Admin Setup
- [ ] **Q32**: Who needs admin accounts at launch? (Get names/emails)
- [ ] **Q33**: Need admin training before launch?

### Custom Domain
- [ ] **Q34**: Keep `care-collective-preview.vercel.app` or use custom domain? (e.g., `carecollective.org`)
- [ ] **Q35**: If custom domain, do you have DNS access to set it up?

---

## Section 5: Post-Launch Support (5 min)

### First Week
- [ ] **Q36**: Who's primary contact for issues in first week?
- [ ] **Q37**: Response time expectations: Immediate for critical bugs, 24 hours for minor issues?
- [ ] **Q38**: Post-launch check-in: Meet 1 week after launch to review how it's going?

### Success Metrics
- [ ] **Q39**: How do you measure success? (User signups, help requests, actual connections made?)
- [ ] **Q40**: First week goal: How many users and help requests?

---

## Section 6: Quick Hits - Need Yes/No (Rapid Fire)

### Technical Quick Wins (Can do this week):
- [ ] **Q41**: Regenerate database type definitions? (Improves code safety, zero user impact) - **30 seconds**
- [ ] **Q42**: Enable password reset via email? (Currently users must contact admin) - **1 hour**
- [ ] **Q43**: Set up basic error monitoring (free Sentry)? (Get alerts if site breaks) - **2 hours**
- [ ] **Q44**: Upgrade Supabase to Pro plan ($25/mo)? (More database space, better performance)

### Content Quick Wins:
- [ ] **Q45**: Review rejection email templates? (Make sure they're kind and clear)
- [ ] **Q46**: Add FAQ page for common user questions?
- [ ] **Q47**: Add "How It Works" guide for new users?

---

## Immediate Action Items

### MUST DO BEFORE JAN 1:
1. [ ] **Terms of Service** - Draft and get legal review
2. [ ] **Privacy Policy** - Get attorney approval
3. [ ] **Admin accounts** - Set up for your team
4. [ ] **Launch communication plan** - Finalize announcement strategy

### THIS WEEK (Client Review):
5. [ ] Review email templates (15 min)
6. [ ] Review landing page copy (10 min)
7. [ ] Confirm help request categories (5 min)
8. [ ] Identify admin team members (5 min)

### DEFERRED TO POST-LAUNCH (January):
- Performance optimization
- Security audit
- Advanced monitoring
- Feature enhancements

---

## What's Already Done ✅

**All core features complete**:
- ✅ Help requests (create, browse, respond)
- ✅ Real-time messaging
- ✅ Contact exchange with consent
- ✅ Admin panel (user management, content moderation, CMS)
- ✅ Email notifications
- ✅ Content moderation (automated safety)
- ✅ Mobile-responsive design
- ✅ Accessibility compliant (WCAG 2.1 AA)
- ✅ Privacy features (encryption, GDPR-ready)
- ✅ Calendar events and community updates

**Platform is launch-ready** - This meeting is about polish and final confirmation.

---

## Meeting Flow (60 minutes)

**0-5 min**: Quick status update, confirm platform is launch-ready
**5-20 min**: Section 1 & 2 - Content and features walkthrough
**20-30 min**: Section 3 - Guidelines and policies discussion
**30-40 min**: Section 4 - Launch planning
**40-50 min**: Section 5 & 6 - Support and quick decisions
**50-60 min**: Review action items, assign owners, next steps

---

## After Meeting

### Your Action Items:
- [ ] Provide Terms of Service (or approve template)
- [ ] Get Privacy Policy attorney approval
- [ ] Provide admin team names/emails
- [ ] Draft launch announcement
- [ ] Review any flagged email templates

### Our Action Items:
- [ ] Address any content changes requested
- [ ] Set up admin accounts
- [ ] Complete approved quick wins
- [ ] Prepare launch day checklist
- [ ] Schedule post-launch check-in

---

*Streamlined questionnaire for 1-hour launch cleanup meeting. Platform is functionally complete - focus is on content polish, final decisions, and launch coordination.*
