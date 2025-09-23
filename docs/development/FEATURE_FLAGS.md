# Feature Flags Configuration
*Last Updated: January 2025*

## Overview
This document describes the feature flag system used to control functionality during development and based on client preferences.

## Current Feature Flags

### Contact Exchange System
```typescript
contactExchange: {
  enabled: false,              // Master switch for feature
  type: 'pending',            // 'display' | 'message' | 'both'
  showEmail: true,            // Show email in contact info
  showPhone: true,            // Show phone in contact info
  requireConfirmation: false, // Require helper confirmation
  privacyLevel: 'after_accept' // 'immediate' | 'after_accept'
}
```

**Usage:**
```typescript
// In RequestActions.tsx
if (features.contactExchange.enabled) {
  if (features.contactExchange.type === 'display') {
    return <ContactInfoDisplay />;
  } else if (features.contactExchange.type === 'message') {
    return <MessageThread />;
  }
}
```

### Category Management
```typescript
categories: {
  source: 'static',           // 'static' | 'database'
  adminManaged: false,        // Allow admin CRUD operations
  customAllowed: false,       // Allow custom categories
  maxCategories: 20,          // Maximum number of categories
  requireIcon: false          // Require icon for each category
}
```

**Static Categories (Current):**
```typescript
const STATIC_CATEGORIES = [
  { value: 'transport', label: 'Transportation', icon: '🚗' },
  { value: 'household', label: 'Household Tasks', icon: '🏠' },
  { value: 'meals', label: 'Meal Preparation', icon: '🍽️' },
  { value: 'respite', label: 'Respite Care', icon: '💆' },
  { value: 'companionship', label: 'Companionship', icon: '👥' },
  { value: 'childcare', label: 'Childcare', icon: '👶' },
  { value: 'petcare', label: 'Pet Care', icon: '🐾' },
  { value: 'technology', label: 'Technology Help', icon: '💻' },
  { value: 'emotional', label: 'Emotional Support', icon: '💝' },
  { value: 'groceries', label: 'Groceries', icon: '🛒' },
  { value: 'medical', label: 'Medical/Pharmacy', icon: '💊' },
  { value: 'other', label: 'Other', icon: '📋' }
];
```

### Location Settings
```typescript
location: {
  defaultGranularity: 'neighborhood', // 'city' | 'zip' | 'neighborhood' | 'address'
  allowOverride: false,               // Allow per-request location override
  showMap: false,                     // Show map visualization
  requireLocation: false,             // Make location mandatory
  autoDetect: false,                  // Use browser geolocation
  privacyMode: 'public'              // 'public' | 'helpers_only' | 'after_match'
}
```

### Typography & Accessibility
```typescript
typography: {
  baseSize: 16,                      // Base font size in pixels
  readableMode: true,                // Enable readable mode toggle
  readableScale: 1.25,              // Scale factor for readable mode
  mobileBaseSize: 15,               // Mobile base font size
  reduceMotion: true                // Respect prefers-reduced-motion
}
```

### Brand Colors
```typescript
brandColors: {
  enabled: true,                    // Use brand colors
  sage: '#7A9E99',                 // Sage green accent
  dustyRose: '#D8A8A0',           // Dusty rose accent
  useInButtons: true,              // Apply to buttons
  useInBadges: true,               // Apply to badges
  useInDividers: true,             // Apply to dividers
  opacity: 1.0                     // Global opacity modifier
}
```

### Admin Features
```typescript
adminFeatures: {
  categoryManagement: false,        // Admin can manage categories
  userModeration: true,            // Admin can moderate users
  requestModeration: true,         // Admin can moderate requests
  analytics: false,                // Show analytics dashboard
  bulkActions: false,              // Enable bulk operations
  exportData: false,               // Allow data export
  systemSettings: false            // System-wide settings panel
}
```

### Notifications
```typescript
notifications: {
  enabled: false,                  // Master switch
  email: false,                    // Email notifications
  inApp: true,                     // In-app notifications
  push: false,                     // Push notifications (future)
  digest: false,                   // Daily/weekly digest
  instantHelp: true,              // Notify when help offered
  statusUpdates: true             // Notify on status changes
}
```

## Implementation Guide

### 1. Setting Feature Flags

**Environment Variables (.env.local):**
```bash
# Contact Exchange
NEXT_PUBLIC_CONTACT_EXCHANGE_TYPE=display
NEXT_PUBLIC_CONTACT_EXCHANGE_ENABLED=true

# Categories
NEXT_PUBLIC_CATEGORY_SOURCE=static
NEXT_PUBLIC_CATEGORY_ADMIN_MANAGED=false

# Location
NEXT_PUBLIC_LOCATION_GRANULARITY=neighborhood
NEXT_PUBLIC_LOCATION_OVERRIDE=false

# Typography
NEXT_PUBLIC_BASE_FONT_SIZE=16
NEXT_PUBLIC_READABLE_MODE=true

# Brand Colors
NEXT_PUBLIC_USE_BRAND_COLORS=true
```

### 2. Loading Feature Flags

**lib/features.ts:**
```typescript
export const features = {
  contactExchange: {
    enabled: process.env.NEXT_PUBLIC_CONTACT_EXCHANGE_ENABLED === 'true',
    type: process.env.NEXT_PUBLIC_CONTACT_EXCHANGE_TYPE || 'pending',
    // ... other settings
  },
  // ... other features
};
```

### 3. Using Feature Flags in Components

```typescript
import { features } from '@/lib/features';

export function MyComponent() {
  // Conditional rendering
  if (!features.contactExchange.enabled) {
    return null;
  }

  // Conditional logic
  const showEmail = features.contactExchange.showEmail;
  
  // Dynamic styling
  const fontSize = features.typography.readableMode 
    ? `${features.typography.baseSize * features.typography.readableScale}px`
    : `${features.typography.baseSize}px`;

  return (
    <div style={{ fontSize }}>
      {/* Component content */}
    </div>
  );
}
```

### 4. Feature Flag Combinations

**Scenario 1: Simple Contact Display**
```typescript
{
  contactExchange: { enabled: true, type: 'display' },
  notifications: { enabled: false }
}
```

**Scenario 2: Full Messaging System**
```typescript
{
  contactExchange: { enabled: true, type: 'message' },
  notifications: { enabled: true, inApp: true }
}
```

**Scenario 3: Admin-Managed Platform**
```typescript
{
  categories: { source: 'database', adminManaged: true },
  adminFeatures: { categoryManagement: true, analytics: true }
}
```

## Testing Feature Flags

### Unit Tests
```typescript
describe('Feature Flags', () => {
  it('should handle disabled contact exchange', () => {
    features.contactExchange.enabled = false;
    // Test that contact exchange UI is hidden
  });

  it('should scale fonts in readable mode', () => {
    features.typography.readableMode = true;
    // Test that fonts are scaled appropriately
  });
});
```

### Integration Tests
```typescript
describe('Contact Exchange Flow', () => {
  beforeEach(() => {
    features.contactExchange = {
      enabled: true,
      type: 'display',
      showEmail: true,
      showPhone: false
    };
  });

  it('should show only email when phone is disabled', () => {
    // Test implementation
  });
});
```

## Migration Strategy

### Phase 1: Static Implementation
- All features hardcoded
- Feature flags control visibility only

### Phase 2: Dynamic Features
- Database-backed features
- Admin UI for management
- Real-time updates

### Phase 3: User Preferences
- Per-user feature settings
- Preference persistence
- Bulk preference management

## Rollback Procedures

### Disabling a Feature
1. Set feature flag to `false` in environment
2. Redeploy application
3. Feature UI disappears immediately
4. Data remains intact for re-enabling

### Reverting Database Changes
```sql
-- Disable dynamic categories
UPDATE system_settings 
SET value = 'static' 
WHERE key = 'category_source';

-- Remove custom categories
DELETE FROM categories 
WHERE is_custom = true;
```

## Monitoring

### Track Feature Usage
```typescript
// Analytics tracking
function trackFeatureUsage(feature: string, action: string) {
  if (features.analytics.enabled) {
    analytics.track('feature_usage', {
      feature,
      action,
      timestamp: new Date()
    });
  }
}
```

### Error Handling
```typescript
try {
  if (features.contactExchange.enabled) {
    await sendContactInfo();
  }
} catch (error) {
  console.error('Contact exchange failed:', error);
  // Fallback to basic display
  features.contactExchange.type = 'display';
}
```

## Best Practices

1. **Default to Disabled**: New features should default to `false`
2. **Gradual Rollout**: Enable features for subset of users first
3. **Clear Naming**: Use descriptive, consistent flag names
4. **Document Changes**: Update this file when adding flags
5. **Test Combinations**: Test feature flag interactions
6. **Provide Fallbacks**: Always have fallback behavior
7. **Monitor Impact**: Track performance impact of features

## Future Considerations

### Planned Feature Flags
- `multiLanguage`: Support for multiple languages
- `payments`: Payment processing integration
- `scheduling`: Advanced scheduling features
- `reporting`: Custom report generation
- `api`: External API access
- `mobile`: Mobile-specific features
- `offline`: Offline capability

### Dynamic Feature Management
Future implementation of admin UI for:
- Toggle features without deployment
- A/B testing capabilities
- User segment targeting
- Feature flag scheduling
- Audit logging of changes