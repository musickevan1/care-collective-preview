# Basic User Flow Testing Examples

This document provides practical, executable examples for testing Care Collective's core user flows using Playwright MCP server integration with Claude Code.

## Quick Start Example

### Example 1: Homepage to Help Request Flow

This is a simple example to get started with Playwright MCP testing for Care Collective.

```markdown
## Test: New User Creates First Help Request

Hi Claude Code, I'd like to test the core user flow for creating a help request in Care Collective. Please help me test this step by step:

### Step 1: Navigate and Take Screenshot
1. Navigate to http://localhost:3000
2. Take a screenshot to document the homepage
3. Verify the page title contains "Care Collective"

### Step 2: Navigate to Request Creation
1. Click on the "Create Request" or "Get Help" button
2. Verify the URL changes to /requests/new
3. Take a screenshot of the request creation form

### Step 3: Fill and Submit Form
1. Fill out the help request form:
   - Title: "Need groceries during flu recovery"
   - Description: "I'm recovering from flu and can't get out to shop for basic necessities"
   - Category: Select "groceries"
   - Urgency: Select "normal"
2. Click the submit button
3. Verify successful submission (redirect or success message)

### Step 4: Verify Request Appears
1. Navigate to /requests
2. Verify the new request appears in the listings
3. Take a screenshot showing the request in the list

Please let me know what you find at each step, including any issues or unexpected behavior.
```

**Expected Claude Code Response Pattern:**
Claude Code will execute each step, take screenshots, and report on the success/failure of each action, providing detailed feedback about the user flow.

---

## Accessibility Testing Example

### Example 2: Screen Reader Navigation Test

```markdown
## Test: Keyboard and Screen Reader Navigation

Hi Claude Code, I need to test the accessibility of the help request browsing page. Please help me verify WCAG compliance:

### Step 1: Initial Page Assessment
1. Navigate to http://localhost:3000/requests
2. Take an accessibility snapshot of the page
3. Run an axe-core accessibility scan to check for violations

### Step 2: Keyboard Navigation Testing
1. Use Tab key to navigate through all interactive elements
2. Verify each element receives visible focus indicators
3. Check that the tab order is logical (top to bottom, left to right)
4. Take screenshots showing focus indicators on key elements

### Step 3: Heading Structure Verification
1. Use the browser evaluate function to check heading structure:
   ```javascript
   () => {
     const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
     return Array.from(headings).map((h, index) => ({
       level: h.tagName.toLowerCase(),
       text: h.textContent.trim().substring(0, 50),
       order: index
     }));
   }
   ```
2. Verify heading hierarchy is logical and sequential

### Step 4: Form Accessibility Check
1. Navigate to any help request detail page
2. Check that all form elements have proper labels
3. Verify error messages (if any) are associated with form fields
4. Test that required fields are properly marked

Please report any accessibility violations found and suggest fixes if needed.
```

---

## Mobile Testing Example

### Example 3: Mobile Device Simulation

```markdown
## Test: Mobile Help Request Creation

Hi Claude Code, I need to test how the help request creation works on mobile devices:

### Step 1: Set Mobile Device Simulation
1. Resize the browser to iPhone SE dimensions (375x667px)
2. Navigate to http://localhost:3000
3. Take a screenshot showing the mobile homepage layout

### Step 2: Mobile Navigation Testing
1. Test the mobile navigation menu (hamburger menu if present)
2. Navigate to the request creation page (/requests/new)
3. Verify the form is properly sized for mobile viewing

### Step 3: Mobile Form Interaction
1. Test form input on mobile:
   - Tap in the title field
   - Verify virtual keyboard doesn't obscure the form
   - Type: "Need help with grocery shopping"
   - Move to description field and add details
2. Test dropdown/select interactions:
   - Tap the category dropdown
   - Select "groceries" option
   - Verify selection works properly on mobile

### Step 4: Mobile Touch Target Testing
1. Verify all interactive elements are at least 44px in size
2. Test button tapping (submit button)
3. Check that touch targets have adequate spacing (no accidental taps)

### Step 5: Mobile Performance Check
1. Measure page load time on mobile simulation
2. Test scrolling performance (should be smooth)
3. Verify responsive design works at mobile width

Please report on mobile usability and any issues with touch interactions.
```

---

## Privacy Testing Example

### Example 4: Contact Information Protection Test

```markdown
## Test: Contact Exchange Privacy Protection

Hi Claude Code, I need to verify that contact information is properly protected in Care Collective:

### Step 1: Unauthorized Access Testing
1. Navigate to a help request detail page (any request)
2. Verify that no contact information is visible:
   - No email addresses displayed
   - No phone numbers shown
   - Only general location info (city/state level)
3. Take a screenshot showing the protected view

### Step 2: JavaScript Console Testing
1. Use the browser evaluate function to scan for contact information:
   ```javascript
   () => {
     const bodyText = document.body.innerText;
     const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
     const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;

     return {
       hasEmail: emailPattern.test(bodyText),
       hasPhone: phonePattern.test(bodyText),
       bodyLength: bodyText.length,
       hiddenElements: document.querySelectorAll('[style*="display: none"]').length
     };
   }
   ```
2. Verify that no contact information is exposed in the DOM

### Step 3: Offer Help Flow Testing
1. Click the "Offer Help" button (if present)
2. Verify that a consent dialog or form appears
3. Check that the consent process clearly explains what information will be shared
4. Take a screenshot of the consent interface

### Step 4: Contact Exchange Process
1. Go through the consent process (if test environment allows)
2. Verify that contact information only becomes visible after explicit consent
3. Test that other users cannot see the exchanged contact information
4. Document the privacy protection mechanisms in place

Please report on the effectiveness of privacy protections and any potential privacy leaks.
```

---

## Error Handling Example

### Example 5: Network Failure Recovery Test

```markdown
## Test: Help Request Creation with Network Issues

Hi Claude Code, I need to test how the platform handles network failures during help request creation:

### Step 1: Normal Form Filling
1. Navigate to http://localhost:3000/requests/new
2. Begin filling out the help request form:
   - Title: "Test network resilience request"
   - Description: "Testing how the platform handles network issues"
   - Category: "other"

### Step 2: Simulate Network Disconnection
1. Before submitting, simulate network issues by waiting for timeout
2. Attempt to submit the form
3. Verify that appropriate error messages appear
4. Check that form data is preserved (not lost due to network error)

### Step 3: Error Message Testing
1. Verify error messages are:
   - Clear and understandable (no technical jargon)
   - Accessible to screen readers
   - Provide guidance on how to resolve the issue
2. Take a screenshot of the error state

### Step 4: Recovery Testing
1. Test the retry mechanism (if available)
2. Verify that when network is restored, the form can be submitted
3. Check that no duplicate submissions occur
4. Confirm successful submission after network recovery

### Step 5: User Experience Validation
1. Verify that loading states are clearly communicated
2. Check that users can't accidentally submit multiple times
3. Test that the overall experience is not frustrating during network issues

Please document how well the platform handles network failures and suggest improvements if needed.
```

---

## Performance Testing Example

### Example 6: Page Load Performance Test

```markdown
## Test: Care Collective Performance Benchmarks

Hi Claude Code, I need to measure the performance of key Care Collective pages:

### Step 1: Homepage Performance
1. Navigate to http://localhost:3000
2. Use the browser evaluate function to measure performance:
   ```javascript
   () => {
     return {
       loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
       domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
       firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 'not available',
       resourceCount: performance.getEntriesByType('resource').length
     };
   }
   ```
3. Document the loading times

### Step 2: Help Requests Page Performance
1. Navigate to http://localhost:3000/requests
2. Measure load time for the requests listing page
3. Test scrolling performance (should be smooth)
4. Count the number of help requests displayed

### Step 3: Mobile Performance Testing
1. Resize browser to mobile dimensions (375x667px)
2. Re-test the same pages on mobile simulation
3. Compare performance between desktop and mobile
4. Document any performance differences

### Step 4: Performance Benchmarks
1. Compare results against Care Collective performance standards:
   - Homepage: < 3 seconds load time
   - Requests page: < 4 seconds load time
   - Mobile: Within 20% of desktop performance
2. Report whether benchmarks are met
3. Identify any performance bottlenecks

Please provide detailed performance measurements and recommendations for improvement.
```

---

## Cross-Browser Testing Example

### Example 7: Browser Compatibility Test

```markdown
## Test: Cross-Browser Functionality

Hi Claude Code, I need to test Care Collective functionality across different browsers:

### Step 1: Core Functionality Test
1. Test the same help request creation flow in multiple browsers:
   - Chrome/Chromium (primary)
   - Firefox (if available)
   - Safari simulation (if possible)
2. Document any browser-specific differences

### Step 2: CSS and Layout Testing
1. Take screenshots of the same page in different browsers
2. Compare layout consistency
3. Check for any styling issues or rendering differences
4. Test responsive design behavior across browsers

### Step 3: JavaScript Functionality
1. Test interactive features in each browser:
   - Form submission
   - Button clicks
   - Any dynamic content
2. Use browser console to check for JavaScript errors
3. Document any browser-specific JavaScript issues

### Step 4: Accessibility Across Browsers
1. Test keyboard navigation in each browser
2. Check screen reader compatibility (if possible)
3. Verify that accessibility features work consistently
4. Document any accessibility differences between browsers

Please report on browser compatibility and any issues that need to be addressed for cross-browser support.
```

---

## How to Use These Examples

### Getting Started
1. **Choose an Example**: Start with the Basic User Flow example
2. **Copy the Test**: Copy the markdown test description
3. **Execute with Claude Code**: Paste into Claude Code and ask for execution
4. **Review Results**: Analyze the results and screenshots provided
5. **Document Issues**: Note any problems found for development team

### Customization Tips
- **Modify URLs**: Change localhost:3000 to your actual development URL
- **Adjust Test Data**: Use realistic data that matches your test database
- **Add Specific Checks**: Include additional verification steps for your use case
- **Combine Examples**: Mix and match elements from different examples

### Best Practices
- **Start Simple**: Begin with basic examples before attempting complex scenarios
- **Document Everything**: Take screenshots and notes at each step
- **Test Regularly**: Run these tests frequently during development
- **Share Results**: Communicate findings with the development team
- **Update Examples**: Keep examples current as the platform evolves

---

*These examples provide practical, executable patterns for testing Care Collective with Playwright MCP, ensuring comprehensive coverage of functionality, accessibility, performance, and user experience.*