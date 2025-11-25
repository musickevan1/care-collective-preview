/**
 * Default avatar options for user profiles
 * Using Care Collective brand colors
 */

export interface DefaultAvatar {
  id: string;
  url: string;
  label: string;
  description: string;
}

export const DEFAULT_AVATARS: readonly DefaultAvatar[] = [
  {
    id: 'caring-hands',
    url: '/avatars/defaults/caring-hands.svg',
    label: 'Caring Hands',
    description: 'A heart cradled in caring hands'
  },
  {
    id: 'heart-circle',
    url: '/avatars/defaults/heart-circle.svg',
    label: 'Heart',
    description: 'A warm heart symbol'
  },
  {
    id: 'community',
    url: '/avatars/defaults/community.svg',
    label: 'Community',
    description: 'Three connected people'
  },
  {
    id: 'sunburst',
    url: '/avatars/defaults/sunburst.svg',
    label: 'Sunburst',
    description: 'A bright sunburst pattern'
  },
  {
    id: 'leaf',
    url: '/avatars/defaults/leaf.svg',
    label: 'Leaf',
    description: 'A peaceful leaf design'
  },
  {
    id: 'waves',
    url: '/avatars/defaults/waves.svg',
    label: 'Waves',
    description: 'Flowing wave pattern'
  },
  {
    id: 'star',
    url: '/avatars/defaults/star.svg',
    label: 'Star',
    description: 'A bright star'
  },
  {
    id: 'circles',
    url: '/avatars/defaults/circles.svg',
    label: 'Circles',
    description: 'Overlapping circles'
  }
] as const;

/**
 * Check if a URL is a default avatar
 */
export function isDefaultAvatar(url: string | null | undefined): boolean {
  if (!url) return false;
  return DEFAULT_AVATARS.some(avatar => avatar.url === url);
}

/**
 * Get a default avatar by ID
 */
export function getDefaultAvatar(id: string): DefaultAvatar | undefined {
  return DEFAULT_AVATARS.find(avatar => avatar.id === id);
}
