import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import IconButton from './IconButton';
import { Bell, Plus, Search, X } from 'lucide-react';

describe('IconButton', () => {
  describe('Rendering', () => {
    it('renders with icon', () => {
      render(<IconButton icon={<Bell data-testid="bell-icon" />} aria-label="Notifications" />);
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    });

    it('renders with default size (md)', () => {
      render(<IconButton icon={<Bell />} aria-label="Notifications" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('icon-btn', 'icon-btn-md');
    });

    it('renders as disabled when disabled prop is true', () => {
      render(<IconButton icon={<Bell />} disabled aria-label="Notifications" />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Sizes', () => {
    it.each([
      ['xs', 'icon-btn-xs'],
      ['sm', 'icon-btn-sm'],
      ['md', 'icon-btn-md'],
      ['lg', 'icon-btn-lg'],
    ])('renders %s size with correct class', (size, expectedClass) => {
      render(<IconButton icon={<Bell />} size={size} aria-label="Notifications" />);
      expect(screen.getByRole('button')).toHaveClass(expectedClass);
    });
  });

  describe('Active State', () => {
    it('applies active class when active prop is true', () => {
      render(<IconButton icon={<Bell />} active aria-label="Notifications" />);
      expect(screen.getByRole('button')).toHaveClass('active');
    });

    it('does not apply active class when active prop is false', () => {
      render(<IconButton icon={<Bell />} active={false} aria-label="Notifications" />);
      expect(screen.getByRole('button')).not.toHaveClass('active');
    });
  });

  describe('Icon Rendering', () => {
    it('renders different icons correctly', () => {
      const { rerender } = render(
        <IconButton icon={<Bell data-testid="icon" />} aria-label="Notifications" />
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();

      rerender(<IconButton icon={<Plus data-testid="icon" />} aria-label="Add" />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();

      rerender(<IconButton icon={<Search data-testid="icon" />} aria-label="Search" />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <IconButton icon={<Bell />} onClick={handleClick} aria-label="Notifications" />
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <IconButton
          icon={<Bell />}
          onClick={handleClick}
          disabled
          aria-label="Notifications"
        />
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard interaction', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <IconButton icon={<Bell />} onClick={handleClick} aria-label="Notifications" />
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Custom Class Names', () => {
    it('applies additional className', () => {
      render(
        <IconButton
          icon={<Bell />}
          className="custom-class"
          aria-label="Notifications"
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('icon-btn', 'icon-btn-md', 'custom-class');
    });

    it('combines multiple classes correctly', () => {
      render(
        <IconButton
          icon={<Bell />}
          size="lg"
          active
          className="custom"
          aria-label="Notifications"
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('icon-btn', 'icon-btn-lg', 'active', 'custom');
    });
  });

  describe('Accessibility', () => {
    it('requires aria-label', () => {
      render(<IconButton icon={<Bell />} aria-label="Show notifications" />);
      expect(screen.getByRole('button')).toHaveAccessibleName('Show notifications');
    });

    it('has button role', () => {
      render(<IconButton icon={<Bell />} aria-label="Notifications" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('is keyboard focusable', () => {
      render(<IconButton icon={<Bell />} aria-label="Notifications" />);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('shows disabled state in accessibility tree', () => {
      render(<IconButton icon={<Bell />} disabled aria-label="Notifications" />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards additional props to button element', () => {
      render(
        <IconButton
          icon={<Bell />}
          data-testid="custom-icon-button"
          title="Notifications"
          aria-label="Show notifications"
        />
      );
      const button = screen.getByTestId('custom-icon-button');
      expect(button).toHaveAttribute('title', 'Notifications');
    });

    it('sets button type to button by default', () => {
      render(<IconButton icon={<Bell />} aria-label="Notifications" />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
  });

  describe('State Combinations', () => {
    it('renders all size and state combinations correctly', () => {
      const sizes = ['xs', 'sm', 'md', 'lg'];
      const states = [
        { active: false, disabled: false },
        { active: true, disabled: false },
        { active: false, disabled: true },
      ];

      sizes.forEach((size) => {
        states.forEach(({ active, disabled }) => {
          const { unmount } = render(
            <IconButton
              icon={<Bell />}
              size={size}
              active={active}
              disabled={disabled}
              aria-label="Notifications"
            />
          );
          const button = screen.getByRole('button');
          expect(button).toHaveClass(`icon-btn-${size}`);
          if (active) expect(button).toHaveClass('active');
          if (disabled) expect(button).toBeDisabled();
          unmount();
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing icon gracefully', () => {
      // Should not throw error
      render(<IconButton icon={null} aria-label="No icon" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles undefined size as default (md)', () => {
      render(<IconButton icon={<Bell />} size={undefined} aria-label="Notifications" />);
      expect(screen.getByRole('button')).toHaveClass('icon-btn-md');
    });
  });
});
