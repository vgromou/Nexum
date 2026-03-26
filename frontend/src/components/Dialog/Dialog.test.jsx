import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Bell, Lock, User } from 'lucide-react';
import Dialog from './Dialog';

describe('Dialog', () => {
    const mockOnClose = vi.fn();
    const mockOnTabChange = vi.fn();

    const defaultTabs = [
        { id: 'profile', icon: <User size={24} />, label: 'Profile' },
        { id: 'notifications', icon: <Bell size={24} />, label: 'Notifications' },
        { id: 'security', icon: <Lock size={24} />, label: 'Security' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.style.overflow = '';
    });

    afterEach(() => {
        document.body.style.overflow = '';
    });

    describe('Basic rendering', () => {
        it('renders nothing when isOpen is false', () => {
            render(
                <Dialog isOpen={false} onClose={mockOnClose} title="Test Dialog">
                    Content
                </Dialog>
            );
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders dialog when isOpen is true', () => {
            render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Test Dialog">
                    Content
                </Dialog>
            );
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('renders title in header', () => {
            render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Settings">
                    Content
                </Dialog>
            );
            expect(screen.getByText('Settings')).toBeInTheDocument();
        });

        it('renders children in body', () => {
            render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Test">
                    <div data-testid="content">Dialog content</div>
                </Dialog>
            );
            expect(screen.getByTestId('content')).toBeInTheDocument();
        });

        it('renders footer when provided', () => {
            render(
                <Dialog
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Test"
                    footer={<button>Save</button>}
                >
                    Content
                </Dialog>
            );
            expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        });

        it('does not render footer when not provided', () => {
            const { container } = render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Test">
                    Content
                </Dialog>
            );
            expect(container.querySelector('.dialog__footer')).not.toBeInTheDocument();
        });
    });

    describe('Tabs', () => {
        it('renders tabs when provided', () => {
            render(
                <Dialog
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Settings"
                    tabs={defaultTabs}
                    activeTab="profile"
                    onTabChange={mockOnTabChange}
                >
                    Content
                </Dialog>
            );
            expect(screen.getByRole('tablist')).toBeInTheDocument();
            expect(screen.getAllByRole('tab')).toHaveLength(3);
        });

        it('does not render tabs when not provided', () => {
            render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Settings">
                    Content
                </Dialog>
            );
            expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
        });

        it('marks active tab with aria-selected', () => {
            render(
                <Dialog
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Settings"
                    tabs={defaultTabs}
                    activeTab="notifications"
                    onTabChange={mockOnTabChange}
                >
                    Content
                </Dialog>
            );
            const tabs = screen.getAllByRole('tab');
            expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
            expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
            expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
        });

        it('calls onTabChange when tab is clicked', () => {
            render(
                <Dialog
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Settings"
                    tabs={defaultTabs}
                    activeTab="profile"
                    onTabChange={mockOnTabChange}
                >
                    Content
                </Dialog>
            );
            const tabs = screen.getAllByRole('tab');
            fireEvent.click(tabs[1]);
            expect(mockOnTabChange).toHaveBeenCalledWith('notifications');
        });

        it('disables tab when disabled is true', () => {
            const tabsWithDisabled = [
                ...defaultTabs.slice(0, 2),
                { ...defaultTabs[2], disabled: true },
            ];
            render(
                <Dialog
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Settings"
                    tabs={tabsWithDisabled}
                    activeTab="profile"
                    onTabChange={mockOnTabChange}
                >
                    Content
                </Dialog>
            );
            const tabs = screen.getAllByRole('tab');
            expect(tabs[2]).toBeDisabled();
        });
    });

    describe('Close behavior', () => {
        it('calls onClose when close button is clicked', () => {
            render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Test">
                    Content
                </Dialog>
            );
            fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when Escape is pressed', () => {
            render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Test">
                    Content
                </Dialog>
            );
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('does not call onClose when Escape is pressed and closeOnEscape is false', () => {
            render(
                <Dialog
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Test"
                    closeOnEscape={false}
                >
                    Content
                </Dialog>
            );
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('prevents body scroll when open', () => {
            render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Test">
                    Content
                </Dialog>
            );
            expect(document.body.style.overflow).toBe('hidden');
        });

        it('restores body scroll when closed', () => {
            const { rerender } = render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Test">
                    Content
                </Dialog>
            );
            expect(document.body.style.overflow).toBe('hidden');

            rerender(
                <Dialog isOpen={false} onClose={mockOnClose} title="Test">
                    Content
                </Dialog>
            );
            expect(document.body.style.overflow).toBe('');
        });
    });

    describe('Accessibility', () => {
        it('has role="dialog" and aria-modal="true"', () => {
            render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Test">
                    Content
                </Dialog>
            );
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
        });

        it('has aria-labelledby pointing to title', () => {
            render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Test Dialog">
                    Content
                </Dialog>
            );
            const dialog = screen.getByRole('dialog');
            const titleId = dialog.getAttribute('aria-labelledby');
            expect(titleId).toBeTruthy();
            expect(document.getElementById(titleId)).toHaveTextContent('Test Dialog');
        });

        it('close button has aria-label', () => {
            render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Test">
                    Content
                </Dialog>
            );
            expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
        });

        it('tabs have aria-label', () => {
            render(
                <Dialog
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Settings"
                    tabs={defaultTabs}
                    activeTab="profile"
                    onTabChange={mockOnTabChange}
                >
                    Content
                </Dialog>
            );
            expect(screen.getByRole('tab', { name: 'Profile' })).toBeInTheDocument();
            expect(screen.getByRole('tab', { name: 'Notifications' })).toBeInTheDocument();
            expect(screen.getByRole('tab', { name: 'Security' })).toBeInTheDocument();
        });
    });

    describe('Focus management', () => {
        it('focuses first focusable element when opened', async () => {
            render(
                <Dialog isOpen={true} onClose={mockOnClose} title="Test">
                    Content
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
            });
        });

        it('traps focus within dialog', async () => {
            render(
                <Dialog
                    isOpen={true}
                    onClose={mockOnClose}
                    title="Test"
                    footer={<button>Submit</button>}
                >
                    Content
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
            });

            // Tab from close button to submit button
            const submitButton = screen.getByRole('button', { name: 'Submit' });
            submitButton.focus();

            // Tab should wrap back to close button
            fireEvent.keyDown(document, { key: 'Tab' });
            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
            });
        });
    });
});
