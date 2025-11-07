# Care Collective Beta Testing Guide

**Version 1.0 - Beta Launch**
**Platform:** https://care-collective-preview.vercel.app

---

## Table of Contents

1. [Welcome to Beta Testing](#welcome-to-beta-testing)
2. [Platform Overview](#platform-overview)
3. [Key Features to Test](#key-features-to-test)
4. [Testing Scenarios](#testing-scenarios)
5. [How to Report Issues](#how-to-report-issues)
6. [Beta Testing Best Practices](#beta-testing-best-practices)
7. [FAQ](#faq)

---

## Welcome to Beta Testing

Thank you for joining the Care Collective beta test! Your role as a beta tester is crucial in helping us:

- **Identify bugs** and technical issues
- **Validate user experience** and interface design
- **Test real-world scenarios** for mutual aid coordination
- **Ensure privacy and safety** features work correctly
- **Verify accessibility** for all community members

This guide will help you understand what to test and how to provide effective feedback.

---

## Platform Overview

### What is Care Collective?

Care Collective is a mutual aid platform connecting community members in Springfield, MO. The platform enables:

- **Help Requests:** Post needs for groceries, transportation, household tasks, medical assistance, and more
- **Community Response:** Browse and respond to help requests from neighbors
- **Secure Messaging:** Private communication between helpers and those in need
- **Privacy Protection:** Consent-based contact sharing and verification
- **Trust & Safety:** User verification and moderation tools

### Core Values

- **Accessibility:** WCAG 2.1 AA compliant, mobile-first design
- **Privacy:** No contact info shared without explicit consent
- **Community-Focused:** Built for mutual aid, not transactions
- **Inclusivity:** Simple, crisis-friendly interface

---

## Key Features to Test

### 1. User Authentication & Profile
**What to test:**
- Sign in with provided credentials
- Change password in profile settings
- Update profile information (name, location)
- View your profile

**What to look for:**
- Can you log in successfully?
- Is the password change process clear?
- Does your profile save correctly?

---

### 2. Dashboard
**What to test:**
- Navigate to the dashboard after login
- View open help requests
- Check notification system (if available)
- Mobile vs desktop views

**What to look for:**
- Is important information easy to find?
- Are help requests displayed clearly?
- Does the mobile view work well on your phone?

---

### 3. Help Requests

#### Creating Requests
**What to test:**
- Click "New Request" or "Post Request"
- Fill out the form with:
  - Title (clear, specific)
  - Description (optional details)
  - Category (groceries, transport, household, medical, other)
  - Urgency (normal, urgent, critical)
- Submit the request

**What to look for:**
- Is the form intuitive?
- Are categories clear?
- Does urgency make sense?
- Can you submit successfully?

#### Responding to Requests
**What to test:**
- Browse open help requests
- Click to view details
- Offer to help
- Contact exchange process

**What to look for:**
- Can you easily find relevant requests?
- Are details clear and complete?
- Is the "offer help" process smooth?
- Does contact sharing require consent?

---

### 4. Messaging System
**What to test:**
- Send messages to other beta testers
- Receive and read messages
- View conversation history
- Mobile messaging experience

**What to look for:**
- Do messages send/receive in real-time?
- Is the interface intuitive?
- Can you find past conversations easily?
- Does it work on mobile?

---

### 5. Privacy & Contact Sharing
**What to test:**
- Initiate contact exchange from a help request
- Review consent process
- Share contact information
- Verify privacy protections

**What to look for:**
- Is consent clearly requested?
- Can you understand what's being shared?
- Is it easy to approve/decline?
- Do you feel your privacy is protected?

---

### 6. Accessibility Testing
**What to test:**
- Navigate using keyboard only (Tab, Enter, Esc)
- Use a screen reader if available
- Test on mobile device
- Check color contrast and text size

**What to look for:**
- Can you complete tasks without a mouse?
- Are all elements properly labeled?
- Is text readable?
- Are touch targets large enough on mobile (44px minimum)?

---

### 7. Bug Reporting
**What to test:**
- Click the bug icon (🐛) in navigation
- Fill out bug report form
- Submit a test report

**What to look for:**
- Is the bug reporter easy to find?
- Can you describe issues clearly?
- Does submission work?

---

## Testing Scenarios

### Scenario 1: New User Journey
**Goal:** Experience the platform as a first-time user

1. Log in for the first time
2. Update your profile
3. Browse existing help requests
4. Create your first help request
5. Respond to someone else's request

**Questions to consider:**
- Is onboarding clear?
- Can you figure out what to do without instructions?
- What was confusing?

---

### Scenario 2: Helper Workflow
**Goal:** Test the experience of offering help

1. Log in to dashboard
2. Browse open requests
3. Find a request you can help with
4. View request details
5. Offer help and initiate contact
6. Exchange messages with requester

**Questions to consider:**
- Can you easily find requests to help with?
- Is the contact process clear?
- Does messaging work smoothly?

---

### Scenario 3: Requester Workflow
**Goal:** Test the experience of asking for help

1. Create a new help request
2. Make it urgent or critical
3. Wait for responses
4. Review helper offers
5. Accept help and share contact info
6. Mark request as complete

**Questions to consider:**
- Is creating a request easy during stress?
- Are urgency levels clear?
- Can you manage responses effectively?

---

### Scenario 4: Mobile Experience
**Goal:** Test platform on mobile devices

1. Access platform on your phone
2. Complete all core tasks (browse, request, message)
3. Test both portrait and landscape orientations
4. Try with poor internet connection

**Questions to consider:**
- Is everything readable on mobile?
- Are buttons/links easy to tap?
- Does it work with slow internet?

---

### Scenario 5: Privacy & Safety
**Goal:** Verify privacy protections work

1. Create a help request (don't share real sensitive info)
2. Review what information is visible publicly
3. Offer help to someone's request
4. Go through contact exchange
5. Verify consent requirements

**Questions to consider:**
- Is your contact info protected until you share it?
- Is consent clear and explicit?
- Do you feel safe using the platform?

---

## How to Report Issues

### Using the Bug Reporter (Recommended)
1. Click the bug icon (🐛) in the navigation bar
2. Fill out the form:
   - **Title:** Brief description (e.g., "Can't submit help request")
   - **Description:** Detailed steps to reproduce
   - **Category:** Bug, Feature Request, or Feedback
   - **Priority:** Low, Medium, High
3. Submit the report

**Technical details are automatically collected:**
- Browser type and version
- Device information
- Current page URL
- Error logs (if any)

### Via Email
Send detailed feedback to: **evanmusick.dev@gmail.com**

Include:
- What you were trying to do
- What happened instead
- Steps to reproduce
- Screenshots (if helpful)
- Device/browser you were using

---

## Beta Testing Best Practices

### DO:
✅ **Test thoroughly** - Try to break things!
✅ **Be specific** - "Button doesn't work" vs "Submit button on help request form doesn't respond when clicked"
✅ **Include steps** - How can we reproduce the issue?
✅ **Test on multiple devices** - Mobile and desktop behave differently
✅ **Think about real users** - Would this work for someone in crisis?
✅ **Report positive things too** - What works well?

### DON'T:
❌ **Use for real emergencies** - This is still a test environment
❌ **Share real sensitive information** - Use test data only
❌ **Assume something is "just you"** - If you found it confusing, others will too
❌ **Hold back feedback** - All input is valuable!

---

## What We're Looking For

### Critical Issues (Report Immediately)
- **Security/Privacy concerns** - Contact info leaked, unauthorized access
- **Complete feature failures** - Can't log in, can't submit requests
- **Data loss** - Information not saving
- **Accessibility blockers** - Can't complete tasks with assistive technology

### Important Issues (Report Soon)
- **Confusing user experience** - Unclear navigation, missing instructions
- **Mobile problems** - Elements too small, poor layouts
- **Performance issues** - Slow loading, freezing
- **Minor bugs** - Cosmetic issues, typos

### Nice-to-Have Feedback
- **Feature suggestions** - "It would be great if..."
- **Design preferences** - Colors, layout, wording
- **Workflow improvements** - "It would be easier if..."

---

## FAQ

### How long is the beta period?
Approximately 2-4 weeks, depending on feedback and issues found.

### How much time should I spend testing?
As much as you can! We'd love at least 30 minutes of exploration, but more is always appreciated.

### What if I find a major bug?
Report it immediately using the bug reporter or email evanmusick.dev@gmail.com

### Can I use this for real help requests?
Not yet! This is a test environment. Wait for the official launch for real community use.

### What happens to my test data after beta?
All beta test data may be wiped before the official launch. Don't rely on anything persisting.

### Can I share the platform with others?
Please don't during beta. We have a controlled group to ensure quality feedback.

### What if I can't access the platform?
Contact evanmusick.dev@gmail.com or Maureen at MaureenTempleman@MissouriState.edu

### Do I need special equipment?
No! Just a device (phone, tablet, or computer) with internet access.

### What browsers should I test on?
Any modern browser (Chrome, Firefox, Safari, Edge). If you use something else, that's valuable testing too!

### How will my feedback be used?
To fix bugs, improve user experience, and prepare for public launch. Your input directly shapes the final product!

---

## Contact & Support

**Technical Issues:** evanmusick.dev@gmail.com
**Platform Questions:** MaureenTempleman@MissouriState.edu
**Bug Reports:** Use in-app bug reporter or email

---

## Thank You!

Your participation makes Care Collective better for everyone in our community. We deeply appreciate your time, insights, and commitment to building a platform that truly serves Springfield residents.

Let's build something amazing together! 🤝

---

**Care Collective Beta Testing Team**
*Building community, one connection at a time*
