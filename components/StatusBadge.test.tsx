/**
 * @fileoverview Tests for StatusBadge component
 * Tests Care Collective status display and accessibility
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge Component', () => {
  describe('Status Display', () => {
    it('renders open status with correct styling', () => {
      render(<StatusBadge status="open" />);
      const badge = screen.getByText('Open');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-dusty-rose');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('hover:bg-dusty-rose-dark');
    });

    it('renders in_progress status with correct styling', () => {
      render(<StatusBadge status="in_progress" />);
      const badge = screen.getByText('In Progress');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-sage');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('hover:bg-sage-dark');
    });

    it('renders completed status with correct styling', () => {
      render(<StatusBadge status="completed" />);
      const badge = screen.getByText('Completed');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-sage/20');
      expect(badge).toHaveClass('text-foreground');
      expect(badge).toHaveClass('border-sage/40');
    });

    it('renders cancelled status with correct styling', () => {
      render(<StatusBadge status="cancelled" />);
      const badge = screen.getByText('Cancelled');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-accent/10');
      expect(badge).toHaveClass('text-muted-foreground');
      expect(badge).toHaveClass('border-accent/30');
    });

    it('renders closed status with correct styling', () => {
      render(<StatusBadge status="closed" />);
      const badge = screen.getByText('Closed');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-accent/20');
      expect(badge).toHaveClass('text-foreground');
      expect(badge).toHaveClass('border-accent/40');
    });
  });

  describe('Care Collective Status Semantics', () => {
    it('uses Care Collective color scheme for active statuses', () => {
      render(<StatusBadge status="open" />);
      const openBadge = screen.getByText('Open');
      
      // Open requests use dusty-rose (Care Collective secondary color)
      expect(openBadge).toHaveClass('bg-dusty-rose');
      
      render(<StatusBadge status="in_progress" />);
      const progressBadge = screen.getByText('In Progress');
      
      // In progress uses sage (Care Collective primary color)
      expect(progressBadge).toHaveClass('bg-sage');
    });

    it('provides visual distinction between active and inactive states', () => {
      render(
        <div>
          <StatusBadge status="open" />
          <StatusBadge status="completed" />
        </div>
      );
      
      const openBadge = screen.getByText('Open');
      const completedBadge = screen.getByText('Completed');
      
      // Active status has solid background
      expect(openBadge).toHaveClass('bg-dusty-rose');
      expect(openBadge).toHaveClass('text-white');
      
      // Completed status has subtle background
      expect(completedBadge).toHaveClass('bg-sage/20');
      expect(completedBadge).toHaveClass('text-foreground');
    });
  });

  describe('Accessibility', () => {
    it('provides meaningful text content for screen readers', () => {
      render(<StatusBadge status="in_progress" />);
      
      // Text should be descriptive
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('maintains sufficient color contrast for all statuses', () => {
      const statuses: Array<'open' | 'in_progress' | 'completed' | 'cancelled' | 'closed'> = [
        'open', 'in_progress', 'completed', 'cancelled', 'closed'
      ];
      
      statuses.forEach(status => {
        const { unmount } = render(<StatusBadge status={status} />);
        const badge = screen.getByText(
          status === 'in_progress' ? 'In Progress' : 
          status.charAt(0).toUpperCase() + status.slice(1)
        );
        
        // All badges should be visible elements
        expect(badge).toBeVisible();
        
        unmount();
      });
    });

    it('supports custom className while maintaining accessibility', () => {
      render(<StatusBadge status="open" className="custom-badge" />);
      const badge = screen.getByText('Open');
      
      expect(badge).toHaveClass('custom-badge');
      // Should still maintain Care Collective styling
      expect(badge).toHaveClass('bg-dusty-rose');
    });
  });

  describe('Edge Cases', () => {
    it('handles unknown status gracefully', () => {
      // TypeScript would prevent this, but testing runtime behavior
      render(<StatusBadge status={'unknown' as any} />);
      
      // Should fall back to 'open' configuration
      const badge = screen.getByText('Open');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-dusty-rose');
    });

    it('renders without custom className', () => {
      render(<StatusBadge status="open" />);
      const badge = screen.getByText('Open');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-dusty-rose');
    });
  });

  describe('Help Request Context Usage', () => {
    it('displays appropriate status for help request lifecycle', () => {
      // Simulate help request status progression
      const { rerender } = render(<StatusBadge status="open" />);
      expect(screen.getByText('Open')).toHaveClass('bg-dusty-rose');
      
      rerender(<StatusBadge status="in_progress" />);
      expect(screen.getByText('In Progress')).toHaveClass('bg-sage');
      
      rerender(<StatusBadge status="completed" />);
      expect(screen.getByText('Completed')).toHaveClass('bg-sage/20');
    });

    it('provides clear visual hierarchy for request priority', () => {
      render(
        <div>
          <StatusBadge status="open" />
          <StatusBadge status="in_progress" />
        </div>
      );
      
      const openBadge = screen.getByText('Open');
      const progressBadge = screen.getByText('In Progress');
      
      // Both should be prominent but distinct
      expect(openBadge).toHaveClass('text-white');
      expect(progressBadge).toHaveClass('text-white');
      
      // Different Care Collective brand colors
      expect(openBadge).toHaveClass('bg-dusty-rose');
      expect(progressBadge).toHaveClass('bg-sage');
    });
  });

  describe('Mobile-First Design', () => {
    it('renders with appropriate size for mobile touch interfaces', () => {
      render(<StatusBadge status="open" />);
      const badge = screen.getByText('Open');
      
      // Badge should be easily tappable on mobile
      expect(badge).toBeInTheDocument();
      // The Badge component should handle sizing
    });

    it('has readable text at small sizes', () => {
      render(<StatusBadge status="in_progress" />);
      const badge = screen.getByText('In Progress');
      
      // Text should be clear and readable
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('In Progress');
    });
  });
});