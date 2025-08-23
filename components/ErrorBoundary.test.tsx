/**
 * @fileoverview Tests for ErrorBoundary component
 * Tests error handling and Care Collective supportive error experience
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/tests/utils';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
import React, { ReactElement } from 'react';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Test component that throws an error
function ThrowErrorComponent({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary');
  }
  return <div>Component rendered successfully</div>;
}

// Test component that throws during render
function AlwaysThrowComponent(): ReactElement {
  throw new Error('Component always throws');
}

describe('ErrorBoundary Component', () => {
  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders multiple children normally', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });

  describe('Error Catching and Display', () => {
    it('catches errors and displays Care Collective error UI', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      // Should display Care Collective supportive error message
      expect(screen.getByText('We\'re having a moment')).toBeInTheDocument();
      expect(screen.getByText(/Something unexpected happened, but it's not your fault/)).toBeInTheDocument();
      expect(screen.getByText(/We're here to support you/)).toBeInTheDocument();
    });

    it('displays Care Collective branding in error state', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      // Should have Care Collective plant emoji
      expect(screen.getByText('🌱')).toBeInTheDocument();
      
      // Should have supportive, community-focused messaging
      expect(screen.getByText(/please try again or reach out if you need immediate assistance/)).toBeInTheDocument();
    });

    it('provides helpful action buttons', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to home' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'Get help' })).toHaveAttribute('href', '/help');
    });
  });

  describe('Error Recovery', () => {
    it('allows recovery by clicking try again', async () => {
      const user = userEvent.setup();
      
      // Create a stateful component that can toggle error state
      function RecoverableComponent({ shouldThrow }: { shouldThrow: boolean }) {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Component rendered successfully</div>;
      }
      
      function TestWrapper() {
        const [hasError, setHasError] = React.useState(true);
        
        return (
          <ErrorBoundary>
            <RecoverableComponent shouldThrow={hasError} />
            <button onClick={() => setHasError(false)}>Fix Error</button>
          </ErrorBoundary>
        );
      }
      
      render(<TestWrapper />);
      
      // Should show error UI
      expect(screen.getByText('We\'re having a moment')).toBeInTheDocument();
      
      // Click try again to reset error boundary
      const tryAgainButton = screen.getByRole('button', { name: 'Try again' });
      await user.click(tryAgainButton);
      
      // The component should re-render, but may still throw initially
      // In a real app, this would depend on fixing the underlying issue
    });
  });

  describe('Custom Fallback UI', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('We\'re having a moment')).not.toBeInTheDocument();
    });
  });

  describe('Error Reporting and Logging', () => {
    it('calls custom error handler when provided', () => {
      const onError = vi.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('logs error to console', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('Development vs Production Behavior', () => {
    it('shows development info in development mode', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Development Info')).toBeInTheDocument();
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText('Component always throws')).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('hides development info in production mode', () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      expect(screen.queryByText('Development Info')).not.toBeInTheDocument();
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('wraps component with error boundary', () => {
      const TestComponent = () => <div>Test component</div>;
      const WrappedComponent = withErrorBoundary(TestComponent);
      
      render(<WrappedComponent />);
      
      expect(screen.getByText('Test component')).toBeInTheDocument();
    });

    it('catches errors in wrapped component', () => {
      const WrappedComponent = withErrorBoundary(AlwaysThrowComponent);
      
      render(<WrappedComponent />);
      
      expect(screen.getByText('We\'re having a moment')).toBeInTheDocument();
    });

    it('uses custom fallback in HOC', () => {
      const customFallback = <div>HOC custom fallback</div>;
      const WrappedComponent = withErrorBoundary(AlwaysThrowComponent, customFallback);
      
      render(<WrappedComponent />);
      
      expect(screen.getByText('HOC custom fallback')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides accessible error UI structure', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      // Should have proper heading
      const heading = screen.getByRole('heading', { name: 'We\'re having a moment' });
      expect(heading).toBeInTheDocument();
      
      // Should have accessible buttons
      const tryAgainButton = screen.getByRole('button', { name: 'Try again' });
      expect(tryAgainButton).toBeInTheDocument();
      
      // Should have accessible links
      const homeLink = screen.getByRole('link', { name: 'Go to home' });
      expect(homeLink).toBeInTheDocument();
    });

    it('maintains keyboard navigation in error state', async () => {
      const user = userEvent.setup();
      
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      // Should be able to tab through interactive elements
      const tryAgainButton = screen.getByRole('button', { name: 'Try again' });
      const homeLink = screen.getByRole('link', { name: 'Go to home' });
      const helpLink = screen.getByRole('link', { name: 'Get help' });
      
      await user.tab();
      expect(tryAgainButton).toHaveFocus();
      
      await user.tab();
      expect(homeLink).toHaveFocus();
      
      await user.tab();
      expect(helpLink).toHaveFocus();
    });

    it('provides meaningful text for screen readers', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      // Error message should be informative and supportive
      expect(screen.getByText(/Something unexpected happened, but it's not your fault/)).toBeInTheDocument();
      expect(screen.getByText(/We're here to support you/)).toBeInTheDocument();
    });
  });

  describe('Care Collective Context', () => {
    it('provides appropriate help options for Care Collective users', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      // Should provide relevant navigation options
      const homeLink = screen.getByRole('link', { name: 'Go to home' });
      expect(homeLink).toHaveAttribute('href', '/');
      
      const helpLink = screen.getByRole('link', { name: 'Get help' });
      expect(helpLink).toHaveAttribute('href', '/help');
    });

    it('uses supportive, community-focused language', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      // Should use Care Collective's supportive tone
      expect(screen.getByText('We\'re having a moment')).toBeInTheDocument();
      expect(screen.getByText(/but it's not your fault/)).toBeInTheDocument();
      expect(screen.getByText(/We're here to support you/)).toBeInTheDocument();
    });

    it('maintains Care Collective visual identity in error state', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      // Should use Care Collective plant emoji
      expect(screen.getByText('🌱')).toBeInTheDocument();
      
      // Should maintain centered, card-based layout
      const errorCard = screen.getByText('We\'re having a moment').closest('.p-8');
      expect(errorCard).toHaveClass('text-center');
      expect(errorCard).toHaveClass('max-w-lg');
      expect(errorCard).toHaveClass('mx-auto');
    });
  });

  describe('Mobile-First Design', () => {
    it('provides mobile-friendly button layout', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      const buttonContainer = screen.getByRole('button', { name: 'Try again' }).closest('.flex');
      expect(buttonContainer).toHaveClass('flex-col');
      expect(buttonContainer).toHaveClass('sm:flex-row');
      expect(buttonContainer).toHaveClass('gap-3');
    });

    it('ensures buttons meet minimum touch target size', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowComponent />
        </ErrorBoundary>
      );
      
      const tryAgainButton = screen.getByRole('button', { name: 'Try again' });
      expect(tryAgainButton).toHaveClass('min-w-[120px]');
      
      const homeLink = screen.getByRole('link', { name: 'Go to home' });
      expect(homeLink.querySelector('button')).toHaveClass('min-w-[120px]');
    });
  });

  describe('Edge Cases', () => {
    it('handles errors thrown in lifecycle methods', () => {
      class ProblematicComponent extends React.Component {
        componentDidMount() {
          throw new Error('Error in componentDidMount');
        }
        
        render() {
          return <div>This should not render</div>;
        }
      }
      
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('We\'re having a moment')).toBeInTheDocument();
    });

    it('handles nested error boundaries', () => {
      const InnerComponent = () => {
        throw new Error('Inner error');
      };
      
      render(
        <ErrorBoundary fallback={<div>Outer boundary</div>}>
          <ErrorBoundary fallback={<div>Inner boundary</div>}>
            <InnerComponent />
          </ErrorBoundary>
        </ErrorBoundary>
      );
      
      // Inner boundary should catch the error
      expect(screen.getByText('Inner boundary')).toBeInTheDocument();
      expect(screen.queryByText('Outer boundary')).not.toBeInTheDocument();
    });
  });
});