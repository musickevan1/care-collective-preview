# Care Collective Beta Test Scenarios

This document provides detailed test scenarios for beta testers. Each scenario walks through a complete user journey to help validate core functionality and identify issues.

---

## 📋 How to Use This Document

1. **Choose scenarios** that match your Week (1 or 2)
2. **Follow the steps** exactly as written
3. **Note any issues** using the bug report button
4. **Check success criteria** - did everything work as expected?
5. **Rate your experience** - how easy/hard was this?

**Don't feel obligated to do ALL scenarios!** Pick the ones that interest you or seem most realistic.

---

## Week 1 Scenarios: Core Functionality

### Scenario 1: First-Time User - Help Seeker Journey

**Goal**: Experience the platform as someone who needs help for the first time

**Estimated Time**: 20-30 minutes

**Steps**:

1. **Initial Login**
   - Go to https://care-collective-preview.vercel.app
   - Click "Sign In"
   - Enter your credentials
   - Verify you land on the dashboard

2. **Complete Profile**
   - Click on profile icon (top right)
   - Add your name: [Use a test name like "Beta Tester 1"]
   - Add your location: [Use any Missouri city - Springfield, Branson, Joplin]
   - Optionally add a profile picture
   - Click "Save" or "Update Profile"
   - Verify changes are saved

3. **Explore Dashboard**
   - Look at the dashboard layout
   - Click through each menu item to see what's there
   - Return to dashboard
   - Check if anything seems confusing

4. **Create Your First Help Request**
   - Navigate to "My Requests" or "Create Request"
   - Click "Create New Request" or similar button
   - Fill in the form:
     - **Title**: "Need help with groceries this week"
     - **Category**: Groceries
     - **Urgency**: Normal
     - **Description**: "I'm recovering from surgery and can't drive. Would appreciate if someone could pick up a few items from the store."
   - Submit the request
   - Verify it appears in your requests list

5. **View Your Request**
   - Click on the request you just created
   - Verify all information displays correctly
   - Check if you can edit it
   - Look for options to update status or delete

**Success Criteria**:
- [ ] Logged in without issues
- [ ] Profile updated successfully
- [ ] Request created and visible
- [ ] All information displays correctly
- [ ] Navigation is intuitive

**Questions to Consider**:
- Was anything confusing during setup?
- Did you know what to do next at each step?
- Did the request form make sense?
- Is it clear what happens after creating a request?

---

### Scenario 2: Helper Journey - Offering Assistance

**Goal**: Experience the platform as someone browsing to help others

**Estimated Time**: 15-20 minutes

**Steps**:

1. **Browse Available Requests**
   - Navigate to "Browse Requests" or "Find Help Requests"
   - Scroll through the list
   - Notice the different categories and urgency levels

2. **Use Filters**
   - Try filtering by category (e.g., "Groceries")
   - Try filtering by urgency (e.g., "Urgent")
   - Try filtering by location (if available)
   - Clear filters and see all requests again

3. **View Request Details**
   - Click on an interesting request
   - Read the full description
   - Check the requester's profile/location
   - Look for urgency indicators

4. **Offer Help**
   - Click "Offer Help" or "I Can Help" button
   - See what happens next (form? message? confirmation?)
   - Complete any required steps
   - Verify your offer was submitted

5. **Track Your Offers**
   - Navigate back to your dashboard or profile
   - Look for a list of requests you've offered help on
   - Verify the request you just helped with appears there
   - Check if there's a way to manage/cancel offers

**Success Criteria**:
- [ ] Could browse requests easily
- [ ] Filters work correctly
- [ ] Request details are informative
- [ ] Offering help is straightforward
- [ ] Can track commitments

**Questions to Consider**:
- Is there enough info to decide if you can help?
- Are urgent requests clearly marked?
- Is the "offer help" process clear?
- Can you easily find your active commitments?

---

### Scenario 3: Basic Messaging

**Goal**: Test the messaging system with another beta tester

**Estimated Time**: 15-20 minutes

**Prerequisites**: Need another beta tester or an existing request

**Steps**:

1. **Start a Conversation**
   - From a help request (yours or someone else's), find the messaging option
   - Click "Send Message" or "Start Conversation"
   - See if a conversation window opens

2. **Send Initial Message**
   - Type a message: "Hi! I saw your request and I'd be happy to help. When would be a good time?"
   - Send the message
   - Verify it appears in the conversation

3. **Check Real-Time Delivery**
   - Wait a moment
   - See if the message shows as "delivered" or "read"
   - If you have another device, open the app and check if message appears

4. **Receive a Response** (if possible)
   - If another tester responds, check if you get a notification
   - Open the conversation
   - Read their response

5. **Continue Conversation**
   - Send a few more messages back and forth
   - Test different message lengths (short and long)
   - Try sending messages quickly in succession

6. **Navigate Away and Back**
   - Leave the conversation (go to dashboard)
   - Return to the conversation
   - Verify message history is preserved

**Success Criteria**:
- [ ] Could start conversation easily
- [ ] Messages send instantly
- [ ] Real-time delivery works
- [ ] Notifications received
- [ ] Message history preserved

**Questions to Consider**:
- Is messaging fast and smooth?
- Are notifications timely?
- Is the conversation easy to follow?
- Can you find old conversations easily?

---

### Scenario 4: Mobile Experience Test

**Goal**: Verify the platform works well on mobile devices

**Estimated Time**: 20-30 minutes

**Prerequisites**: Access to a smartphone or tablet

**Steps**:

1. **Mobile Login**
   - Open your mobile browser (Safari, Chrome, etc.)
   - Navigate to https://care-collective-preview.vercel.app
   - Log in with your credentials
   - Check if the layout adapts to mobile

2. **Test Navigation**
   - Open the menu (hamburger icon or bottom nav)
   - Navigate to each section
   - Verify you can access all features
   - Check if buttons are easy to tap

3. **Create Request on Mobile**
   - Try creating a new help request from your phone
   - Fill in all fields using mobile keyboard
   - Check if form fields are easy to tap and fill
   - Submit and verify it works

4. **Browse and Filter on Mobile**
   - Go to Browse Requests
   - Try using filters on mobile
   - Scroll through the list
   - Tap on a request to view details

5. **Test Messaging on Mobile**
   - Open a conversation
   - Send messages using mobile keyboard
   - Check if keyboard doesn't cover the message input
   - Verify you can scroll through message history

6. **Test Notifications on Mobile**
   - Lock your phone
   - Have someone message you (or trigger another notification)
   - See if you get a push notification
   - Unlock and check if badge/indicator shows

7. **Test Different Orientations**
   - Rotate phone to landscape
   - Check if layout still works
   - Rotate back to portrait
   - Verify everything still functions

**Success Criteria**:
- [ ] Login works on mobile
- [ ] Navigation is smooth
- [ ] All features accessible
- [ ] Touch targets easy to tap
- [ ] Text is readable
- [ ] Keyboard doesn't interfere
- [ ] Notifications work

**Questions to Consider**:
- Is mobile as easy to use as desktop?
- Are any features harder on mobile?
- Is text large enough to read?
- Are buttons easy to tap without mistakes?

---

### Scenario 5: Multiple Request Types

**Goal**: Test creating different kinds of help requests

**Estimated Time**: 20-25 minutes

**Steps**:

Create four different requests to test all categories and urgency levels:

1. **Groceries - Normal Urgency**
   - Title: "Weekly grocery shopping assistance"
   - Category: Groceries
   - Urgency: Normal
   - Description: "Looking for help with weekly grocery shopping. Have a list ready."

2. **Transport - Urgent**
   - Title: "Ride to doctor's appointment tomorrow"
   - Category: Transport
   - Urgency: Urgent
   - Description: "Need a ride to medical appointment at 2 PM tomorrow. About 15 minutes away."

3. **Household - Normal**
   - Title: "Help moving furniture"
   - Category: Household
   - Urgency: Normal
   - Description: "Rearranging my living room, need help moving a couch and bookshelf."

4. **Medical - Critical**
   - Title: "Need medication pickup ASAP"
   - Category: Medical
   - Urgency: Critical
   - Description: "Ran out of essential medication. Pharmacy closes in 2 hours. Need urgent help picking up prescription."

**For Each Request**:
- Create it
- Verify it saves correctly
- Check how it displays in your list
- See if urgency is visually distinct
- Edit the description
- Verify edit saves

**Success Criteria**:
- [ ] All four requests created successfully
- [ ] Each category works correctly
- [ ] Urgency levels are visually distinct
- [ ] Can edit requests after creation
- [ ] Requests are easy to manage

**Questions to Consider**:
- Are the categories clear and comprehensive?
- Do urgency levels make sense?
- Is "critical" visually distinct from "normal"?
- Is any category missing that you'd need?

---

## Week 2 Scenarios: Advanced Features

### Scenario 6: Request Lifecycle Management

**Goal**: Test the complete lifecycle of a help request from creation to completion

**Estimated Time**: 25-30 minutes

**Steps**:

1. **Create a Request**
   - Create a new help request (any category)
   - Note the initial status (should be "Open")

2. **Receive an Offer** (coordinate with another tester if possible)
   - Have someone offer help on your request
   - Check if you receive a notification
   - View the offer details

3. **Accept the Offer**
   - Respond to the helper
   - Start a conversation
   - Communicate about logistics

4. **Update to In Progress**
   - Update the request status to "In Progress"
   - Verify the status change is visible
   - Check if the helper sees the update

5. **Complete the Request**
   - Mark the request as "Closed" or "Completed"
   - See if there's an option to thank the helper
   - Verify the request disappears from "Open" lists

6. **Review History**
   - Go to your completed requests
   - Verify you can see the closed request
   - Check if conversation history is preserved

**Success Criteria**:
- [ ] Status transitions work smoothly
- [ ] Notifications sent at each stage
- [ ] All parties can see status updates
- [ ] Completed requests are properly archived
- [ ] History is maintained

**Questions to Consider**:
- Is the lifecycle clear and intuitive?
- Do you know what to do at each stage?
- Are status updates timely?
- Can you easily track request progress?

---

### Scenario 7: Contact Exchange & Privacy

**Goal**: Test the privacy-focused contact sharing feature

**Estimated Time**: 15-20 minutes

**Prerequisites**: Coordinate with another beta tester

**Steps**:

1. **Initiate Contact Exchange**
   - From an active conversation, look for "Share Contact" option
   - Click to initiate contact exchange
   - Note what information you're asked for

2. **Review Privacy Notice**
   - Read any privacy notice or consent prompt
   - Verify it's clear what you're sharing
   - Check if there's an option to cancel

3. **Grant Consent**
   - Choose what to share (email, phone, or both)
   - Confirm the exchange
   - Verify the other person receives a request

4. **Receive Contact Request** (from other tester)
   - Get a notification about contact exchange request
   - Review what they want to share
   - See if you can deny consent

5. **View Shared Contacts**
   - After exchange is complete, find where shared contact info is stored
   - Verify you can access it when needed
   - Check if it's shown in the conversation

6. **Test Privacy Controls**
   - Go to privacy settings
   - Look for contact sharing history
   - See if you can revoke access
   - Check if there's an audit trail

**Success Criteria**:
- [ ] Contact exchange requires explicit consent
- [ ] Privacy notices are clear
- [ ] You can control what you share
- [ ] Shared info is easily accessible
- [ ] You can revoke access

**Questions to Consider**:
- Do you feel in control of your information?
- Is the consent process clear?
- Is shared contact info easy to find later?
- Are you comfortable with the privacy level?

---

### Scenario 8: Notification Preferences

**Goal**: Test notification system and customization options

**Estimated Time**: 15-20 minutes

**Steps**:

1. **Review Current Notifications**
   - Check your notification center/inbox
   - See what types of notifications you've received
   - Note which ones were helpful vs annoying

2. **Access Notification Settings**
   - Navigate to Settings or Profile
   - Find "Notifications" or "Preferences"
   - Review available options

3. **Customize Preferences**
   - Try disabling some notification types
   - Enable others
   - Set frequency preferences (if available)
   - Save changes

4. **Test Changes**
   - Trigger a notification you disabled (have someone message you)
   - Verify you DON'T receive it
   - Trigger a notification you enabled
   - Verify you DO receive it

5. **Test Different Channels**
   - Check in-app notifications
   - Check email notifications (if applicable)
   - Check push notifications on mobile (if applicable)
   - Verify preferences apply across channels

**Success Criteria**:
- [ ] Notification settings are accessible
- [ ] Changes take effect immediately
- [ ] Can customize granularly
- [ ] Preferences persist across sessions

**Questions to Consider**:
- Are notification options comprehensive?
- Is it easy to control what you receive?
- Are the defaults appropriate?
- Do you feel overwhelmed or underwhelmed by notifications?

---

### Scenario 9: Privacy Dashboard Exploration

**Goal**: Test privacy controls and data management features

**Estimated Time**: 15-20 minutes

**Steps**:

1. **Access Privacy Dashboard**
   - Navigate to Profile → Privacy or Settings → Privacy
   - Review available privacy features

2. **Review Data Collection**
   - Find section showing what data is collected
   - Check if you can see your data
   - Verify explanations are clear

3. **Test Consent Management**
   - Look for consent preferences
   - Try toggling different options
   - Check if changes save properly

4. **View Audit Logs** (if available)
   - Find privacy audit trail
   - See who has accessed your contact info
   - Check when privacy events occurred

5. **Test Data Export** (if available)
   - Look for "Download my data" option
   - Initiate a data export
   - See what format it's in
   - Verify it includes expected information

6. **Review Deletion Options** (DON'T actually delete unless you want to!)
   - Find "Delete account" or "Delete data" options
   - Check if warnings are clear
   - Note what would be deleted
   - Cancel without deleting

**Success Criteria**:
- [ ] Privacy dashboard is accessible
- [ ] Data collection is transparent
- [ ] Consent controls work
- [ ] Audit logs are detailed
- [ ] Export/deletion options available

**Questions to Consider**:
- Do you feel informed about data collection?
- Are privacy controls sufficient?
- Is the audit trail helpful?
- Do you trust the platform with your data?

---

### Scenario 10: Edge Cases & Error Handling

**Goal**: Test how the app handles unusual situations

**Estimated Time**: 20-25 minutes

**Steps**:

1. **Test Empty States**
   - Go to Browse Requests when there are no requests
   - Check Messages when you have no conversations
   - See what displays in these empty states

2. **Test Long Content**
   - Create a request with a very long title (100+ characters)
   - Write a very long description (500+ characters)
   - Send a very long message (1000+ characters)
   - See how UI handles it

3. **Test Special Characters**
   - Use emojis in request title: "Need help 🙏 with groceries 🛒"
   - Use special characters in description: @#$%&*
   - Send messages with links
   - Try pasting formatted text

4. **Test Rapid Actions**
   - Send multiple messages very quickly
   - Create and delete a request immediately
   - Toggle filters rapidly
   - Navigate between pages quickly

5. **Test Offline Behavior** (if mobile)
   - Enable airplane mode
   - Try to send a message
   - Try to create a request
   - See what error messages appear
   - Re-enable connectivity and see if actions complete

6. **Test Browser Navigation**
   - Use browser back button during various flows
   - Refresh page mid-action
   - Open multiple tabs
   - See if state is maintained

**Success Criteria**:
- [ ] Empty states have helpful messages
- [ ] Long content doesn't break UI
- [ ] Special characters work correctly
- [ ] Rapid actions don't cause errors
- [ ] Offline errors are clear
- [ ] Browser navigation works smoothly

**Questions to Consider**:
- Are error messages helpful?
- Does the app recover gracefully from errors?
- Are edge cases handled well?
- Did anything crash or break unexpectedly?

---

## 🎯 Scenario Selection Guide

### If you have limited time (1-2 hours total):

**Week 1**: Do scenarios 1, 2, and 4
**Week 2**: Do scenarios 6 and 7

### If you have moderate time (3-4 hours total):

**Week 1**: Do scenarios 1, 2, 3, 4, and 5
**Week 2**: Do scenarios 6, 7, and 8

### If you want to be thorough (5+ hours):

**Do all scenarios** and feel free to explore beyond them!

---

## 📝 Tracking Your Progress

After completing each scenario:

1. **Rate the experience** (1-5 stars)
2. **Note any bugs** via bug report button
3. **Write down suggestions** for improvements
4. **Check off** completed scenarios below

### My Progress Checklist

**Week 1**:
- [ ] Scenario 1: First-Time User Journey
- [ ] Scenario 2: Helper Journey
- [ ] Scenario 3: Basic Messaging
- [ ] Scenario 4: Mobile Experience
- [ ] Scenario 5: Multiple Request Types

**Week 2**:
- [ ] Scenario 6: Request Lifecycle
- [ ] Scenario 7: Contact Exchange & Privacy
- [ ] Scenario 8: Notification Preferences
- [ ] Scenario 9: Privacy Dashboard
- [ ] Scenario 10: Edge Cases & Errors

---

## 💡 Beyond the Scenarios

Feel free to:
- Create your own scenarios based on real needs
- Test features not covered here
- Explore every corner of the app
- Try to break things (in a constructive way!)
- Compare with similar platforms you've used

**The more you explore, the more valuable your feedback!**

---

**Questions about scenarios?** Contact [SUPPORT_EMAIL]

**Found issues while testing?** Use the bug report button!

---

**Last Updated**: November 2, 2025
**Version**: 1.0

*Care Collective - Building community through mutual aid and technology*
