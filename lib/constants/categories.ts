/**
 * @fileoverview Central category definitions for help requests
 * Single source of truth for all category-related data
 */

import {
  Heart,
  ShoppingCart,
  Car,
  Home,
  Laptop,
  Users,
  MoreHorizontal,
  type LucideIcon
} from 'lucide-react';

/**
 * Category identifiers (used in database and validation)
 */
export const CATEGORY_VALUES = [
  'health-caregiving',
  'groceries-meals',
  'transportation-errands',
  'household-yard',
  'technology-administrative',
  'social-companionship',
  'other'
] as const;

export type CategoryValue = typeof CATEGORY_VALUES[number];

/**
 * Category metadata for UI display
 */
export interface CategoryMetadata {
  value: CategoryValue;
  label: string;
  emoji: string;
  icon: LucideIcon;
  description: string;
  subcategories?: string[];
}

/**
 * Complete category definitions with subcategories
 */
export const CATEGORIES: CategoryMetadata[] = [
  {
    value: 'health-caregiving',
    label: 'Health & Caregiving',
    emoji: '💊',
    icon: Heart,
    description: 'Medical appointments, caregiving tasks, and health-related support',
    subcategories: [
      'Advocacy/accompaniment to care appointments',
      'Assistance with caregiving tasks (transfers, bathing)',
      'Medical task guidance',
      'Picking up/dropping off medical supplies or prescriptions',
      'Respite care (short-term relief for primary caregiver)',
      'Other health & caregiving support'
    ]
  },
  {
    value: 'groceries-meals',
    label: 'Groceries & Meals',
    emoji: '🛒',
    icon: ShoppingCart,
    description: 'Food shopping, meal preparation, and delivery',
    subcategories: [
      'Grocery shopping or delivery',
      'Meal preparation or meal train',
      'Other grocery & meal support'
    ]
  },
  {
    value: 'transportation-errands',
    label: 'Transportation & Errands',
    emoji: '🚗',
    icon: Car,
    description: 'Rides, errands, and transportation assistance',
    subcategories: [
      'General errands/shopping',
      'Prescription pickup',
      'Rides to appointments',
      'Other transportation & errands'
    ]
  },
  {
    value: 'household-yard',
    label: 'Household & Yard',
    emoji: '🏠',
    icon: Home,
    description: 'Home maintenance, cleaning, and yard work',
    subcategories: [
      'Cleaning and laundry',
      'Dog walking or pet sitting',
      'Minor home repairs/maintenance',
      'Moving/packing assistance',
      'Snow shoveling',
      'Yardwork and gardening',
      'Other household & yard tasks'
    ]
  },
  {
    value: 'technology-administrative',
    label: 'Technology & Administrative',
    emoji: '💻',
    icon: Laptop,
    description: 'Tech help, paperwork, and administrative tasks',
    subcategories: [
      'Explaining complex medical/legal information',
      'Financial/insurance paperwork',
      'Organizing bills and mail',
      'Setting up or troubleshooting devices',
      'Teaching tech skills (e.g., video calls, apps)',
      'Translation or interpretation support',
      'Other technology & administrative help'
    ]
  },
  {
    value: 'social-companionship',
    label: 'Social & Companionship',
    emoji: '👥',
    icon: Users,
    description: 'Companionship, visits, and social connection',
    subcategories: [
      'Attending caregiving-related events together',
      'In-person visits or walks',
      'Phone/video call check-ins',
      'Other social & companionship'
    ]
  },
  {
    value: 'other',
    label: 'Other Requests',
    emoji: '📋',
    icon: MoreHorizontal,
    description: 'Other types of support not listed above',
    subcategories: undefined // Freeform description
  }
];

/**
 * Get category by value
 */
export function getCategoryByValue(value: CategoryValue): CategoryMetadata | undefined {
  return CATEGORIES.find(cat => cat.value === value);
}

/**
 * Get all category values (for validation schemas)
 */
export function getCategoryValues(): readonly CategoryValue[] {
  return CATEGORY_VALUES;
}

/**
 * Format category label for display
 */
export function getCategoryLabel(value: CategoryValue): string {
  const category = getCategoryByValue(value);
  return category?.label || value;
}

/**
 * Get category emoji
 */
export function getCategoryEmoji(value: CategoryValue): string {
  const category = getCategoryByValue(value);
  return category?.emoji || '📋';
}

/**
 * Get category icon component
 */
export function getCategoryIcon(value: CategoryValue): LucideIcon {
  const category = getCategoryByValue(value);
  return category?.icon || MoreHorizontal;
}

/**
 * Get category subcategories
 */
export function getCategorySubcategories(value: CategoryValue): string[] | undefined {
  const category = getCategoryByValue(value);
  return category?.subcategories;
}

/**
 * Check if a value is a valid category
 */
export function isValidCategory(value: string): value is CategoryValue {
  return CATEGORY_VALUES.includes(value as CategoryValue);
}

/**
 * Categories for filter panel (includes 'all' option)
 */
export const FILTER_CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: MoreHorizontal },
  ...CATEGORIES.map(cat => ({
    value: cat.value,
    label: cat.label,
    icon: cat.icon
  }))
];
