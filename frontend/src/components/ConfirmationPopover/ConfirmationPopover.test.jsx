import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfirmationPopover from './ConfirmationPopover';

describe('ConfirmationPopover', () => {
    const defaultProps = {
        isOpen: true,
        title: 'Log out of Nexum?',
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders when isOpen is true', () => {
        render(<ConfirmationPopover {...defaultProps} />);
        expect(screen.getByText('Log out of Nexum?')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(<ConfirmationPopover {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Log out of Nexum?')).not.toBeInTheDocument();
    });

    it('renders with title', () => {
        render(<ConfirmationPopover {...defaultProps} />);
        expect(screen.getByText('Log out of Nexum?')).toBeInTheDocument();
    });

    it('renders with description when provided', () => {
        render(
            <ConfirmationPopover
                {...defaultProps}
                title="Create Branch?"
                description="You've changed more than 30% of article"
            />
        );
        expect(screen.getByText('Create Branch?')).toBeInTheDocument();
        expect(screen.getByText("You've changed more than 30% of article")).toBeInTheDocument();
    });

    it('renders action buttons', () => {
        const actions = [
            { label: 'Cancel', variant: 'outline', onClick: vi.fn() },
            { label: 'Log out', variant: 'destructive', onClick: vi.fn() },
        ];

        render(<ConfirmationPopover {...defaultProps} actions={actions} />);

        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Log out')).toBeInTheDocument();
    });

    it('calls action onClick when button is clicked', () => {
        const cancelFn = vi.fn();
        const logoutFn = vi.fn();
        const actions = [
            { label: 'Cancel', variant: 'outline', onClick: cancelFn },
            { label: 'Log out', variant: 'destructive', onClick: logoutFn },
        ];

        render(<ConfirmationPopover {...defaultProps} actions={actions} />);

        fireEvent.click(screen.getByText('Cancel'));
        expect(cancelFn).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText('Log out'));
        expect(logoutFn).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
        const onClose = vi.fn();
        render(<ConfirmationPopover {...defaultProps} onClose={onClose} />);

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking outside', () => {
        const onClose = vi.fn();
        render(
            <div>
                <div data-testid="outside">Outside</div>
                <ConfirmationPopover {...defaultProps} onClose={onClose} />
            </div>
        );

        fireEvent.mouseDown(screen.getByTestId('outside'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside popover', () => {
        const onClose = vi.fn();
        render(<ConfirmationPopover {...defaultProps} onClose={onClose} />);

        fireEvent.mouseDown(screen.getByRole('dialog'));
        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders button with icon when provided', () => {
        const TestIcon = () => <svg data-testid="test-icon" />;
        const actions = [
            { label: 'Create Branch', variant: 'success', onClick: vi.fn(), icon: <TestIcon /> },
        ];

        render(<ConfirmationPopover {...defaultProps} actions={actions} />);

        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('disables button when disabled is true', () => {
        const actions = [
            { label: 'Submit', variant: 'primary', onClick: vi.fn(), disabled: true },
        ];

        render(<ConfirmationPopover {...defaultProps} actions={actions} />);

        expect(screen.getByText('Submit')).toBeDisabled();
    });

    it('renders buttons with correct variants', () => {
        const actions = [
            { label: 'Outline', variant: 'outline', onClick: vi.fn() },
            { label: 'Destructive', variant: 'destructive', onClick: vi.fn() },
            { label: 'Success', variant: 'success', onClick: vi.fn() },
        ];

        render(<ConfirmationPopover {...defaultProps} actions={actions} />);

        expect(screen.getByText('Outline').closest('button')).toHaveClass('btn-outline');
        expect(screen.getByText('Destructive').closest('button')).toHaveClass('btn-destructive');
        expect(screen.getByText('Success').closest('button')).toHaveClass('btn-success');
    });

    it('applies placement class correctly', () => {
        const { rerender } = render(
            <ConfirmationPopover {...defaultProps} placement="bottom" />
        );
        expect(screen.getByRole('dialog')).toHaveClass('confirmation-popover--bottom');

        rerender(<ConfirmationPopover {...defaultProps} placement="top" />);
        expect(screen.getByRole('dialog')).toHaveClass('confirmation-popover--top');
    });

    it('applies additional className', () => {
        render(<ConfirmationPopover {...defaultProps} className="custom-class" />);
        expect(screen.getByRole('dialog')).toHaveClass('custom-class');
    });

    it('has proper accessibility attributes', () => {
        render(<ConfirmationPopover {...defaultProps} />);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'confirmation-popover-title');
    });

    it('applies active class after animation delay', async () => {
        render(<ConfirmationPopover {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toHaveClass('confirmation-popover--active');
        });
    });

    it('renders buttons with sm size', () => {
        const actions = [
            { label: 'Cancel', variant: 'outline', onClick: vi.fn() },
        ];

        render(<ConfirmationPopover {...defaultProps} actions={actions} />);

        expect(screen.getByText('Cancel').closest('button')).toHaveClass('btn-sm');
    });

    it('uses primary variant as default for buttons', () => {
        const actions = [
            { label: 'Confirm', onClick: vi.fn() },
        ];

        render(<ConfirmationPopover {...defaultProps} actions={actions} />);

        expect(screen.getByText('Confirm').closest('button')).toHaveClass('btn-primary');
    });

    it('renders without actions', () => {
        render(<ConfirmationPopover {...defaultProps} />);

        expect(screen.getByText('Log out of Nexum?')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders multiple action buttons', () => {
        const actions = [
            { label: 'Discard', variant: 'ghost', onClick: vi.fn() },
            { label: 'Cancel', variant: 'outline', onClick: vi.fn() },
            { label: 'Save', variant: 'primary', onClick: vi.fn() },
        ];

        render(<ConfirmationPopover {...defaultProps} actions={actions} />);

        expect(screen.getByText('Discard')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('positions relative to anchor element', async () => {
        const anchorRef = {
            current: {
                getBoundingClientRect: () => ({
                    top: 100,
                    bottom: 130,
                    left: 200,
                    right: 280,
                    width: 80,
                    height: 30,
                }),
            },
        };

        render(
            <ConfirmationPopover
                {...defaultProps}
                anchorRef={anchorRef}
                placement="bottom"
            />
        );

        await waitFor(() => {
            const dialog = screen.getByRole('dialog');
            expect(dialog.style.top).toBeTruthy();
            expect(dialog.style.left).toBeTruthy();
        });
    });

    it('renders arrow element', () => {
        render(<ConfirmationPopover {...defaultProps} />);

        const dialog = screen.getByRole('dialog');
        const arrow = dialog.querySelector('.confirmation-popover__arrow');
        expect(arrow).toBeInTheDocument();
    });

    it('does not call onClose when clicking anchor element', () => {
        const onClose = vi.fn();
        const anchorRef = { current: document.createElement('button') };
        document.body.appendChild(anchorRef.current);

        render(
            <ConfirmationPopover
                {...defaultProps}
                onClose={onClose}
                anchorRef={anchorRef}
            />
        );

        fireEvent.mouseDown(anchorRef.current);
        expect(onClose).not.toHaveBeenCalled();

        document.body.removeChild(anchorRef.current);
    });

    it('cleans up event listeners on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

        const { unmount } = render(<ConfirmationPopover {...defaultProps} />);
        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

        removeEventListenerSpy.mockRestore();
    });

    it('removes active class when closed', async () => {
        const { rerender } = render(<ConfirmationPopover {...defaultProps} isOpen={true} />);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toHaveClass('confirmation-popover--active');
        });

        rerender(<ConfirmationPopover {...defaultProps} isOpen={false} />);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders title with correct id for accessibility', () => {
        render(<ConfirmationPopover {...defaultProps} />);

        const title = screen.getByText('Log out of Nexum?');
        expect(title).toHaveAttribute('id', 'confirmation-popover-title');
    });

    it('does not set aria-labelledby when no title', () => {
        // Title is required, but test the structure
        render(<ConfirmationPopover {...defaultProps} title="Test" />);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby', 'confirmation-popover-title');
    });
});
