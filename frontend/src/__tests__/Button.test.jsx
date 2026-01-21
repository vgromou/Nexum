import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Bell, Plus, X, Check } from 'lucide-react';

describe('Button Sizes', () => {
  it('should render small button with correct height', () => {
    const { container } = render(
      <button className="btn btn-primary btn-sm">Small Button</button>
    );
    const button = container.querySelector('.btn-sm');
    const styles = window.getComputedStyle(button);
    expect(styles.height).toBe('26px');
  });

  it('should render medium button with correct height', () => {
    const { container } = render(
      <button className="btn btn-primary">Medium Button</button>
    );
    const button = container.querySelector('.btn');
    const styles = window.getComputedStyle(button);
    expect(styles.height).toBe('36px');
  });

  it('should render large button with correct height', () => {
    const { container } = render(
      <button className="btn btn-primary btn-lg">Large Button</button>
    );
    const button = container.querySelector('.btn-lg');
    const styles = window.getComputedStyle(button);
    expect(styles.height).toBe('40px');
  });
});

describe('Icon Sizes', () => {
  it('should render small button icons at 16x16', () => {
    const { container } = render(
      <button className="btn btn-primary btn-sm btn-icon" aria-label="Notifications">
        <Bell />
      </button>
    );
    const svg = container.querySelector('svg');
    const styles = window.getComputedStyle(svg);
    expect(styles.width).toBe('16px');
    expect(styles.height).toBe('16px');
  });

  it('should render medium button icons at 18x18', () => {
    const { container } = render(
      <button className="btn btn-primary btn-icon" aria-label="Notifications">
        <Bell />
      </button>
    );
    const svg = container.querySelector('svg');
    const styles = window.getComputedStyle(svg);
    expect(styles.width).toBe('18px');
    expect(styles.height).toBe('18px');
  });

  it('should render large button icons at 20x20', () => {
    const { container } = render(
      <button className="btn btn-primary btn-lg btn-icon" aria-label="Notifications">
        <Bell />
      </button>
    );
    const svg = container.querySelector('svg');
    const styles = window.getComputedStyle(svg);
    expect(styles.width).toBe('20px');
    expect(styles.height).toBe('20px');
  });
});

describe('Button Accessibility', () => {
  it('should have aria-label for icon-only buttons', () => {
    render(
      <button className="btn btn-primary btn-icon" aria-label="Notifications">
        <Bell />
      </button>
    );
    const button = screen.getByRole('button', { name: 'Notifications' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAccessibleName('Notifications');
  });

  it('should not require aria-label for buttons with text', () => {
    render(
      <button className="btn btn-primary">
        Click Me
      </button>
    );
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAccessibleName('Click Me');
  });

  it('should have aria-label for different icon-only button variants', () => {
    const { container } = render(
      <div>
        <button className="btn btn-primary btn-icon" aria-label="Add">
          <Plus />
        </button>
        <button className="btn btn-destructive btn-icon" aria-label="Delete">
          <X />
        </button>
        <button className="btn btn-success btn-icon" aria-label="Confirm">
          <Check />
        </button>
      </div>
    );

    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('should be keyboard accessible', () => {
    const handleClick = jest.fn();
    render(
      <button className="btn btn-primary" onClick={handleClick}>
        Clickable Button
      </button>
    );
    const button = screen.getByRole('button', { name: 'Clickable Button' });

    button.focus();
    expect(button).toHaveFocus();
  });

  it('should respect disabled state', () => {
    const handleClick = jest.fn();
    render(
      <button className="btn btn-primary" disabled onClick={handleClick}>
        Disabled Button
      </button>
    );
    const button = screen.getByRole('button', { name: 'Disabled Button' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('disabled');
  });
});

describe('Icon Button Accessibility', () => {
  it('should have aria-label for icon-btn elements', () => {
    render(
      <button className="icon-btn icon-btn-md" aria-label="Notifications">
        <Bell />
      </button>
    );
    const button = screen.getByRole('button', { name: 'Notifications' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAccessibleName('Notifications');
  });

  it('should render icon-btn sizes correctly', () => {
    const { container } = render(
      <div>
        <button className="icon-btn icon-btn-xs" aria-label="Extra Small">
          <Bell />
        </button>
        <button className="icon-btn icon-btn-sm" aria-label="Small">
          <Bell />
        </button>
        <button className="icon-btn icon-btn-md" aria-label="Medium">
          <Bell />
        </button>
        <button className="icon-btn icon-btn-lg" aria-label="Large">
          <Bell />
        </button>
      </div>
    );

    expect(screen.getByRole('button', { name: 'Extra Small' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument();
  });
});

describe('Button States', () => {
  it('should apply correct classes for different states', () => {
    const { container } = render(
      <div>
        <button className="btn btn-primary">Default</button>
        <button className="btn btn-primary" disabled>Disabled</button>
      </div>
    );

    const buttons = container.querySelectorAll('.btn-primary');
    expect(buttons).toHaveLength(2);
    expect(buttons[1]).toBeDisabled();
  });

  it('should support full width variant', () => {
    const { container } = render(
      <button className="btn btn-primary btn-full">Full Width</button>
    );
    const button = container.querySelector('.btn-full');
    const styles = window.getComputedStyle(button);
    expect(styles.width).toBe('100%');
  });
});
