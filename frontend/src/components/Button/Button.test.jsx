import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import Button from './Button';
import { Plus, Check } from 'lucide-react';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with text content', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with default variant and size', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'btn-primary');
      expect(button).not.toHaveClass('btn-sm', 'btn-lg');
    });

    it('renders as disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Variants', () => {
    it.each([
      ['primary', 'btn-primary'],
      ['ghost', 'btn-ghost'],
      ['outline', 'btn-outline'],
      ['destructive', 'btn-destructive'],
      ['destructive-ghost', 'btn-destructive-ghost'],
      ['destructive-outline', 'btn-destructive-outline'],
      ['success', 'btn-success'],
      ['success-ghost', 'btn-success-ghost'],
      ['success-outline', 'btn-success-outline'],
    ])('renders %s variant with correct class', (variant, expectedClass) => {
      render(<Button variant={variant}>Button</Button>);
      expect(screen.getByRole('button')).toHaveClass(expectedClass);
    });
  });

  describe('Sizes', () => {
    it('renders small size with correct class', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-sm');
    });

    it('renders medium size (default) without size class', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn');
      expect(button).not.toHaveClass('btn-sm', 'btn-lg');
    });

    it('renders large size with correct class', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-lg');
    });
  });

  describe('Icon Positions', () => {
    it('renders without icon when iconPosition is none', () => {
      render(<Button iconPosition="none">Text Only</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('btn-icon-left', 'btn-icon-right', 'btn-icon-both', 'btn-icon');
    });

    it('renders with left icon', () => {
      render(
        <Button icon={<Plus data-testid="icon" />} iconPosition="left">
          Add Item
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-icon-left');
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(button).toHaveTextContent('Add Item');
    });

    it('renders with right icon', () => {
      render(
        <Button icon={<Check data-testid="icon" />} iconPosition="right">
          Confirm
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-icon-right');
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(button).toHaveTextContent('Confirm');
    });

    it('renders with both icons', () => {
      render(
        <Button icon={<Plus data-testid="icon" />} iconPosition="both">
          Action
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-icon-both');
      expect(screen.getAllByTestId('icon')).toHaveLength(2);
      expect(button).toHaveTextContent('Action');
    });

    it('renders icon-only button without text', () => {
      render(
        <Button icon={<Plus data-testid="icon" />} iconPosition="icon" aria-label="Add">
          Text
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-icon-icon');
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(button).not.toHaveTextContent('Text');
      expect(button).toHaveAccessibleName('Add');
    });
  });

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Button Type', () => {
    it('renders with default type="button"', () => {
      render(<Button>Default Type</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('renders with type="submit"', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('renders with type="reset"', () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });

  describe('Custom Class Names', () => {
    it('applies additional className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'btn-primary', 'custom-class');
    });

    it('combines multiple classes correctly', () => {
      render(
        <Button variant="ghost" size="lg" className="custom">
          Button
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'btn-ghost', 'btn-lg', 'custom');
    });
  });

  describe('Accessibility', () => {
    it('has button role', () => {
      render(<Button>Accessible Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('requires aria-label for icon-only buttons', () => {
      render(
        <Button icon={<Plus />} iconPosition="icon" aria-label="Add item">
          Hidden text
        </Button>
      );
      expect(screen.getByRole('button')).toHaveAccessibleName('Add item');
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard Accessible</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards additional props to button element', () => {
      render(
        <Button data-testid="custom-button" title="Tooltip text">
          Button
        </Button>
      );
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('title', 'Tooltip text');
    });
  });
});
