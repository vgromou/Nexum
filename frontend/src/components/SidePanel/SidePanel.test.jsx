import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Bell, Settings, User } from 'lucide-react';
import SidePanel from './SidePanel';

describe('SidePanel', () => {
    const defaultProps = {
        isOpen: true,
        title: 'Panel Title',
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders when isOpen is true', () => {
        render(<SidePanel {...defaultProps} />);
        expect(screen.getByText('Panel Title')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(<SidePanel {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Panel Title')).not.toBeInTheDocument();
    });

    it('renders title in header', () => {
        render(<SidePanel {...defaultProps} />);
        expect(screen.getByRole('heading', { name: 'Panel Title' })).toBeInTheDocument();
    });

    it('renders children content', () => {
        render(
            <SidePanel {...defaultProps}>
                <p>Panel content</p>
            </SidePanel>
        );
        expect(screen.getByText('Panel content')).toBeInTheDocument();
    });

    it('renders footer when provided', () => {
        render(
            <SidePanel {...defaultProps} footer={<button>Save</button>} />
        );
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<SidePanel {...defaultProps} onClose={onClose} />);

        fireEvent.click(screen.getByLabelText('Close panel'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
        const onClose = vi.fn();
        render(<SidePanel {...defaultProps} onClose={onClose} />);

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose on Escape when closeOnEscape is false', () => {
        const onClose = vi.fn();
        render(<SidePanel {...defaultProps} onClose={onClose} closeOnEscape={false} />);

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).not.toHaveBeenCalled();
    });


    it('applies position class correctly', () => {
        const { rerender } = render(<SidePanel {...defaultProps} position="right" />);
        expect(document.querySelector('.side-panel-container--right')).toBeInTheDocument();

        rerender(<SidePanel {...defaultProps} position="left" />);
        expect(document.querySelector('.side-panel-container--left')).toBeInTheDocument();
    });

    it('renders close button on correct side based on position', () => {
        const { rerender } = render(<SidePanel {...defaultProps} position="right" />);
        let header = document.querySelector('.side-panel__header');
        let closeButton = screen.getByLabelText('Close panel');
        // For right position, close button should be first child
        expect(header.firstElementChild).toBe(closeButton);

        rerender(<SidePanel {...defaultProps} position="left" />);
        // Re-query after rerender
        header = document.querySelector('.side-panel__header');
        closeButton = screen.getByLabelText('Close panel');
        // For left position, close button should be last child
        expect(header.lastElementChild).toBe(closeButton);
    });

    it('hides close button when showCloseButton is false', () => {
        render(<SidePanel {...defaultProps} showCloseButton={false} />);
        expect(screen.queryByLabelText('Close panel')).not.toBeInTheDocument();
    });

    it('applies custom width within bounds', () => {
        render(<SidePanel {...defaultProps} width={700} />);
        const panel = screen.getByRole('dialog');
        expect(panel.style.width).toBe('700px');
    });

    it('clamps width to minimum 560', () => {
        render(<SidePanel {...defaultProps} width={400} />);
        const panel = screen.getByRole('dialog');
        expect(panel.style.width).toBe('560px');
    });

    it('clamps width to maximum 800', () => {
        render(<SidePanel {...defaultProps} width={1000} />);
        const panel = screen.getByRole('dialog');
        expect(panel.style.width).toBe('800px');
    });

    it('renders tabs when provided', () => {
        const tabs = [
            { id: 'tab1', icon: <Bell data-testid="bell-icon" />, label: 'Notifications' },
            { id: 'tab2', icon: <Settings data-testid="settings-icon" />, label: 'Settings' },
        ];

        render(<SidePanel {...defaultProps} tabs={tabs} activeTab="tab1" />);

        expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
        expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('marks active tab correctly', () => {
        const tabs = [
            { id: 'tab1', icon: <Bell />, label: 'Notifications' },
            { id: 'tab2', icon: <Settings />, label: 'Settings' },
        ];

        render(<SidePanel {...defaultProps} tabs={tabs} activeTab="tab1" />);

        const tabButtons = document.querySelectorAll('.side-panel__tab');
        expect(tabButtons[0]).toHaveClass('side-panel__tab--active');
        expect(tabButtons[1]).not.toHaveClass('side-panel__tab--active');
    });

    it('calls onTabChange when tab is clicked', () => {
        const onTabChange = vi.fn();
        const tabs = [
            { id: 'tab1', icon: <Bell />, label: 'Notifications' },
            { id: 'tab2', icon: <Settings />, label: 'Settings' },
        ];

        render(
            <SidePanel
                {...defaultProps}
                tabs={tabs}
                activeTab="tab1"
                onTabChange={onTabChange}
            />
        );

        const tabButtons = document.querySelectorAll('.side-panel__tab');
        fireEvent.click(tabButtons[1]);
        expect(onTabChange).toHaveBeenCalledWith('tab2');
    });

    it('does not call onTabChange for disabled tab', () => {
        const onTabChange = vi.fn();
        const tabs = [
            { id: 'tab1', icon: <Bell />, label: 'Notifications' },
            { id: 'tab2', icon: <Settings />, label: 'Settings', disabled: true },
        ];

        render(
            <SidePanel
                {...defaultProps}
                tabs={tabs}
                activeTab="tab1"
                onTabChange={onTabChange}
            />
        );

        const tabButtons = document.querySelectorAll('.side-panel__tab');
        fireEvent.click(tabButtons[1]);
        expect(onTabChange).not.toHaveBeenCalled();
    });

    it('applies disabled class to disabled tab', () => {
        const tabs = [
            { id: 'tab1', icon: <Bell />, label: 'Notifications' },
            { id: 'tab2', icon: <Settings />, label: 'Settings', disabled: true },
        ];

        render(<SidePanel {...defaultProps} tabs={tabs} activeTab="tab1" />);

        const tabButtons = document.querySelectorAll('.side-panel__tab');
        expect(tabButtons[1]).toHaveClass('side-panel__tab--disabled');
        expect(tabButtons[1]).toBeDisabled();
    });

    it('has proper accessibility attributes', () => {
        render(<SidePanel {...defaultProps} />);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'side-panel-title');
    });

    it('applies active class after animation delay', async () => {
        render(<SidePanel {...defaultProps} />);

        await waitFor(() => {
            expect(document.querySelector('.side-panel-container--active')).toBeInTheDocument();
        });
    });


    it('applies additional className', () => {
        render(<SidePanel {...defaultProps} className="custom-class" />);
        expect(screen.getByRole('dialog')).toHaveClass('custom-class');
    });

    it('renders tabs with aria-label from tab label', () => {
        const tabs = [
            { id: 'tab1', icon: <Bell />, label: 'Notifications' },
        ];

        render(<SidePanel {...defaultProps} tabs={tabs} />);

        const tabButton = document.querySelector('.side-panel__tab');
        expect(tabButton).toHaveAttribute('aria-label', 'Notifications');
        expect(tabButton).toHaveAttribute('title', 'Notifications');
    });

    it('renders without title', () => {
        render(<SidePanel isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders without footer', () => {
        render(<SidePanel {...defaultProps} />);
        expect(document.querySelector('.side-panel__footer')).not.toBeInTheDocument();
    });

    it('uses default position right', () => {
        render(<SidePanel {...defaultProps} />);
        expect(document.querySelector('.side-panel-container--right')).toBeInTheDocument();
    });

    it('uses default width 560', () => {
        render(<SidePanel {...defaultProps} />);
        const panel = screen.getByRole('dialog');
        expect(panel.style.width).toBe('560px');
    });

    it('uses index as tab id when id not provided', () => {
        const onTabChange = vi.fn();
        const tabs = [
            { icon: <Bell />, label: 'Tab 1' },
            { icon: <Settings />, label: 'Tab 2' },
        ];

        render(
            <SidePanel
                {...defaultProps}
                tabs={tabs}
                activeTab={0}
                onTabChange={onTabChange}
            />
        );

        const tabButtons = document.querySelectorAll('.side-panel__tab');
        expect(tabButtons[0]).toHaveClass('side-panel__tab--active');

        fireEvent.click(tabButtons[1]);
        expect(onTabChange).toHaveBeenCalledWith(1);
    });

    it('switches active tab correctly', () => {
        const tabs = [
            { id: 'tab1', icon: <Bell />, label: 'Tab 1' },
            { id: 'tab2', icon: <Settings />, label: 'Tab 2' },
        ];

        const { rerender } = render(
            <SidePanel {...defaultProps} tabs={tabs} activeTab="tab1" />
        );

        let tabButtons = document.querySelectorAll('.side-panel__tab');
        expect(tabButtons[0]).toHaveClass('side-panel__tab--active');
        expect(tabButtons[1]).not.toHaveClass('side-panel__tab--active');

        rerender(<SidePanel {...defaultProps} tabs={tabs} activeTab="tab2" />);

        tabButtons = document.querySelectorAll('.side-panel__tab');
        expect(tabButtons[0]).not.toHaveClass('side-panel__tab--active');
        expect(tabButtons[1]).toHaveClass('side-panel__tab--active');
    });

    it('cleans up event listeners on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

        const { unmount } = render(<SidePanel {...defaultProps} />);
        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

        removeEventListenerSpy.mockRestore();
    });

    it('focuses panel when opened', async () => {
        render(<SidePanel {...defaultProps} />);

        await waitFor(() => {
            expect(document.activeElement).toBe(screen.getByRole('dialog'));
        });
    });

    it('removes visibility after animation when closed', async () => {
        const { rerender } = render(<SidePanel {...defaultProps} isOpen={true} />);

        await waitFor(() => {
            expect(document.querySelector('.side-panel-container--active')).toBeInTheDocument();
        });

        rerender(<SidePanel {...defaultProps} isOpen={false} />);

        // Active class removed immediately
        expect(document.querySelector('.side-panel-container--active')).not.toBeInTheDocument();

        // Element should be removed after animation (300ms)
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        }, { timeout: 400 });
    });

    it('does not render tabs container when tabs array is empty', () => {
        render(<SidePanel {...defaultProps} tabs={[]} />);
        expect(document.querySelector('.side-panel__tabs')).not.toBeInTheDocument();
    });

    it('does not render tabs container when tabs is undefined', () => {
        render(<SidePanel {...defaultProps} />);
        expect(document.querySelector('.side-panel__tabs')).not.toBeInTheDocument();
    });

    it('renders multiple tabs correctly', () => {
        const tabs = [
            { id: 'tab1', icon: <Bell data-testid="icon-1" />, label: 'Tab 1' },
            { id: 'tab2', icon: <Settings data-testid="icon-2" />, label: 'Tab 2' },
            { id: 'tab3', icon: <User data-testid="icon-3" />, label: 'Tab 3' },
        ];

        render(<SidePanel {...defaultProps} tabs={tabs} activeTab="tab2" />);

        const tabButtons = document.querySelectorAll('.side-panel__tab');
        expect(tabButtons).toHaveLength(3);
        expect(tabButtons[1]).toHaveClass('side-panel__tab--active');
    });

    it('does not set aria-labelledby when no title', () => {
        render(<SidePanel isOpen={true} onClose={vi.fn()} />);
        const dialog = screen.getByRole('dialog');
        expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    it('allows clicking active tab without error', () => {
        const onTabChange = vi.fn();
        const tabs = [
            { id: 'tab1', icon: <Bell />, label: 'Tab 1' },
        ];

        render(
            <SidePanel
                {...defaultProps}
                tabs={tabs}
                activeTab="tab1"
                onTabChange={onTabChange}
            />
        );

        const tabButton = document.querySelector('.side-panel__tab');
        fireEvent.click(tabButton);
        expect(onTabChange).toHaveBeenCalledWith('tab1');
    });

    it('handles other key presses without closing', () => {
        const onClose = vi.fn();
        render(<SidePanel {...defaultProps} onClose={onClose} />);

        fireEvent.keyDown(document, { key: 'Enter' });
        fireEvent.keyDown(document, { key: 'Tab' });
        fireEvent.keyDown(document, { key: 'a' });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders content area', () => {
        render(
            <SidePanel {...defaultProps}>
                <div data-testid="content">Content here</div>
            </SidePanel>
        );

        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(document.querySelector('.side-panel__content')).toContainElement(
            screen.getByTestId('content')
        );
    });

    it('renders footer with multiple buttons', () => {
        render(
            <SidePanel
                {...defaultProps}
                footer={
                    <>
                        <button>Cancel</button>
                        <button>Save</button>
                    </>
                }
            />
        );

        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(document.querySelector('.side-panel__footer')).toBeInTheDocument();
    });
});
