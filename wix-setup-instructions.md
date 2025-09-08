# Care Collective Wix Homepage - Setup & Deployment Instructions

## 🎯 Quick Start Overview

This guide provides technical step-by-step instructions for implementing your Care Collective homepage in Wix. The implementation creates a seamless public-facing website that directs users to your existing Vercel-hosted member portal.

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Active Wix account with website editing permissions
- [ ] Care Collective logo file (PNG/SVG format)
- [ ] Access to your Vercel platform URLs
- [ ] Basic familiarity with Wix Editor
- [ ] Text content ready (provided in client email)

## 🚀 Phase 1: Wix Site Setup

### Step 1.1: Create or Prepare Your Homepage

1. **Access Wix Editor**:
   - Log into your Wix account
   - Navigate to your site's editor
   - Go to the homepage or create a new page for the homepage

2. **Clear Existing Content** (if updating existing page):
   - Remove all existing elements to start with a clean slate
   - Keep only essential Wix structure elements

3. **Set Page Properties**:
   - Page name: "Home" or "Homepage"
   - URL slug: Leave as root "/" or "home"
   - Page title: "CARE Collective - Southwest Missouri"

### Step 1.2: Configure Page Settings

1. **SEO Settings**:
   ```
   Title: CARE Collective - Southwest Missouri Community Mutual Aid
   Description: Building community through mutual aid. Connect with neighbors for practical help, shared resources, and mutual support in Southwest Missouri.
   Keywords: mutual aid, community support, Southwest Missouri, caregivers, Springfield, help requests
   ```

2. **Social Share Settings**:
   - Upload Care Collective logo as social image
   - Title: "CARE Collective - Southwest Missouri"
   - Description: "Building community through mutual aid"

## 🏗️ Phase 2: HTML Structure Implementation

### Step 2.1: Add HTML Embed Elements

1. **Primary HTML Container**:
   - Add → Embeds & Social → HTML Embed
   - Resize to full page width and height
   - Name it "Homepage Structure"

2. **CSS Embed Element**:
   - Add another HTML Embed for styles
   - Position at top of page
   - Name it "Care Collective Styles"

3. **JavaScript Embed Element**:
   - Add third HTML Embed for scripts
   - Position at bottom of page
   - Name it "Care Collective Scripts"

### Step 2.2: Implement HTML Structure

1. **Copy Homepage Structure**:
   - Open `wix-homepage-structure.html`
   - Copy everything INSIDE the `<body>` tags (exclude `<html>`, `<head>`, `<body>` tags)
   - Paste into the "Homepage Structure" HTML Embed

2. **Update Placeholder URLs**:
   Replace these placeholders with your actual URLs:
   ```html
   <!-- Find and replace these: -->
   https://your-vercel-domain.com/login
   https://your-vercel-domain.com/signup  
   https://your-vercel-domain.com/dashboard
   
   <!-- With your actual Vercel URLs: -->
   https://care-collective-preview.vercel.app/login
   https://care-collective-preview.vercel.app/signup
   https://care-collective-preview.vercel.app/dashboard
   
   <!-- ✅ URLS ALREADY UPDATED IN wix-homepage-structure.html -->
   ```

3. **Update Logo Reference**:
   - Upload your logo to Wix Media Manager
   - Copy the Wix media URL
   - Replace `https://static.wixstatic.com/media/logo.png` with your logo URL

## 🎨 Phase 3: Styling Implementation

### Step 3.1: Add CSS Styles

1. **Add CSS to CSS Embed**:
   ```html
   <style>
   /* Paste the entire content of care-collective-styles.css here */
   </style>
   ```

2. **Wix-Specific CSS Adjustments**:
   Add these additional styles after the main CSS:
   ```css
   /* Wix-specific adjustments */
   #SITE_CONTAINER {
     padding: 0 !important;
   }
   
   #PAGES_CONTAINER {
     position: relative !important;
   }
   
   /* Ensure full width */
   .main-homepage-container {
     width: 100vw !important;
     position: relative;
     left: 50%;
     right: 50%;
     margin-left: -50vw !important;
     margin-right: -50vw !important;
   }
   ```

### Step 3.2: Test Styling

1. **Preview Mode**:
   - Click "Preview" in Wix Editor
   - Check that colors, fonts, and layout match the design
   - Test responsiveness by resizing browser

2. **Common Styling Issues**:
   - If colors don't appear: Check CSS is loading
   - If fonts look wrong: Ensure Overlock font is loading
   - If layout is broken: Check for Wix container conflicts

## ⚡ Phase 4: JavaScript Functionality

### Step 4.1: Add Interactive Scripts

1. **Add JavaScript to Scripts Embed**:
   ```html
   <script>
   /* Paste the entire content of care-collective-scripts.js here */
   </script>
   ```

2. **Test Core Functionality**:
   - Mobile navigation toggle
   - Smooth scrolling between sections
   - Button hover effects
   - Form interactions (if any)

### Step 4.2: Wix Velo Integration (Optional)

If you want to use Wix database features:

1. **Enable Velo**:
   - Go to Dev Mode in Wix
   - Enable Velo development environment

2. **Add Velo Code**:
   ```javascript
   // In your Velo page code
   import wixData from 'wix-data';
   
   $w.onReady(function () {
     // Initialize homepage functionality
     if (window.careCollectiveHomepage) {
       loadDynamicContent();
     }
   });
   
   async function loadDynamicContent() {
     try {
       // Load events from Wix database
       const events = await wixData.query("Events")
         .limit(3)
         .find();
       
       // Update homepage with events
       window.careCollectiveHomepage.updateEventsFromWix(events.items);
     } catch (error) {
       console.error("Error loading content:", error);
     }
   }
   ```

## 📱 Phase 5: Mobile Optimization

### Step 5.1: Mobile Editor Setup

1. **Switch to Mobile Editor**:
   - In Wix Editor, click mobile icon
   - Review mobile layout
   - Adjust spacing and sizing as needed

2. **Mobile-Specific Adjustments**:
   - Ensure touch targets are at least 44px
   - Check text readability
   - Test navigation functionality

### Step 5.2: Mobile Testing

Test on multiple devices:
- [ ] iPhone (various sizes)
- [ ] Android phones
- [ ] Tablets (iPad, Android)
- [ ] Check landscape and portrait orientations

## 🔧 Phase 6: Content Customization

### Step 6.1: Update Text Content

Replace placeholder content with your actual content:

1. **Hero Section**:
   ```html
   <h1 id="hero-heading" class="hero-title">Southwest Missouri CARE Collective</h1>
   <p class="hero-subtitle">Building community through mutual aid</p>
   <p class="hero-description">
     A community for caregivers to exchange practical help, shared resources, and mutual support. 
     Together, we're building a space where caregivers can find connection, strength, and the support they deserve.
   </p>
   ```

2. **About Section**:
   ```html
   <p>
     The CARE Collective (Caregiver Assistance and Resource Exchange) is a community for 
     caregivers in Southwest Missouri. The Collective is powered by caregivers themselves - 
     neighbors supporting neighbors - along with students and volunteers who help maintain 
     the site and coordinate resources.
   </p>
   <p>
     Together, we are building a space where caregivers can find connection, strength, 
     and the support they deserve.
   </p>
   ```

3. **Attribution Box**:
   ```html
   <div class="attribution-box">
     <h3>Academic Partnership</h3>
     <p>
       This project was created by Dr. Maureen Templeman, Department of Sociology, 
       Anthropology, and Gerontology at Missouri State University, with support from 
       community partners and funding from the Southern Gerontological Society 
       Innovative Projects Grant.
     </p>
   </div>
   ```

4. **Contact Information**:
   ```html
   <p>
     <strong>Email:</strong> 
     <a href="mailto:swmocarecollective@gmail.com">swmocarecollective@gmail.com</a>
   </p>
   <p><strong>Location:</strong> Springfield, 65897</p>
   ```

### Step 6.2: Customize Events and Updates

1. **Add Real Events**:
   ```html
   <div class="event-item">
     <div class="event-date">Feb 15</div>
     <div class="event-info">
       <h4>Community Meet & Greet</h4>
       <p>Join us for coffee and connection at the Community Center</p>
     </div>
   </div>
   ```

2. **Add Community Updates**:
   ```html
   <div class="update-item">
     <h4>Welcome New Members!</h4>
     <p>25 new community members joined this month</p>
   </div>
   ```

## 🧪 Phase 7: Testing & Quality Assurance

### Step 7.1: Functionality Testing

**Desktop Testing**:
- [ ] All navigation links work
- [ ] Smooth scrolling functions
- [ ] External links to Vercel open correctly
- [ ] Email links open email client
- [ ] No JavaScript errors in console

**Mobile Testing**:
- [ ] Hamburger menu opens/closes properly
- [ ] All touch targets are accessible
- [ ] No horizontal scrolling issues
- [ ] Text is readable without zooming

**Cross-Browser Testing**:
- [ ] Chrome
- [ ] Firefox  
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Step 7.2: Performance Testing

1. **Page Speed**:
   - Use Google PageSpeed Insights
   - Aim for 90+ score on mobile and desktop
   - Optimize images if scores are low

2. **Loading Time**:
   - Page should load in under 3 seconds
   - Interactive elements should respond immediately

### Step 7.3: Accessibility Testing

1. **Screen Reader Testing**:
   - Test with screen reader software
   - Ensure all content is readable
   - Check heading hierarchy

2. **Keyboard Navigation**:
   - Tab through all interactive elements
   - Ensure focus indicators are visible
   - Test keyboard shortcuts

3. **Color Contrast**:
   - Use WebAIM Color Contrast Checker
   - Ensure all text meets WCAG AA standards
   - Test with high contrast mode

## 🚀 Phase 8: Pre-Launch Checklist

### Step 8.1: Content Verification
- [ ] All placeholder text replaced with real content
- [ ] Contact information is accurate
- [ ] All links tested and working
- [ ] Logo displays properly
- [ ] Images have alt text

### Step 8.2: Technical Verification
- [ ] CSS styles loading correctly
- [ ] JavaScript functionality working
- [ ] Mobile responsiveness confirmed
- [ ] No console errors
- [ ] Page loads quickly

### Step 8.3: SEO Setup
- [ ] Page title optimized
- [ ] Meta description added
- [ ] Open Graph tags configured
- [ ] Schema markup added (optional)
- [ ] Sitemap updated

### Step 8.4: Analytics Setup
- [ ] Google Analytics connected
- [ ] Goal tracking configured for Vercel links
- [ ] Event tracking on CTA buttons

## 🌟 Phase 9: Launch & Post-Launch

### Step 9.1: Launch Process

1. **Final Review**:
   - Complete one final test of all functionality
   - Have someone else review the site
   - Check all links one more time

2. **Publish**:
   - Click "Publish" in Wix Editor
   - Wait for changes to propagate
   - Test live site immediately

### Step 9.2: Post-Launch Monitoring

**First 24 Hours**:
- Monitor site for any issues
- Check analytics for traffic
- Test functionality on live site
- Monitor user feedback

**First Week**:
- Review analytics data
- Track conversion to Vercel platform
- Gather initial user feedback
- Make minor adjustments as needed

**Ongoing Maintenance**:
- Update events monthly
- Refresh community stats regularly
- Monitor performance metrics
- Respond to user feedback

## 🆘 Troubleshooting Guide

### Common Issues & Solutions

**Issue**: Page doesn't display correctly
**Solution**: 
- Check HTML Embed elements are properly configured
- Ensure CSS is loading before HTML content
- Look for Wix container conflicts

**Issue**: Mobile menu not working
**Solution**:
- Verify JavaScript is loaded
- Check for conflicts with Wix mobile menu
- Test JavaScript console for errors

**Issue**: Links to Vercel platform don't work
**Solution**:
- Verify URLs are correct and live
- Check for HTTP vs HTTPS issues
- Test links in incognito mode

**Issue**: Fonts not displaying correctly
**Solution**:
- Check Google Fonts loading
- Verify CSS font declarations
- Test font fallbacks

**Issue**: Slow loading times
**Solution**:
- Optimize image sizes
- Minify CSS and JavaScript
- Check for unnecessary Wix plugins

### Getting Support

1. **Wix Support**:
   - Use Wix Help Center for platform-specific issues
   - Contact Wix Support for technical problems

2. **Care Collective Support**:
   - Refer to documentation provided
   - Check common issues in this guide
   - Test changes in preview mode first

3. **Developer Resources**:
   - Wix Velo documentation
   - MDN Web Docs for HTML/CSS/JS
   - Google PageSpeed Insights for performance

## 📊 Success Metrics

Track these metrics post-launch:

**Traffic Metrics**:
- Page views and unique visitors
- Time spent on page
- Bounce rate
- Mobile vs desktop traffic

**Conversion Metrics**:
- Clicks on "Join Our Community" button
- Clicks on "Member Login" link
- Email link clicks
- Conversion to Vercel platform

**User Experience**:
- Page load speed
- User feedback/comments
- Mobile usability metrics
- Accessibility compliance

## 🔄 Maintenance Schedule

**Weekly**:
- Check all links are working
- Review analytics data
- Monitor site performance

**Monthly**:
- Update events section
- Refresh community statistics
- Review and respond to feedback
- Check for security updates

**Quarterly**:
- Comprehensive site review
- Update content as needed
- Performance optimization
- Accessibility audit

This comprehensive setup guide should enable successful implementation and launch of your Care Collective Wix homepage, creating an effective bridge between your public presence and member portal functionality.