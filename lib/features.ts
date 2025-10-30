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
  designSystem: true, // Always show design system on preview
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

/**
 * Check if Messaging V2 is enabled
 * Supports three rollout strategies:
 * - Explicit enable/disable via NEXT_PUBLIC_MESSAGING_V2_ENABLED
 * - Internal testing via NEXT_PUBLIC_MESSAGING_V2_ROLLOUT='internal'
 * - Percentage-based rollout via NEXT_PUBLIC_MESSAGING_V2_ROLLOUT='percentage:X'
 */
export function isMessagingV2Enabled(): boolean {
  // Check environment variable for explicit enable/disable
  const envFlag = process.env.NEXT_PUBLIC_MESSAGING_V2_ENABLED;

  if (envFlag === 'true') {
    return true;
  }

  if (envFlag === 'false') {
    return false;
  }

  // Check rollout configuration
  const rolloutConfig = process.env.NEXT_PUBLIC_MESSAGING_V2_ROLLOUT;

  if (!rolloutConfig) {
    // Default: disabled
    return false;
  }

  // Internal testing mode
  if (rolloutConfig === 'internal') {
    // TODO: Check if user is internal tester
    // For now, enable for all (will be restricted server-side)
    return true;
  }

  // Percentage rollout (e.g., "percentage:10" for 10% of users)
  if (rolloutConfig.startsWith('percentage:')) {
    const percentage = parseInt(rolloutConfig.split(':')[1], 10);

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      console.warn('[features] Invalid percentage rollout config:', rolloutConfig);
      return false;
    }

    // Simple random rollout (not user-based, for simplicity)
    // In production, should use userId for consistent experience
    return Math.random() * 100 < percentage;
  }

  // Unknown config, default to disabled
  console.warn('[features] Unknown rollout config:', rolloutConfig);
  return false;
}