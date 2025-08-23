/**
 * @fileoverview Tests for Button component
 * Tests accessibility, variants, and Care Collective specific requirements
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button Component', () => {
  describe('Basic Functionality', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('handles click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
      render(<Button disabled>Disabled button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Button with ref</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Care Collective Variants', () => {
    it('renders sage variant with Care Collective branding', () => {
      render(<Button variant="sage">Sage Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-sage-dark');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('hover:bg-sage-accessible');
    });

    it('renders rose variant with Care Collective branding', () => {
      render(<Button variant="rose">Rose Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-dusty-rose-accessible');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('hover:bg-dusty-rose-dark');
    });

    it('renders terracotta variant with Care Collective branding', () => {
      render(<Button variant="terracotta">Terracotta Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-terracotta');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('hover:bg-terracotta/90');
    });

    it('renders default variant correctly', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-primary-foreground');
      expect(button).toHaveClass('hover:bg-primary/90');
    });
  });

  describe('Accessibility Requirements (WCAG 2.1 AA)', () => {
    it('has minimum touch target size of 44px', () => {
      render(<Button>Accessible Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('h-11');
    });

    it('has proper focus styles for keyboard navigation', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-ring');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });

    it('supports keyboard interaction', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Keyboard Button</Button>);
      const button = screen.getByRole('button');
      
      // Test Enter key
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Test Space key
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('has accessible color contrast with focus indicators', () => {
      render(<Button variant="sage">High Contrast</Button>);
      const button = screen.getByRole('button');
      
      // Sage variant should have accessible focus ring
      expect(button).toHaveClass('focus-visible:ring-sage/50');
    });
  });

  describe('Size Variants for Mobile-First Design', () => {
    it('renders small size with accessible minimum height', () => {
      render(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('min-h-[40px]'); // Still accessible
      expect(button).toHaveClass('px-3');
    });

    it('renders large size for important actions', () => {
      render(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-12');
      expect(button).toHaveClass('min-h-[48px]');
      expect(button).toHaveClass('px-8');
    });

    it('renders icon size with square dimensions', () => {
      render(<Button size="icon" aria-label="Icon button">🏠</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('w-11');
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('min-w-[44px]');
    });
  });

  describe('asChild Prop for Flexible Composition', () => {
    it('renders as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/help">Help Link</a>
        </Button>
      );
      
      const link = screen.getByRole('link', { name: 'Help Link' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/help');
      // Should still have button styles
      expect(link).toHaveClass('inline-flex');
      expect(link).toHaveClass('min-h-[44px]');
    });
  });

  describe('Edge Cases and Error States', () => {
    it('handles empty children gracefully', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('inline-flex');
    });

    it('maintains accessibility with custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('custom-class');
      // Should maintain accessibility classes
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('preserves HTML button attributes', () => {
      render(
        <Button 
          type="submit" 
          form="help-form"
          data-testid="submit-button"
        >
          Submit
        </Button>
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('form', 'help-form');
      expect(button).toHaveAttribute('data-testid', 'submit-button');
    });
  });

  describe('Care Collective Context Usage', () => {
    it('renders help request action button appropriately', () => {
      render(
        <Button variant="sage" size="lg">
          Offer Help
        </Button>
      );
      const button = screen.getByRole('button', { name: 'Offer Help' });
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-sage-dark'); // Care Collective primary action
      expect(button).toHaveClass('min-h-[48px]'); // Large for important actions
    });

    it('renders emergency/urgent action with appropriate styling', () => {
      render(
        <Button variant="terracotta">
          Emergency Contact
        </Button>
      );
      const button = screen.getByRole('button', { name: 'Emergency Contact' });
      
      expect(button).toHaveClass('bg-terracotta'); // Urgent action color
      expect(button).toHaveClass('text-white'); // High contrast
    });
  });
});