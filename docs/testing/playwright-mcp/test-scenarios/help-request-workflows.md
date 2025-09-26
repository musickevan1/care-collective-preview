# Help Request Workflows - Playwright MCP Test Scenarios

This document provides comprehensive test scenarios for the core help request workflows in Care Collective, designed for execution through Playwright MCP server integration with Claude Code.

## Overview

Help requests are the heart of the Care Collective platform. These test scenarios ensure the complete lifecycle from request creation to resolution works reliably, accessibly, and securely for community members.

## Core Workflow Test Scenarios

### Scenario 1: Complete Help Request Lifecycle

**User Story**: "Sarah needs groceries during illness and receives help from Tom"

#### Context
- **Primary User**: Sarah (67, mobile user, uses screen reader)
- **Helper User**: Tom (34, desktop user)
- **Location**: Springfield, MO
- **Urgency**: Normal (non-emergency)
- **Category**: Groceries

#### Test Steps

```markdown
## Phase 1: Request Creation (Sarah's Journey)

### Step 1: Initial Access & Registration
1. Navigate to http://localhost:3000
2. Verify homepage loads with proper accessibility structure
3. Take screenshot for documentation
4. Click "Get Started" or "Sign Up" button
5. Verify registration form accessibility:
   - All form fields have proper labels
   - Tab order is logical
   - Error messages are announced by screen readers
6. Complete registration with test data:
   - Email: sarah.test@carecollective.test
   - Name: Sarah Johnson
   - Location: Springfield, MO
7. Verify email verification flow (if applicable)
8. Complete profile setup

### Step 2: Help Request Creation
1. Navigate to /requests/new
2. Verify the create request form is accessible:
   - Keyboard navigation works throughout
   - All fields have appropriate labels
   - Form validation messages are clear
3. Fill out help request form:
   - Title: "Need groceries during flu recovery"
   - Description: "I'm recovering from flu and can't get out to shop. Need basic groceries including milk, bread, and canned soup."
   - Category: Select "groceries"
   - Urgency: Select "normal"
4. Submit form and verify:
   - Success message is displayed
   - User is redirected appropriately
   - Request appears in listings

### Step 3: Verify Request Display
1. Navigate to /requests
2. Verify Sarah's request appears in listings
3. Check request card displays:
   - Title and description
   - Category and urgency indicators
   - User information (name, general location)
   - Created date/time
   - NO contact information visible
4. Verify accessibility of request cards:
   - Screen reader can navigate between requests
   - All information is properly labeled
   - Interactive elements have appropriate roles

## Phase 2: Helper Response (Tom's Journey)

### Step 4: Helper Registration & Login
1. Open new browser session (simulate different user)
2. Navigate to http://localhost:3000
3. Register new helper account:
   - Email: tom.helper@carecollective.test
   - Name: Tom Smith
   - Location: Springfield, MO
4. Complete profile setup

### Step 5: Browse and Discover Requests
1. Navigate to /requests
2. Verify all open requests are displayed
3. Browse to find Sarah's grocery request
4. Click on Sarah's request to view details
5. Navigate to /requests/[sarah-request-id]
6. Verify request detail page shows:
   - Full request information
   - Map or location context (if applicable)
   - "Offer Help" button prominently displayed
   - NO contact information visible yet

### Step 6: Offer Help Process
1. Click "Offer Help" button
2. Verify consent dialog appears explaining contact exchange
3. Review consent dialog content:
   - Clear explanation of information sharing
   - What contact info will be shared
   - User's rights and responsibilities
4. Confirm consent to proceed
5. Verify contact exchange form appears:
   - Message field for initial contact
   - Contact method selection
   - Clear consent checkboxes
6. Fill contact exchange form:
   - Message: "Hi Sarah, I can help with your groceries. I'm available this afternoon to shop and deliver. What time works best for you?"
   - Contact method: Email
   - Confirm all consent checkboxes
7. Submit contact exchange request

## Phase 3: Contact Exchange & Communication

### Step 7: Sarah Receives Help Offer (Sarah's session)
1. Return to Sarah's browser session
2. Navigate to dashboard or notifications
3. Verify notification of help offer
4. Review Tom's offer message
5. Verify Sarah can see Tom's contact information
6. Verify Tom's message displays appropriately

### Step 8: Initial Communication
1. Verify both users can now see shared contact information
2. Test communication initiation (email or in-app messaging)
3. Verify contact information is properly protected:
   - Only visible to request creator and approved helper
   - Not visible to other platform users
   - Audit trail created for contact sharing

## Phase 4: Request Resolution

### Step 9: Mark Request in Progress
1. In Sarah's session, navigate to her request
2. Verify option to mark request "in progress"
3. Update request status to "in progress"
4. Verify status change is reflected in:
   - Request detail page
   - Request listings
   - Dashboard/notifications

### Step 10: Complete Request
1. After simulated help completion, mark request as "completed"
2. Verify completion workflow:
   - Confirmation dialog for completion
   - Optional feedback/rating system
   - Status update to "completed"
3. Verify completed request behavior:
   - No longer appears in "open" request listings
   - Visible in user's request history
   - Contact information remains accessible to participants

### Step 11: Post-Completion Verification
1. Verify request history tracking:
   - Both users can see completed request in history
   - Contact exchange audit trail preserved
   - Community impact metrics updated
2. Test cleanup and privacy:
   - Verify no unnecessary data retention
   - Contact information properly archived
   - User privacy preferences respected
```

#### Accessibility Verification Points

Throughout the entire workflow, verify:

- **Screen Reader Compatibility**: All content properly announced
- **Keyboard Navigation**: Complete functionality without mouse
- **Focus Management**: Clear focus indicators and logical tab order
- **Color Contrast**: All text meets WCAG 2.1 AA standards (4.5:1)
- **Touch Targets**: All interactive elements minimum 44px
- **Error Handling**: Clear, accessible error messages
- **Form Labels**: All inputs properly labeled and described

#### Privacy & Security Verification Points

- **Contact Protection**: Information only visible after explicit consent
- **Data Minimization**: Only necessary information collected and displayed
- **Consent Tracking**: All privacy decisions properly logged
- **Secure Communication**: Contact exchange properly encrypted
- **Audit Trails**: All sensitive operations logged for security

#### Mobile Experience Verification

- **Responsive Design**: Layout adapts properly to mobile screens
- **Touch Interactions**: All buttons and links respond to touch
- **Performance**: Pages load within acceptable timeframes
- **Offline Capability**: Core functionality works with poor connectivity

---

### Scenario 2: Urgent/Critical Request Workflow

**User Story**: "Maria needs emergency medical transportation"

#### Context
- **User**: Maria (45, mobile user, high contrast needs)
- **Request Type**: Medical emergency
- **Urgency**: Critical
- **Location**: Branson, MO
- **Time Sensitivity**: Immediate response needed

#### Test Steps

```markdown
## Critical Request Creation and Response

### Step 1: Emergency Request Creation
1. Navigate to /requests/new
2. Test urgent request creation flow:
   - Title: "Need immediate ride to emergency room"
   - Description: "Medical emergency - need transportation to hospital immediately"
   - Category: "medical"
   - Urgency: "critical"
3. Verify critical urgency triggers:
   - Immediate validation and submission
   - Prominent display in request listings
   - Priority notification systems (if applicable)
4. Verify emergency request displays with:
   - Clear urgency indicators (color, icons, text)
   - Prominent placement in listings
   - Clear call-to-action for helpers

### Step 2: Emergency Response Flow
1. Test helper's view of critical request:
   - Request appears at top of listings
   - Visual urgency indicators clear and accessible
   - Quick response mechanisms available
2. Verify expedited contact exchange:
   - Streamlined consent process for emergencies
   - Faster contact information sharing
   - Clear emergency communication channels

### Step 3: Emergency Communication
1. Test immediate communication capabilities:
   - Phone contact information prioritized
   - Quick message templates for emergency response
   - Clear emergency protocol information
2. Verify emergency request tracking:
   - Status updates for emergency situations
   - Resolution tracking for critical requests
   - Follow-up mechanisms for emergency responders
```

---

### Scenario 3: Multiple Helper Response

**User Story**: "John needs household repairs and multiple neighbors offer help"

#### Context
- **Requester**: John (52, desktop user)
- **Request Type**: Household repairs
- **Multiple Helpers**: 3 community members offer assistance
- **Coordination Challenge**: Managing multiple offers

#### Test Steps

```markdown
## Multi-Helper Coordination

### Step 1: Request with Multiple Responses
1. Create household repair request
2. Simulate multiple helper responses:
   - Helper 1: Offers plumbing expertise
   - Helper 2: Offers electrical work knowledge
   - Helper 3: Offers general labor assistance

### Step 2: Helper Coordination Interface
1. Test requester's view of multiple offers:
   - Clear display of all helper offers
   - Ability to review each helper's message
   - Coordination tools for multiple helpers
2. Verify helper selection/communication:
   - Ability to accept multiple helpers
   - Communication coordination between helpers
   - Clear coordination of responsibilities

### Step 3: Multi-Helper Resolution
1. Test completion with multiple helpers:
   - Tracking individual helper contributions
   - Completion workflow with multiple participants
   - Recognition/feedback for all helpers
```

---

## Error Scenarios & Edge Cases

### Network Failure Recovery

```markdown
## Test: Request Creation with Network Issues

1. Begin help request creation
2. Simulate network disconnection during form submission
3. Verify:
   - Form data preservation
   - Clear error messaging
   - Recovery options provided
   - Accessibility of error states
4. Test reconnection and retry:
   - Automatic retry mechanisms
   - Manual retry options
   - Data integrity after recovery
```

### Invalid Data Handling

```markdown
## Test: Form Validation and Error Handling

1. Test request creation with invalid data:
   - Empty required fields
   - Inappropriate content
   - Invalid location information
   - Extremely long text inputs
2. Verify error handling:
   - Clear validation messages
   - Accessible error announcements
   - Guidance for correction
   - Prevention of submission with errors
```

### Browser Compatibility

```markdown
## Test: Cross-Browser Help Request Workflow

1. Execute core help request workflow in:
   - Chrome/Chromium
   - Firefox
   - Safari (if available)
   - Mobile browsers
2. Verify consistent functionality:
   - Form submission works across browsers
   - Display consistency maintained
   - Interactive elements function properly
   - Accessibility features work universally
```

---

## Performance Benchmarks

### Page Load Requirements

- **Homepage**: < 2 seconds initial load
- **Request Listings**: < 3 seconds with 50+ requests
- **Request Creation**: < 1 second form responsiveness
- **Request Detail**: < 2 seconds individual request load

### Mobile Performance

- **Touch Response**: < 100ms touch-to-visual-feedback
- **Scroll Performance**: Smooth 60fps scrolling
- **Form Input**: < 200ms input-to-display response
- **Navigation**: < 500ms page-to-page transitions

---

## Success Criteria

### Functional Requirements
✅ All help request lifecycle steps complete successfully
✅ Contact exchange privacy protection works correctly
✅ Multi-user workflows coordinate properly
✅ Emergency/urgent requests receive priority treatment
✅ Error conditions handled gracefully

### Accessibility Requirements
✅ WCAG 2.1 AA compliance maintained throughout
✅ Screen reader users can complete all workflows
✅ Keyboard-only users have full functionality
✅ Color contrast meets minimum standards
✅ Touch targets meet 44px minimum requirements

### Privacy & Security Requirements
✅ Contact information properly protected until consent
✅ User data minimization principles followed
✅ Consent flows clear and legally compliant
✅ Audit trails created for sensitive operations
✅ Data retention policies properly implemented

### Performance Requirements
✅ All page loads meet performance benchmarks
✅ Mobile experience responsive and efficient
✅ Network failure recovery works reliably
✅ High-traffic scenarios handled appropriately

---

*These test scenarios ensure the Care Collective help request workflows serve community members reliably, accessibly, and safely in their times of need.*