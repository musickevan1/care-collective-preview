/**
 * Feature Flags Configuration
 * Controls which features are enabled in the application
 * Based on DEVELOPMENT_PLAN.md phases
 */

export const features = {
  // Phase 1 Features
  realtime: process.env.NEXT_PUBLIC_FEATURE_REALTIME === 'true',
  messaging: process.env.NEXT_PUBLIC_FEATURE_MESSAGING === 'true',
  
  // Phase 2 Features
  advancedProfiles: process.env.NEXT_PUBLIC_FEATURE_ADVANCED_PROFILES === 'true',
  smartMatching: process.env.NEXT_PUBLIC_FEATURE_SMART_MATCHING === 'true',
  
  // Phase 3 Features
  groups: process.env.NEXT_PUBLIC_FEATURE_GROUPS === 'true',
  events: process.env.NEXT_PUBLIC_FEATURE_EVENTS === 'true',
  
  // Phase 5 Features
  pwa: process.env.NEXT_PUBLIC_FEATURE_PWA === 'true',
  
  // Admin Features
  previewAdmin: process.env.NEXT_PUBLIC_PREVIEW_ADMIN === '1',
  
  // Development Features
  designSystem: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_FEATURE_DESIGN_SYSTEM === 'true',
} as const;

/**
 * Helper function to check if a feature is enabled
 * @param featureName - The name of the feature to check
 * @returns boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(featureName: keyof typeof features): boolean {
  return features[featureName] ?? false;
}

/**
 * Get all enabled features
 * @returns Array of enabled feature names
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
}

/**
 * Development helper to log feature status
 */
export function logFeatureStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    console.group('🚀 Feature Flags Status');
    Object.entries(features).forEach(([name, enabled]) => {
      console.log(`${enabled ? '✅' : '❌'} ${name}: ${enabled ? 'Enabled' : 'Disabled'}`);
    });
    console.groupEnd();
  }
}