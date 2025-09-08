# Care Collective Wix Homepage - Content Integration Guide

## 🎯 Overview
This guide provides step-by-step instructions for integrating the Care Collective homepage components into your Wix website, customizing content, and connecting to your existing Vercel platform.

## 📁 File Structure
Your implementation package includes:
- `wix-homepage-wireframe.md` - Design specification and structure
- `wix-homepage-structure.html` - Complete HTML structure
- `care-collective-styles.css` - Custom CSS with Care Collective branding
- `care-collective-scripts.js` - Interactive functionality
- `wix-content-integration-guide.md` - This guide
- `wix-setup-instructions.md` - Technical setup guide

## 🏗️ Wix Implementation Steps

### Step 1: Set Up Your Wix Page

1. **Create New Page**:
   - Go to your Wix Editor
   - Add a new page called "Home" (or update existing homepage)
   - Choose a blank template to start from scratch

2. **Add HTML Embed Element**:
   - From the Add panel, go to "Embeds & Social" → "HTML Embed"
   - Place it to cover the full page width
   - This will contain your homepage structure

### Step 2: Integrate HTML Structure

1. **Copy HTML Content**:
   - Open `wix-homepage-structure.html`
   - Copy the entire content inside the `<body>` tags (exclude `<html>`, `<head>`, and `<body>` tags)
   - Paste into the HTML Embed element

2. **Update Links**:
   Replace placeholder links with your actual URLs:
   ```html
   <!-- Replace these placeholders -->
   https://your-vercel-domain.com/login
   https://your-vercel-domain.com/signup
   https://your-vercel-domain.com/dashboard
   
   <!-- With your actual Vercel domain -->
   https://care-collective-preview.vercel.app/login
   https://care-collective-preview.vercel.app/signup
   https://care-collective-preview.vercel.app/dashboard
   
   <!-- ✅ URLS ALREADY UPDATED IN wix-homepage-structure.html -->
   ```

3. **Add Logo**:
   - Upload your Care Collective logo to Wix Media
   - Copy the Wix media URL
   - Replace `https://static.wixstatic.com/media/logo.png` with your logo URL

### Step 3: Add Custom CSS

1. **Add CSS via HTML Embed**:
   - Create a new HTML Embed element or add to existing one
   - Add this structure:
   ```html
   <style>
   /* Paste the entire content of care-collective-styles.css here */
   </style>
   ```

2. **Alternative - External CSS File**:
   - Upload the CSS file to your Wix site files
   - Reference it in the HTML head:
   ```html
   <link rel="stylesheet" href="/path-to-your-css/care-collective-styles.css">
   ```

### Step 4: Add JavaScript Functionality

1. **Add JavaScript**:
   - Create another HTML Embed or add to existing
   - Add:
   ```html
   <script>
   /* Paste the entire content of care-collective-scripts.js here */
   </script>
   ```

2. **Test Interactive Elements**:
   - Mobile navigation toggle
   - Smooth scrolling
   - Button hover effects
   - Responsive behavior

## 🎨 Content Customization

### Updating Text Content

#### Hero Section:
```html
<h1 id="hero-heading" class="hero-title">Southwest Missouri CARE Collective</h1>
<p class="hero-subtitle">Building community through mutual aid</p>
<p class="hero-description">
  [Update with your specific community description]
</p>
```

#### Mission Statement:
```html
<p class="mission-statement">
  To connect caregivers with one another for the exchange of practical help, 
  shared resources, and mutual support.
</p>
```

#### About Section:
Replace with your provided content:
```html
<p>
  The CARE Collective (Caregiver Assistance and Resource Exchange) is a community for 
  caregivers in Southwest Missouri. The Collective is powered by caregivers themselves - 
  neighbors supporting neighbors - along with students and volunteers who help maintain 
  the site and coordinate resources.
</p>
```

### Updating Community Values

Customize the values grid in the Mission section:
```html
<div class="value-item">
  <div class="value-icon" aria-hidden="true">🤝</div>
  <h3 class="value-title">Community</h3>
  <p class="value-description">Building real connections between neighbors</p>
</div>
<!-- Add more values as needed -->
```

### Events and Updates Section

#### Adding Real Events:
```html
<div class="event-item">
  <div class="event-date">Jan 15</div>
  <div class="event-info">
    <h4>Your Event Title</h4>
    <p>Event description</p>
  </div>
</div>
```

#### Community Updates:
```html
<div class="update-item">
  <h4>Update Title</h4>
  <p>Update description</p>
</div>
```

### Contact Information

Update footer with your details:
```html
<div class="contact-info">
  <h3>Contact Information</h3>
  <p>
    <strong>Email:</strong> 
    <a href="mailto:swmocarecollective@gmail.com">swmocarecollective@gmail.com</a>
  </p>
  <p><strong>Location:</strong> Springfield, 65897</p>
</div>
```

## 🔗 Platform Integration

### Linking to Vercel Platform

#### Primary Call-to-Action Buttons:
- **"Join Our Community"** → Links to signup page
- **"Member Login"** → Links to login page  
- **"Get Started"** → Links to signup page
- **"View All in Member Portal"** → Links to dashboard

#### URL Structure:
```html
<!-- Signup Flow -->
<a href="https://your-vercel-domain.com/signup" class="btn btn-primary">Join Our Community</a>

<!-- Login Flow -->
<a href="https://your-vercel-domain.com/login" class="login-link">Member Login</a>

<!-- Dashboard Access -->
<a href="https://your-vercel-domain.com/dashboard" class="btn btn-secondary">Member Portal</a>
```

### Analytics Tracking

Add tracking to button clicks:
```html
<a href="https://your-vercel-domain.com/signup" 
   class="btn btn-primary"
   onclick="gtag('event', 'click', {'event_category': 'CTA', 'event_label': 'Join Community'})">
   Join Our Community
</a>
```

## 📱 Mobile Optimization

### Testing Mobile Experience

1. **Wix Mobile Editor**:
   - Use Wix's mobile editor to fine-tune mobile layout
   - Ensure all touch targets are at least 44px
   - Test navigation menu functionality

2. **Key Mobile Features**:
   - Hamburger menu for navigation
   - Larger text sizes for readability
   - Simplified button layouts
   - Touch-friendly spacing

### Mobile-Specific Adjustments

If needed, add mobile-specific styles:
```css
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.75rem; /* Adjust as needed */
  }
  
  .hero-actions {
    flex-direction: column; /* Stack buttons vertically */
  }
}
```

## 🎨 Brand Customization

### Color Scheme

Primary brand colors are defined as CSS variables:
```css
:root {
  --sage: #7A9E99;           /* Primary green */
  --dusty-rose: #D8A8A0;     /* Secondary rose */
  --terracotta: #BC6547;     /* Accent orange */
  --navy: #324158;           /* Dark text/headers */
  --cream: #FBF2E9;          /* Background */
  --brown: #483129;          /* Body text */
}
```

### Typography

Primary font is Overlock. To change fonts:
```css
:root {
  --font-family-primary: 'Your-Font-Name', -apple-system, sans-serif;
}
```

### Button Styles

Customize button colors:
```css
.btn-primary {
  background-color: var(--sage-dark);
  color: var(--white);
}

.btn-secondary {
  background-color: var(--dusty-rose-accessible);
  color: var(--white);
}
```

## 🔧 Dynamic Content Integration

### Wix Velo Database Integration

If using Wix Velo for dynamic content:

#### Connect to Wix Database:
```javascript
// Example: Loading events from Wix database
import wixData from 'wix-data';

export async function updateEventsFromDatabase() {
  try {
    const events = await wixData.query('Events')
      .limit(3)
      .find();
    
    // Call the homepage function to update events
    if (window.careCollectiveHomepage) {
      window.careCollectiveHomepage.updateEventsFromWix(events.items);
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
}
```

#### Update Community Stats:
```javascript
export async function updateCommunityStats() {
  try {
    // Get member count
    const members = await wixData.query('Members').count();
    
    // Get completed help requests
    const helpRequests = await wixData.query('HelpRequests')
      .eq('status', 'completed')
      .count();
    
    // Update the homepage
    if (window.careCollectiveHomepage) {
      window.careCollectiveHomepage.updateCommunityStats({
        memberCount: members,
        helpRequestsCompleted: helpRequests
      });
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}
```

## 🔍 SEO Optimization

### Meta Tags

Add to your Wix page settings:
```html
<title>CARE Collective - Southwest Missouri Community Mutual Aid</title>
<meta name="description" content="Southwest Missouri CARE Collective - Building community through mutual aid. Connect with neighbors for practical help, shared resources, and mutual support.">
<meta name="keywords" content="mutual aid, community support, Southwest Missouri, caregivers, Springfield">
```

### Open Graph Tags:
```html
<meta property="og:title" content="CARE Collective - Southwest Missouri">
<meta property="og:description" content="Building community through mutual aid">
<meta property="og:type" content="website">
<meta property="og:url" content="https://your-wix-site.com">
<meta property="og:image" content="https://your-wix-site.com/logo.png">
```

### Local SEO:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CARE Collective",
  "description": "Southwest Missouri community mutual aid platform",
  "url": "https://your-wix-site.com",
  "logo": "https://your-wix-site.com/logo.png",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Springfield",
    "postalCode": "65897",
    "addressRegion": "Missouri",
    "addressCountry": "US"
  },
  "email": "swmocarecollective@gmail.com"
}
</script>
```

## 🧪 Testing Checklist

### Functionality Testing:
- [ ] All navigation links work properly
- [ ] Mobile menu opens and closes correctly
- [ ] Smooth scrolling functions
- [ ] All external links to Vercel platform work
- [ ] Contact email link opens email client
- [ ] Page is responsive on mobile, tablet, desktop
- [ ] All images load correctly
- [ ] CSS styling displays properly

### Accessibility Testing:
- [ ] All images have alt text
- [ ] Headings are in logical order (H1 → H2 → H3)
- [ ] Color contrast meets WCAG AA standards
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Screen reader navigation works properly

### Performance Testing:
- [ ] Page loads quickly (< 3 seconds)
- [ ] Images are optimized
- [ ] CSS and JavaScript files are minified
- [ ] No console errors in browser

## 🚀 Launch Preparation

### Pre-Launch Checklist:
1. **Content Review**:
   - All placeholder text replaced
   - Contact information accurate
   - Links to Vercel platform tested
   - Logo and branding consistent

2. **Technical Review**:
   - All functionality tested
   - Mobile experience optimized
   - SEO tags implemented
   - Analytics tracking active

3. **User Testing**:
   - Test with target audience
   - Gather feedback on usability
   - Ensure clear path to member portal

### Post-Launch Monitoring:
- Monitor analytics for user behavior
- Track conversion to member portal
- Gather feedback for improvements
- Regular content updates

## 📞 Support and Maintenance

### Common Issues:

**Issue**: Mobile menu not working
**Solution**: Check JavaScript is properly loaded and no conflicts with Wix

**Issue**: Styling not displaying correctly
**Solution**: Ensure CSS is loaded after any Wix default styles

**Issue**: Links to Vercel platform not working
**Solution**: Verify URLs are correct and platforms are live

### Content Updates:
- Update events section monthly
- Refresh community stats regularly
- Keep about section current
- Monitor and respond to user feedback

### Future Enhancements:
- Blog integration for community stories
- Event calendar with Wix Events
- Member testimonials section
- Resource library integration

This guide should provide everything needed to successfully integrate and launch your Care Collective homepage on Wix while maintaining seamless connection to your Vercel member portal.