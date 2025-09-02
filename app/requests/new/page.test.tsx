/**
 * @fileoverview Tests for New Help Request page
 * Tests Care Collective help request creation workflow and validation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/tests/utils';
import userEvent from '@testing-library/user-event';
import NewRequestPage from './page';
import { mockSupabaseClient } from '@/tests/mocks/supabase';

// Mock Next.js modules
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('NewRequestPage', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'alice@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default auth response
    mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Setup default insert response
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      rangeGt: vi.fn().mockReturnThis(),
      rangeGte: vi.fn().mockReturnThis(),
      rangeLt: vi.fn().mockReturnThis(),
      rangeLte: vi.fn().mockReturnThis(),
      rangeAdjacent: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      csv: vi.fn().mockResolvedValue({ data: null, error: null }),
      geojson: vi.fn().mockResolvedValue({ data: null, error: null }),
      explain: vi.fn().mockResolvedValue({ data: null, error: null }),
      rollback: vi.fn().mockResolvedValue({ data: null, error: null }),
      returns: vi.fn().mockReturnThis(),
    });
  });

  describe('Page Structure and Content', () => {
    it('renders help request creation form with Care Collective branding', () => {
      render(<NewRequestPage />);
      
      expect(screen.getByRole('heading', { name: 'Create Help Request' })).toBeInTheDocument();
      expect(screen.getByText('Let the community know how they can help you')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Request Details' })).toBeInTheDocument();
      expect(screen.getByText('Fill out the form below to let others know how they can help you.')).toBeInTheDocument();
    });

    it('displays navigation back to requests page', () => {
      render(<NewRequestPage />);
      
      const backLink = screen.getByRole('link', { name: '← Back' });
      expect(backLink).toHaveAttribute('href', '/requests');
    });

    it('displays all form fields with proper labels', () => {
      render(<NewRequestPage />);
      
      expect(screen.getByLabelText('Request Title *')).toBeInTheDocument();
      expect(screen.getByLabelText('Category *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
      expect(screen.getByText('Urgency Level *')).toBeInTheDocument();
      expect(screen.getByLabelText('Location for This Request (Optional)')).toBeInTheDocument();
      expect(screen.getByText('Who Can See the Location?')).toBeInTheDocument();
    });
  });

  describe('Form Validation and Input Handling', () => {
    it('updates form state when user types in title field', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      const titleInput = screen.getByLabelText('Request Title *');
      await user.type(titleInput, 'Need help with groceries');
      
      expect(titleInput).toHaveValue('Need help with groceries');
    });

    it('updates form state when user selects category', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      const categorySelect = screen.getByLabelText('Category *');
      await user.selectOptions(categorySelect, 'groceries');
      
      expect(categorySelect).toHaveValue('groceries');
    });

    it('updates form state when user types in description', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      const descriptionTextarea = screen.getByLabelText('Description (Optional)');
      await user.type(descriptionTextarea, 'I need someone to pick up groceries from the store.');
      
      expect(descriptionTextarea).toHaveValue('I need someone to pick up groceries from the store.');
    });

    it('updates urgency level when user selects radio button', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      const urgentRadio = screen.getByRole('radio', { name: /urgent/i });
      await user.click(urgentRadio);
      
      expect(urgentRadio).toBeChecked();
    });

    it('enforces title character limit', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      const titleInput = screen.getByLabelText('Request Title *');
      expect(titleInput).toHaveAttribute('maxLength', '100');
    });

    it('enforces description character limit', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      const descriptionTextarea = screen.getByLabelText('Description (Optional)');
      expect(descriptionTextarea).toHaveAttribute('maxLength', '500');
    });

    it('disables submit button when required fields are empty', () => {
      render(<NewRequestPage />);
      
      const submitButton = screen.getByRole('button', { name: 'Create Request' });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when required fields are filled', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      const titleInput = screen.getByLabelText('Request Title *');
      const categorySelect = screen.getByLabelText('Category *');
      const submitButton = screen.getByRole('button', { name: 'Create Request' });
      
      await user.type(titleInput, 'Need help');
      await user.selectOptions(categorySelect, 'groceries');
      
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Care Collective Categories', () => {
    it('displays all Care Collective help categories', () => {
      render(<NewRequestPage />);
      
      const expectedCategories = [
        'Groceries & Shopping',
        'Transportation',
        'Household Tasks',
        'Medical & Pharmacy',
        'Meal Preparation',
        'Childcare & Family',
        'Pet Care',
        'Technology Help',
        'Companionship',
        'Respite Care',
        'Emotional Support',
        'Other',
      ];
      
      expectedCategories.forEach(category => {
        expect(screen.getByRole('option', { name: category })).toBeInTheDocument();
      });
    });

    it('displays urgency levels with clear descriptions', () => {
      render(<NewRequestPage />);
      
      expect(screen.getByText('Normal - Can wait a few days')).toBeInTheDocument();
      expect(screen.getByText('Urgent - Needed within 24 hours')).toBeInTheDocument();
      expect(screen.getByText('Critical - Emergency assistance needed')).toBeInTheDocument();
    });

    it('defaults to normal urgency level', () => {
      render(<NewRequestPage />);
      
      const normalRadio = screen.getByRole('radio', { name: /normal/i });
      expect(normalRadio).toBeChecked();
    });
  });

  describe('Privacy and Location Settings', () => {
    it('displays location privacy options', () => {
      render(<NewRequestPage />);
      
      expect(screen.getByRole('option', { name: 'Everyone (Public)' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Only People Who Offer Help' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Only After I Accept Help' })).toBeInTheDocument();
    });

    it('defaults to public location privacy', () => {
      render(<NewRequestPage />);
      
      const locationPrivacySelect = screen.getByLabelText('Who Can See the Location?');
      expect(locationPrivacySelect).toHaveValue('public');
    });

    it('updates location privacy when user selects option', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      const locationPrivacySelect = screen.getByLabelText('Who Can See the Location?');
      await user.selectOptions(locationPrivacySelect, 'helpers_only');
      
      expect(locationPrivacySelect).toHaveValue('helpers_only');
    });
  });

  describe('Form Submission', () => {
    it('successfully creates help request and redirects', async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();
      
      vi.doMock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush }),
      }));
      
      render(<NewRequestPage />);
      
      const titleInput = screen.getByLabelText('Request Title *');
      const categorySelect = screen.getByLabelText('Category *');
      const descriptionTextarea = screen.getByLabelText('Description (Optional)');
      const submitButton = screen.getByRole('button', { name: 'Create Request' });
      
      await user.type(titleInput, 'Need groceries picked up');
      await user.selectOptions(categorySelect, 'groceries');
      await user.type(descriptionTextarea, 'I need help with weekly grocery shopping');
      await user.click(submitButton);
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('help_requests');
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        title: 'Need groceries picked up',
        description: 'I need help with weekly grocery shopping',
        category: 'groceries',
        urgency: 'normal',
        user_id: mockUser.id,
        location_override: null,
        location_privacy: 'public',
      });
    });

    it('displays error when user is not authenticated', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      });
      
      render(<NewRequestPage />);
      
      const titleInput = screen.getByLabelText('Request Title *');
      const categorySelect = screen.getByLabelText('Category *');
      const submitButton = screen.getByRole('button', { name: 'Create Request' });
      
      await user.type(titleInput, 'Need help');
      await user.selectOptions(categorySelect, 'groceries');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('You must be logged in to create a request')).toBeInTheDocument();
      });
    });

    it('displays error when database operation fails', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
        upsert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        containedBy: vi.fn().mockReturnThis(),
        rangeGt: vi.fn().mockReturnThis(),
        rangeGte: vi.fn().mockReturnThis(),
        rangeLt: vi.fn().mockReturnThis(),
        rangeLte: vi.fn().mockReturnThis(),
        rangeAdjacent: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        csv: vi.fn().mockResolvedValue({ data: null, error: null }),
        geojson: vi.fn().mockResolvedValue({ data: null, error: null }),
        explain: vi.fn().mockResolvedValue({ data: null, error: null }),
        rollback: vi.fn().mockResolvedValue({ data: null, error: null }),
        returns: vi.fn().mockReturnThis(),
      });
      
      render(<NewRequestPage />);
      
      const titleInput = screen.getByLabelText('Request Title *');
      const categorySelect = screen.getByLabelText('Category *');
      const submitButton = screen.getByRole('button', { name: 'Create Request' });
      
      await user.type(titleInput, 'Need help');
      await user.selectOptions(categorySelect, 'groceries');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Database error')).toBeInTheDocument();
      });
    });

    it('disables form during submission', async () => {
      const user = userEvent.setup();
      
      // Make the insert operation hang
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn(() => new Promise(() => {})),
        upsert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        containedBy: vi.fn().mockReturnThis(),
        rangeGt: vi.fn().mockReturnThis(),
        rangeGte: vi.fn().mockReturnThis(),
        rangeLt: vi.fn().mockReturnThis(),
        rangeLte: vi.fn().mockReturnThis(),
        rangeAdjacent: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        csv: vi.fn().mockResolvedValue({ data: null, error: null }),
        geojson: vi.fn().mockResolvedValue({ data: null, error: null }),
        explain: vi.fn().mockResolvedValue({ data: null, error: null }),
        rollback: vi.fn().mockResolvedValue({ data: null, error: null }),
        returns: vi.fn().mockReturnThis(),
      });
      
      render(<NewRequestPage />);
      
      const titleInput = screen.getByLabelText('Request Title *');
      const categorySelect = screen.getByLabelText('Category *');
      const submitButton = screen.getByRole('button', { name: 'Create Request' });
      
      await user.type(titleInput, 'Need help');
      await user.selectOptions(categorySelect, 'groceries');
      await user.click(submitButton);
      
      expect(titleInput).toBeDisabled();
      expect(categorySelect).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure and labels', () => {
      render(<NewRequestPage />);
      
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText('Request Title *')).toBeRequired();
      expect(screen.getByLabelText('Category *')).toBeRequired();
    });

    it('provides helpful descriptions and guidance', () => {
      render(<NewRequestPage />);
      
      expect(screen.getByText('Be clear and specific. For example: "Need groceries picked up" or "Help moving furniture"')).toBeInTheDocument();
      expect(screen.getByText('Include any specific requirements, timing, or other helpful details')).toBeInTheDocument();
      expect(screen.getByText('Control who can see your location information')).toBeInTheDocument();
    });

    it('associates labels with form controls', () => {
      render(<NewRequestPage />);
      
      const titleInput = screen.getByLabelText('Request Title *');
      expect(titleInput).toHaveAttribute('id', 'title');
      
      const categorySelect = screen.getByLabelText('Category *');
      expect(categorySelect).toHaveAttribute('id', 'category');
      
      const descriptionTextarea = screen.getByLabelText('Description (Optional)');
      expect(descriptionTextarea).toHaveAttribute('id', 'description');
    });

    it('supports keyboard navigation through radio buttons', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      const normalRadio = screen.getByRole('radio', { name: /normal/i });
      const urgentRadio = screen.getByRole('radio', { name: /urgent/i });
      
      normalRadio.focus();
      expect(normalRadio).toHaveFocus();
      
      await user.keyboard('{ArrowDown}');
      expect(urgentRadio).toHaveFocus();
    });
  });

  describe('Mobile-First Design', () => {
    it('renders responsive layout classes', () => {
      render(<NewRequestPage />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
      
      // Check for responsive padding and text sizes
      expect(screen.getByRole('heading', { name: 'Create Help Request' })).toHaveClass('text-xl', 'sm:text-2xl');
    });

    it('uses appropriate input sizes for mobile interaction', () => {
      render(<NewRequestPage />);
      
      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(radio => {
        expect(radio).toHaveClass('w-5', 'h-5', 'sm:w-4', 'sm:h-4');
      });
    });
  });

  describe('Help Request Data Validation', () => {
    it('handles optional fields correctly', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      const titleInput = screen.getByLabelText('Request Title *');
      const categorySelect = screen.getByLabelText('Category *');
      const submitButton = screen.getByRole('button', { name: 'Create Request' });
      
      await user.type(titleInput, 'Simple request');
      await user.selectOptions(categorySelect, 'other');
      await user.click(submitButton);
      
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        title: 'Simple request',
        description: null,
        category: 'other',
        urgency: 'normal',
        user_id: mockUser.id,
        location_override: null,
        location_privacy: 'public',
      });
    });

    it('includes location override when provided', async () => {
      const user = userEvent.setup();
      render(<NewRequestPage />);
      
      const titleInput = screen.getByLabelText('Request Title *');
      const categorySelect = screen.getByLabelText('Category *');
      const locationInput = screen.getByLabelText('Location for This Request (Optional)');
      const submitButton = screen.getByRole('button', { name: 'Create Request' });
      
      await user.type(titleInput, 'Need help');
      await user.selectOptions(categorySelect, 'groceries');
      await user.type(locationInput, 'Downtown Springfield');
      await user.click(submitButton);
      
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          location_override: 'Downtown Springfield',
        })
      );
    });
  });
});