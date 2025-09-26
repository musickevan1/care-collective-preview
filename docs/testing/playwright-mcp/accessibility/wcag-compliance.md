# WCAG 2.1 AA Compliance Testing with Playwright MCP

This document provides comprehensive guidance for testing WCAG 2.1 AA accessibility compliance in the Care Collective platform using Playwright MCP server integration.

## Overview

Care Collective's commitment to accessibility is non-negotiable. This testing framework ensures WCAG 2.1 AA compliance throughout the platform, making mutual aid accessible to all community members regardless of their abilities or assistive technology needs.

## Accessibility Testing Philosophy

### Inclusive Design Principles
- **Perceivable**: Information must be presentable in ways users can perceive
- **Operable**: Interface components must be operable by all users
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for various assistive technologies

### Care Collective Accessibility Requirements
- **Community Access**: Platform accessible to elderly community members
- **Crisis Accessibility**: Clear, simple interfaces for emergency situations
- **Diverse Abilities**: Support for various visual, auditory, and motor capabilities
- **Technology Flexibility**: Works with screen readers, keyboard navigation, voice control

## WCAG 2.1 AA Testing Framework

### Level A Compliance (Foundation)

#### 1.1 Text Alternatives
**Requirement**: All non-text content has text alternatives

```markdown
## Test: Image Alt Text and Meaningful Content

### Test Steps:
1. Navigate to each page of Care Collective
2. Use Playwright MCP to evaluate all images:
   - Verify all `<img>` elements have `alt` attributes
   - Check alt text is descriptive and meaningful
   - Verify decorative images have empty alt="" attributes
3. Test icon usage:
   - All informational icons have text labels
   - Status indicators include text descriptions
   - Navigation icons include accessible names

### Playwright MCP Commands:
1. Navigate to http://localhost:3000
2. Take accessibility snapshot
3. Evaluate JavaScript to check all images:
   ```javascript
   () => {
     const images = document.querySelectorAll('img');
     return Array.from(images).map(img => ({
       src: img.src,
       alt: img.alt,
       hasAlt: img.hasAttribute('alt'),
       isEmpty: img.alt === '',
       isDecorative: img.getAttribute('role') === 'presentation'
     }));
   }
   ```
4. Verify results show 100% compliance

### Success Criteria:
✅ All informational images have meaningful alt text
✅ Decorative images have empty alt attributes
✅ Complex images have detailed descriptions
✅ No missing alt attributes on any images
```

#### 1.3 Adaptable Content
**Requirement**: Content can be presented in different ways without losing meaning

```markdown
## Test: Semantic Structure and Reading Order

### Test Steps:
1. Navigate to help request listing page
2. Verify semantic HTML structure:
   - Proper heading hierarchy (h1 → h2 → h3)
   - Lists use appropriate list markup
   - Forms use proper form controls and labels
3. Test reading order:
   - Content makes sense when linearized
   - Tab order follows logical reading sequence
   - Screen reader announcement order is logical

### Playwright MCP Commands:
1. Navigate to /requests
2. Take accessibility snapshot
3. Evaluate heading structure:
   ```javascript
   () => {
     const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
     return Array.from(headings).map((h, index) => ({
       level: h.tagName.toLowerCase(),
       text: h.textContent.trim(),
       order: index
     }));
   }
   ```
4. Verify logical heading hierarchy

### Success Criteria:
✅ Heading hierarchy is logical and sequential
✅ Lists properly marked up with ul/ol/dl
✅ Form controls properly labeled and structured
✅ Reading order is logical without CSS
```

#### 2.1 Keyboard Accessible
**Requirement**: All functionality available via keyboard

```markdown
## Test: Complete Keyboard Navigation

### Test Steps:
1. Navigate to Care Collective homepage using only keyboard
2. Test keyboard navigation through entire site:
   - Tab through all interactive elements
   - Use arrow keys for complex widgets
   - Test Enter and Space key activation
   - Verify Escape key closes modals/dialogs
3. Test all user workflows with keyboard only:
   - Help request creation
   - User registration/login
   - Contact exchange process
   - Admin panel navigation

### Playwright MCP Commands:
1. Navigate to http://localhost:3000
2. Use keyboard navigation:
   - Press Tab to move through interactive elements
   - Press Enter to activate buttons/links
   - Press Space for checkboxes/toggles
   - Press Arrow keys for select elements
3. Verify focus indicators are clearly visible
4. Test form submission with Enter key

### Success Criteria:
✅ All interactive elements reachable via keyboard
✅ Tab order is logical and predictable
✅ Focus indicators clearly visible (3:1 contrast minimum)
✅ No keyboard traps (users can navigate away)
✅ All functionality works with keyboard only
```

### Level AA Compliance (Enhanced)

#### 1.4.3 Color Contrast (Minimum)
**Requirement**: 4.5:1 contrast ratio for normal text, 3:1 for large text

```markdown
## Test: Color Contrast Validation

### Test Steps:
1. Navigate through all Care Collective pages
2. Test color contrast for all text elements:
   - Body text against backgrounds
   - Button text against button backgrounds
   - Link text in various states
   - Status indicators and badges
3. Test Care Collective brand colors:
   - Sage green (#7A9E99) combinations
   - Dusty rose (#D8A8A0) combinations
   - Primary text (#483129) combinations
   - Secondary text combinations

### Playwright MCP Commands:
1. Navigate to each page
2. Take screenshot for color analysis
3. Evaluate contrast ratios:
   ```javascript
   () => {
     // Function to calculate contrast ratio
     function getContrastRatio(color1, color2) {
       // Luminance calculation implementation
       return ratio;
     }

     const textElements = document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6');
     return Array.from(textElements).map(el => {
       const style = getComputedStyle(el);
       return {
         text: el.textContent.substring(0, 50),
         color: style.color,
         backgroundColor: style.backgroundColor,
         fontSize: style.fontSize
       };
     });
   }
   ```

### Success Criteria:
✅ All normal text has 4.5:1 contrast ratio minimum
✅ Large text (18pt+) has 3:1 contrast ratio minimum
✅ Brand colors meet contrast requirements in all uses
✅ Interactive elements have adequate contrast in all states
```

#### 1.4.10 Reflow
**Requirement**: Content reflows to 320px width without horizontal scrolling

```markdown
## Test: Responsive Design and Content Reflow

### Test Steps:
1. Test Care Collective at various viewport widths:
   - 320px (minimum mobile width)
   - 768px (tablet width)
   - 1024px (desktop width)
   - 1440px (large desktop)
2. Verify content reflow:
   - No horizontal scrolling required
   - All content remains accessible
   - Interactive elements remain usable
   - Text remains readable

### Playwright MCP Commands:
1. Resize browser to 320px width:
   ```
   Resize browser to width: 320, height: 568
   ```
2. Navigate through all pages
3. Take screenshots at each breakpoint
4. Verify no horizontal scroll bars appear
5. Test interaction with touch-sized targets

### Success Criteria:
✅ Content reflows properly at 320px width
✅ No horizontal scrolling required
✅ All functionality remains accessible
✅ Touch targets maintain 44px minimum size
```

#### 2.4.7 Focus Visible
**Requirement**: Focus indicators clearly visible

```markdown
## Test: Focus Indicator Visibility

### Test Steps:
1. Navigate through Care Collective using keyboard only
2. Verify focus indicators on all interactive elements:
   - Buttons and links
   - Form inputs and controls
   - Custom components (dropdowns, toggles)
   - Modal dialogs and overlays
3. Test focus indicators meet visibility requirements:
   - Clear visual distinction from unfocused state
   - High contrast against background
   - Visible across all Care Collective color themes

### Playwright MCP Commands:
1. Navigate to /requests/new
2. Use Tab key to navigate through form elements
3. Take screenshots of each focused element
4. Evaluate focus indicator contrast:
   ```javascript
   () => {
     const focusedElement = document.activeElement;
     const style = getComputedStyle(focusedElement);
     return {
       outline: style.outline,
       boxShadow: style.boxShadow,
       border: style.border,
       backgroundColor: style.backgroundColor
     };
   }
   ```

### Success Criteria:
✅ All interactive elements have visible focus indicators
✅ Focus indicators have 3:1 contrast ratio minimum
✅ Focus indicators work across all themes/modes
✅ Focus indicators don't interfere with content readability
```

## Care Collective Specific Accessibility Tests

### Help Request Accessibility

```markdown
## Test: Help Request Card Accessibility

### Test Scenario: Screen reader user browses help requests

### Test Steps:
1. Navigate to /requests using screen reader simulation
2. Verify help request cards are properly structured:
   - Each request is an article element
   - Headings identify request titles
   - Status and urgency clearly announced
   - Location information accessible
3. Test interaction with help request cards:
   - Cards are keyboard navigable
   - Action buttons clearly labeled
   - Request details accessible

### Playwright MCP Commands:
1. Navigate to /requests
2. Take accessibility snapshot
3. Evaluate semantic structure:
   ```javascript
   () => {
     const requests = document.querySelectorAll('[data-testid="help-request-card"]');
     return Array.from(requests).map(card => ({
       hasHeading: !!card.querySelector('h1, h2, h3, h4, h5, h6'),
       hasRole: card.getAttribute('role'),
       hasLabel: card.getAttribute('aria-label') || card.getAttribute('aria-labelledby'),
       interactiveElements: card.querySelectorAll('button, a').length
     }));
   }
   ```

### Success Criteria:
✅ Each help request card is properly labeled
✅ Request information announced in logical order
✅ Status and urgency clearly communicated
✅ Actions available via keyboard and screen reader
```

### Contact Exchange Privacy Accessibility

```markdown
## Test: Privacy-Protected Contact Exchange Accessibility

### Test Scenario: Screen reader user exchanges contact information

### Test Steps:
1. Navigate through contact exchange process
2. Verify privacy consent dialog accessibility:
   - Dialog properly announced when opened
   - Focus moves to dialog content
   - Consent requirements clearly explained
   - Close/cancel options clearly available
3. Test consent form accessibility:
   - All form fields properly labeled
   - Required fields clearly indicated
   - Error messages announced to screen readers
   - Success/completion messages accessible

### Playwright MCP Commands:
1. Navigate to help request detail page
2. Click "Offer Help" button
3. Verify dialog accessibility:
   ```javascript
   () => {
     const dialog = document.querySelector('[role="dialog"]');
     return {
       hasRole: dialog?.getAttribute('role'),
       hasLabel: dialog?.getAttribute('aria-labelledby'),
       hasDescription: dialog?.getAttribute('aria-describedby'),
       focusable: dialog?.querySelector('[tabindex]') ? true : false
     };
   }
   ```

### Success Criteria:
✅ Privacy dialog properly announced and navigable
✅ Consent requirements clearly explained to screen readers
✅ Form validation errors accessible
✅ Contact sharing confirmation accessible
```

### Emergency Request Accessibility

```markdown
## Test: Critical/Urgent Request Accessibility

### Test Scenario: Screen reader user identifies and responds to urgent help request

### Test Steps:
1. Navigate to requests page with urgent requests present
2. Verify urgent request identification:
   - Urgency level clearly announced
   - Visual urgency indicators have text equivalents
   - Urgent requests easy to distinguish
3. Test urgent request interaction:
   - Quick response mechanisms accessible
   - Emergency contact information accessible
   - Status updates clearly communicated

### Success Criteria:
✅ Urgency levels clearly announced to screen readers
✅ Visual urgency indicators have text equivalents
✅ Emergency response flows are keyboard accessible
✅ Critical information prioritized in screen reader announcements
```

## Automated Accessibility Testing Integration

### axe-core Integration with Playwright MCP

```markdown
## Automated WCAG Scanning

### Setup:
Care Collective already includes @axe-core/playwright in devDependencies.
This enables automated accessibility scanning during Playwright MCP testing.

### Implementation Pattern:
1. Navigate to page under test
2. Use Playwright MCP evaluate function to run axe-core:
   ```javascript
   () => {
     // Inject axe-core if not already available
     if (typeof axe === 'undefined') {
       const script = document.createElement('script');
       script.src = '/node_modules/axe-core/axe.min.js';
       document.head.appendChild(script);
       return new Promise(resolve => {
         script.onload = () => {
           axe.run().then(results => resolve(results));
         };
       });
     } else {
       return axe.run();
     }
   }
   ```
3. Verify zero accessibility violations
4. Report any issues found

### Integration with Test Workflows:
Every test scenario should include:
1. Navigate to page
2. Perform functional testing
3. Run axe-core scan
4. Verify zero violations
5. Document any exceptions (with justification)
```

## Manual Accessibility Testing Procedures

### Screen Reader Testing

```markdown
## Screen Reader Simulation Testing

### Tools Required:
- NVDA (Windows) or VoiceOver (Mac) for comprehensive testing
- Playwright MCP for automated interaction
- Real screen reader for final validation

### Testing Procedure:
1. Use Playwright MCP to navigate to page
2. Simulate screen reader interaction patterns:
   - Heading navigation (H key)
   - Link navigation (Tab key)
   - Form navigation (F key)
   - Content reading (Arrow keys)
3. Verify all content is accessible via screen reader
4. Test with actual screen reader for validation

### Common Screen Reader Commands to Test:
- **Headings**: Navigate by heading structure
- **Links**: Jump between links and verify descriptions
- **Forms**: Navigate form fields and hear labels
- **Tables**: Navigate table structure (if used)
- **Landmarks**: Navigate page regions
```

### Keyboard-Only Testing

```markdown
## Comprehensive Keyboard Navigation Testing

### Testing Procedure:
1. Disconnect or disable mouse/trackpad
2. Use Playwright MCP for systematic keyboard testing:
   - Tab through all interactive elements
   - Test Enter/Space activation
   - Test arrow key navigation (where applicable)
   - Test Escape key for closing dialogs
3. Verify complete functionality with keyboard only
4. Document any issues or limitations

### Keyboard Navigation Standards:
- **Tab Order**: Logical and predictable
- **Focus Indicators**: Always visible and clear
- **Activation**: Enter and Space work as expected
- **Escape Routes**: Always available from modal contexts
- **Shortcuts**: Standard keyboard shortcuts supported
```

## Accessibility Testing Checklist

### Pre-Test Setup
- [ ] Development server running on localhost:3000
- [ ] Test database populated with realistic data
- [ ] Playwright MCP server configured and ready
- [ ] axe-core integration verified
- [ ] Screen reader software available (for validation)

### Page-Level Testing
- [ ] Semantic HTML structure validated
- [ ] Heading hierarchy logical and sequential
- [ ] All images have appropriate alt text
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Content reflows properly at 320px width
- [ ] Focus indicators visible on all interactive elements

### Functional Testing
- [ ] Complete workflows accessible via keyboard
- [ ] Screen reader users can complete all tasks
- [ ] Form validation accessible and clear
- [ ] Error messages announced to assistive technologies
- [ ] Success messages accessible and clear

### Care Collective Specific
- [ ] Help request creation fully accessible
- [ ] Contact exchange privacy accessible
- [ ] Urgent request identification accessible
- [ ] Admin functions accessible to authorized users
- [ ] Mobile experience accessible on touch devices

### Validation
- [ ] axe-core scan shows zero violations
- [ ] Manual screen reader testing confirms accessibility
- [ ] Keyboard-only testing successful
- [ ] Real user testing with disabilities (when possible)

## Success Metrics

### Quantitative Metrics
- **axe-core Violations**: 0 violations across all pages
- **WCAG 2.1 AA Compliance**: 100% compliance verified
- **Keyboard Navigation**: 100% functionality via keyboard
- **Color Contrast**: All text meets 4.5:1 (normal) or 3:1 (large)

### Qualitative Metrics
- **User Experience**: Assistive technology users report positive experience
- **Task Completion**: All user workflows completable with assistive technology
- **Error Recovery**: Clear, accessible error handling and recovery
- **Documentation**: All accessibility features documented and maintained

---

*This WCAG 2.1 AA compliance testing framework ensures the Care Collective platform is truly accessible to all community members, supporting inclusive mutual aid coordination regardless of individual abilities or assistive technology needs.*