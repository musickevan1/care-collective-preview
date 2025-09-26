/**
 * CARE COLLECTIVE WIX HOMEPAGE INTERACTIVE ELEMENTS
 * JavaScript for enhanced user experience and accessibility
 * Compatible with Wix Velo environment
 */

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Debounce function to limit how often a function can be called
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Smooth scroll to element (with fallback for reduced motion)
 */
function smoothScrollTo(targetId, offset = 0) {
  const target = document.getElementById(targetId.replace('#', ''));
  if (!target) return;
  
  const headerHeight = document.getElementById('header')?.offsetHeight || 64;
  const targetPosition = target.offsetTop - headerHeight - offset;
  
  if (prefersReducedMotion()) {
    // Instant scroll for users who prefer reduced motion
    window.scrollTo(0, targetPosition);
  } else {
    // Smooth scroll for others
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }
}

// ===================================
// MOBILE NAVIGATION
// ===================================

class MobileNavigation {
  constructor() {
    this.toggle = document.querySelector('.mobile-nav-toggle');
    this.nav = document.querySelector('.mobile-nav');
    this.hamburgerLines = document.querySelectorAll('.hamburger-line');
    this.isOpen = false;
    
    this.init();
  }
  
  init() {
    if (!this.toggle || !this.nav) return;
    
    // Add click event to toggle button
    this.toggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleNav();
    });
    
    // Close nav when clicking on links
    const navLinks = this.nav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.closeNav();
      });
    });
    
    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.toggle.contains(e.target) && !this.nav.contains(e.target)) {
        this.closeNav();
      }
    });
    
    // Close nav on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeNav();
        this.toggle.focus(); // Return focus to toggle button
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 768 && this.isOpen) {
        this.closeNav();
      }
    }, 250));
  }
  
  toggleNav() {
    if (this.isOpen) {
      this.closeNav();
    } else {
      this.openNav();
    }
  }
  
  openNav() {
    this.isOpen = true;
    this.nav.style.display = 'block';
    this.nav.setAttribute('aria-hidden', 'false');
    this.toggle.setAttribute('aria-expanded', 'true');
    
    // Animate hamburger to X
    this.hamburgerLines[0].style.transform = 'rotate(45deg) translateY(6px)';
    this.hamburgerLines[1].style.opacity = '0';
    this.hamburgerLines[2].style.transform = 'rotate(-45deg) translateY(-6px)';
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus first nav link
    const firstLink = this.nav.querySelector('a');
    if (firstLink) firstLink.focus();
  }
  
  closeNav() {
    this.isOpen = false;
    this.nav.style.display = 'none';
    this.nav.setAttribute('aria-hidden', 'true');
    this.toggle.setAttribute('aria-expanded', 'false');
    
    // Reset hamburger
    this.hamburgerLines[0].style.transform = 'none';
    this.hamburgerLines[1].style.opacity = '1';
    this.hamburgerLines[2].style.transform = 'none';
    
    // Restore body scroll
    document.body.style.overflow = '';
  }
}

// ===================================
// SMOOTH SCROLLING NAVIGATION
// ===================================

class SmoothNavigation {
  constructor() {
    this.init();
  }
  
  init() {
    // Handle all anchor links that point to sections
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Skip if it's just "#" or empty
        if (!href || href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          smoothScrollTo(href);
          
          // Update URL without triggering scroll
          if (history.pushState) {
            history.pushState(null, null, href);
          }
          
          // Focus the target for accessibility (after scroll completes)
          setTimeout(() => {
            target.focus({ preventScroll: true });
          }, prefersReducedMotion() ? 0 : 800);
        }
      });
    });
  }
}

// ===================================
// SCROLL-BASED ANIMATIONS
// ===================================

class ScrollAnimations {
  constructor() {
    this.animated = new Set();
    this.init();
  }
  
  init() {
    // Only add animations if user doesn't prefer reduced motion
    if (prefersReducedMotion()) return;
    
    // Set up intersection observer for fade-in animations
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );
    
    // Observe elements that should animate in
    const animateElements = document.querySelectorAll(
      '.value-item, .step-item, .event-item, .update-item'
    );
    
    animateElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      this.observer.observe(el);
    });
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.animated.has(entry.target)) {
        this.animated.add(entry.target);
        
        // Animate in with a slight delay for staggered effect
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, Math.random() * 200);
      }
    });
  }
}

// ===================================
// HEADER BEHAVIOR ON SCROLL
// ===================================

class HeaderBehavior {
  constructor() {
    this.header = document.getElementById('header');
    this.lastScrollY = window.scrollY;
    this.init();
  }
  
  init() {
    if (!this.header) return;
    
    // Add scroll event listener with debouncing
    window.addEventListener('scroll', debounce(() => {
      this.handleScroll();
    }, 10));
  }
  
  handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Add shadow when scrolled
    if (currentScrollY > 10) {
      this.header.style.boxShadow = '0 2px 12px rgba(72, 49, 41, 0.15)';
    } else {
      this.header.style.boxShadow = '0 2px 8px rgba(72, 49, 41, 0.1)';
    }
    
    this.lastScrollY = currentScrollY;
  }
}

// ===================================
// FORM ENHANCEMENTS (if needed)
// ===================================

class FormEnhancements {
  constructor() {
    this.init();
  }
  
  init() {
    // Add focus/blur enhancements to form inputs
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      // Add visual feedback for focus
      input.addEventListener('focus', () => {
        input.parentElement?.classList.add('focused');
      });
      
      input.addEventListener('blur', () => {
        input.parentElement?.classList.remove('focused');
      });
      
      // Add validation feedback
      input.addEventListener('invalid', (e) => {
        e.preventDefault();
        this.showValidationMessage(input);
      });
    });
  }
  
  showValidationMessage(input) {
    // Remove existing error messages
    const existingError = input.parentElement?.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      color: #d32f2f;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      animation: fadeIn 0.3s ease-in;
    `;
    errorDiv.textContent = input.validationMessage;
    
    input.parentElement?.appendChild(errorDiv);
    
    // Remove error message when input becomes valid
    const removeError = () => {
      if (input.validity.valid && errorDiv.parentElement) {
        errorDiv.remove();
        input.removeEventListener('input', removeError);
      }
    };
    
    input.addEventListener('input', removeError);
  }
}

// ===================================
// ACCESSIBILITY ENHANCEMENTS
// ===================================

class AccessibilityEnhancements {
  constructor() {
    this.init();
  }
  
  init() {
    // Skip to main content link
    this.addSkipLink();
    
    // Enhance focus management
    this.enhanceFocusManagement();
    
    // Add keyboard navigation for custom elements
    this.addKeyboardNavigation();
  }
  
  addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--navy);
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 0 0 4px 4px;
      z-index: 9999;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
  
  enhanceFocusManagement() {
    // Trap focus in modal dialogs if any
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        // If we're in a modal or mobile nav, trap focus
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav && mobileNav.style.display === 'block') {
          const navFocusables = mobileNav.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled])'
          );
          
          const firstNavFocusable = navFocusables[0];
          const lastNavFocusable = navFocusables[navFocusables.length - 1];
          
          if (e.shiftKey) {
            if (document.activeElement === firstNavFocusable) {
              e.preventDefault();
              lastNavFocusable.focus();
            }
          } else {
            if (document.activeElement === lastNavFocusable) {
              e.preventDefault();
              firstNavFocusable.focus();
            }
          }
        }
      }
    });
  }
  
  addKeyboardNavigation() {
    // Add keyboard navigation for elements that need it
    const interactiveElements = document.querySelectorAll('[role="button"]:not(button)');
    
    interactiveElements.forEach(element => {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          element.click();
        }
      });
    });
  }
}

// ===================================
// PERFORMANCE OPTIMIZATIONS
// ===================================

class PerformanceOptimizations {
  constructor() {
    this.init();
  }
  
  init() {
    // Lazy load images
    this.setupLazyLoading();
    
    // Preload critical resources
    this.preloadCriticalResources();
  }
  
  setupLazyLoading() {
    // Use Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
  
  preloadCriticalResources() {
    // Preload important images that will be needed soon
    const criticalImages = [
      // Add any critical images here
    ];
    
    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }
}

// ===================================
// INITIALIZE ON DOM CONTENT LOADED
// ===================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all functionality
  try {
    new MobileNavigation();
    new SmoothNavigation();
    new ScrollAnimations();
    new HeaderBehavior();
    new FormEnhancements();
    new AccessibilityEnhancements();
    new PerformanceOptimizations();
    
    console.log('Care Collective homepage initialized successfully');
  } catch (error) {
    console.error('Error initializing homepage:', error);
  }
});

// ===================================
// WIX VELO SPECIFIC INTEGRATIONS
// ===================================

/**
 * Wix Velo integration functions
 * These functions can be called from Wix Velo code to interact with the page
 */

// Export functions for Wix Velo if running in that environment
if (typeof $w !== 'undefined') {
  // Wix environment detected
  console.log('Wix Velo environment detected');
  
  // Example: Function to update event content from Wix database
  function updateEventsFromWix(events) {
    const eventsList = document.querySelector('.event-list');
    if (!eventsList || !events) return;
    
    eventsList.innerHTML = '';
    
    events.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'event-item';
      eventElement.innerHTML = `
        <div class="event-date">${event.date}</div>
        <div class="event-info">
          <h4>${event.title}</h4>
          <p>${event.description}</p>
        </div>
      `;
      eventsList.appendChild(eventElement);
    });
  }
  
  // Example: Function to update community stats
  function updateCommunityStats(stats) {
    // Update any dynamic content from Wix CMS
    if (stats.memberCount) {
      const memberCountEl = document.querySelector('[data-stat="members"]');
      if (memberCountEl) memberCountEl.textContent = stats.memberCount;
    }
    
    if (stats.helpRequestsCompleted) {
      const helpCountEl = document.querySelector('[data-stat="help-requests"]');
      if (helpCountEl) helpCountEl.textContent = stats.helpRequestsCompleted;
    }
  }
  
  // Make functions available globally for Wix Velo
  window.careCollectiveHomepage = {
    updateEventsFromWix,
    updateCommunityStats,
    scrollToSection: smoothScrollTo
  };
}

// ===================================
// ERROR HANDLING AND FALLBACKS
// ===================================

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Homepage error:', e.error);
  
  // Graceful degradation - ensure basic functionality works
  if (e.error && e.error.message.includes('Navigation')) {
    // Fallback navigation behavior
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
});

// Ensure critical functionality works even if JavaScript fails
window.addEventListener('load', () => {
  // Remove no-js class if present
  document.documentElement.classList.remove('no-js');
  
  // Add js class for CSS targeting
  document.documentElement.classList.add('js');
});