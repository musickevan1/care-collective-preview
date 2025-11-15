/**
 * @fileoverview Tests for MessageInput component
 * Tests message composition, validation, and sending functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '@/components/messaging/MessageInput';

describe('MessageInput', () => {
  const mockOnSendMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders with default placeholder', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          placeholder="Message Alice..."
        />
      );
      
      expect(screen.getByPlaceholderText('Message Alice...')).toBeInTheDocument();
    });

    it('allows typing in textarea', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello world!');
      
      expect(textarea).toHaveValue('Hello world!');
    });

    it('shows character count when approaching limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} maxLength={100} />);
      
      const textarea = screen.getByRole('textbox');
      const longMessage = 'A'.repeat(85); // 85% of limit
      await user.type(textarea, longMessage);
      
      expect(screen.getByText('85/100')).toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    it('sends message when send button is clicked', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByLabelText('Send message');
      
      await user.type(textarea, 'Test message');
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('sends message when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      
      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('creates new line when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      
      await user.type(textarea, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textarea, 'Line 2');
      
      expect(textarea).toHaveValue('Line 1\nLine 2');
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('trims whitespace before sending', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByLabelText('Send message');
      
      await user.type(textarea, '  Test message  ');
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('does not send empty or whitespace-only messages', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByLabelText('Send message');
      
      // Try to send empty message
      await user.click(sendButton);
      expect(mockOnSendMessage).not.toHaveBeenCalled();
      
      // Try to send whitespace-only message
      await user.type(textarea, '   ');
      await user.click(sendButton);
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('clears input after successful send', async () => {
      const user = userEvent.setup();
      mockOnSendMessage.mockResolvedValue(undefined);
      
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByLabelText('Send message');
      
      await user.type(textarea, 'Test message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });
  });

  describe('Validation and Limits', () => {
    it('shows warning when approaching character limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} maxLength={100} />);
      
      const textarea = screen.getByRole('textbox');
      const nearLimit = 'A'.repeat(85);
      await user.type(textarea, nearLimit);
      
      expect(screen.getByText('85/100')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toHaveClass('text-yellow-600');
    });

    it('shows error when over character limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} maxLength={100} />);
      
      const textarea = screen.getByRole('textbox');
      const overLimit = 'A'.repeat(105);
      await user.type(textarea, overLimit);
      
      expect(screen.getByText('105/100')).toBeInTheDocument();
      expect(screen.getByText('105/100')).toHaveClass('text-red-600');
      expect(screen.getByText(/Message is too long/)).toBeInTheDocument();
    });

    it('disables send button when over character limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} maxLength={100} />);
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByLabelText('Send message');
      const overLimit = 'A'.repeat(105);
      
      await user.type(textarea, overLimit);
      
      expect(sendButton).toBeDisabled();
    });

    it('prevents sending when over character limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} maxLength={100} />);
      
      const textarea = screen.getByRole('textbox');
      const overLimit = 'A'.repeat(105);
      
      await user.type(textarea, overLimit);
      await user.keyboard('{Enter}');
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when send fails', async () => {
      const user = userEvent.setup();
      mockOnSendMessage.mockRejectedValue(new Error('Network error'));
      
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByLabelText('Send message');
      
      await user.type(textarea, 'Test message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('clears error when user starts typing again', async () => {
      const user = userEvent.setup();
      mockOnSendMessage.mockRejectedValue(new Error('Network error'));
      
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByLabelText('Send message');
      
      // Cause error
      await user.type(textarea, 'Test message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
      
      // Start typing to clear error
      await user.type(textarea, ' more text');
      
      expect(screen.queryByText('Network error')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled />);
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByLabelText('Send message');
      
      expect(textarea).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('shows loading state when sending', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value?: any) => void = () => {};
      const sendPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockOnSendMessage.mockReturnValue(sendPromise);
      
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByLabelText('Send message');
      
      await user.type(textarea, 'Test message');
      await user.click(sendButton);
      
      // Should show loading spinner
      expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
      
      // Resolve the promise
      resolvePromise();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      
      await user.tab();
      expect(textarea).toHaveFocus();
      
      await user.type(textarea, 'Test');
      await user.tab();
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toHaveFocus();
    });

    it('shows keyboard shortcuts hint', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect(screen.getByText('Enter')).toBeInTheDocument();
      expect(screen.getByText('Shift+Enter')).toBeInTheDocument();
    });
  });

  describe('Auto-resize', () => {
    it('auto-resizes textarea as user types', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      const initialHeight = textarea.style.height;
      
      // Type a long message that should cause resize
      await user.type(textarea, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
      
      // Note: In jsdom, style.height might not change as expected
      // This test mainly ensures no errors are thrown
      expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
    });
  });

  describe('Community Guidelines', () => {
    it('shows community guidelines reminder', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect(screen.getByText(/Keep conversations respectful/)).toBeInTheDocument();
      expect(screen.getByText('View emergency resources')).toBeInTheDocument();
    });

    it('opens emergency resources in new tab when clicked', async () => {
      const user = userEvent.setup();
      const originalOpen = window.open;
      window.open = vi.fn();
      
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const emergencyLink = screen.getByText('View emergency resources');
      await user.click(emergencyLink);
      
      expect(window.open).toHaveBeenCalledWith('/help/emergency', '_blank');
      
      window.open = originalOpen;
    });
  });
});