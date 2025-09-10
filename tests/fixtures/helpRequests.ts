import { Database } from '@/lib/database.types';

type HelpRequest = Database['public']['Tables']['help_requests']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export const mockProfile: Profile = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Alice Johnson',
  location: 'Springfield, MO',
  created_at: '2025-01-20T10:00:00Z',
  verification_status: 'approved',
  application_reason: 'Want to help my community',
  applied_at: '2025-01-20T09:00:00Z',
  approved_at: '2025-01-20T09:30:00Z',
  approved_by: '999e9999-e89b-12d3-a456-426614174999',
  rejection_reason: null,
  is_admin: false,
  contact_preferences: null,
  phone: '+1-417-555-0123',
};

export const mockHelpRequest: HelpRequest = {
  id: '456e7890-e89b-12d3-a456-426614174001',
  user_id: mockProfile.id,
  title: 'Need groceries picked up',
  description: 'I need someone to pick up groceries from the store. I can provide a shopping list and payment.',
  category: 'groceries',
  urgency: 'urgent',
  status: 'open',
  created_at: '2025-01-20T10:00:00Z',
  updated_at: '2025-01-20T10:00:00Z',
  helper_id: null,
  helped_at: null,
  completed_at: null,
  cancelled_at: null,
  cancel_reason: null,
  location_override: null,
  location_privacy: 'neighborhood',
};

export const mockHelpRequestWithProfile = {
  ...mockHelpRequest,
  profiles: mockProfile,
};

export const mockHelpRequests: HelpRequest[] = [
  mockHelpRequest,
  {
    id: '789e0123-e89b-12d3-a456-426614174002',
    user_id: '789e0123-e89b-12d3-a456-426614174003',
    title: 'Transportation to medical appointment',
    description: 'I need a ride to my doctor appointment on Thursday at 2 PM.',
    category: 'transport',
    urgency: 'normal',
    status: 'open',
    created_at: '2025-01-19T14:30:00Z',
    updated_at: '2025-01-19T14:30:00Z',
    helper_id: null,
    helped_at: null,
    completed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    location_override: null,
    location_privacy: 'approximate',
  },
  {
    id: '012e3456-e89b-12d3-a456-426614174004',
    user_id: '012e3456-e89b-12d3-a456-426614174005',
    title: 'Help with household repairs',
    description: 'My kitchen faucet is leaking and I need help fixing it.',
    category: 'household',
    urgency: 'normal',
    status: 'in_progress',
    created_at: '2025-01-18T09:15:00Z',
    updated_at: '2025-01-18T12:00:00Z',
    helper_id: '555e5555-e89b-12d3-a456-426614174555',
    helped_at: '2025-01-18T12:00:00Z',
    completed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    location_override: null,
    location_privacy: 'exact',
  },
];

export const mockContactExchange = {
  id: '345e6789-e89b-12d3-a456-426614174006',
  request_id: mockHelpRequest.id,
  requester_id: mockProfile.id,
  helper_id: '678e9012-e89b-12d3-a456-426614174007',
  message: 'I can help with your grocery shopping. What time works best for you?',
  contact_method: 'phone' as const,
  contact_shared: '2025-01-20T11:00:00Z',
  consent_given: true,
  created_at: '2025-01-20T11:00:00Z',
};

export const createMockHelpRequest = (overrides?: Partial<HelpRequest>): HelpRequest => ({
  ...mockHelpRequest,
  ...overrides,
});

export const createMockProfile = (overrides?: Partial<Profile>): Profile => ({
  ...mockProfile,
  ...overrides,
});