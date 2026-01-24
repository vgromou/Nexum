import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Modal from './Modal';

describe('Modal', () => {
    beforeEach(() => {
        // Reset body overflow before each test
        document.body.style.overflow = '';
    });

    afterEach(() => {
        // Clean up body overflow after each test
        document.body.style.overflow = '';
    });

    describe('rendering', () => {
        it('does not render when isOpen is false', () => {
            render(<Modal isOpen={false} title="Test Modal" />);
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders when isOpen is true', () => {
            render(<Modal isOpen={true} title="Test Modal" />);
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('renders title', () => {
            render(<Modal isOpen={true} title="Test Title" />);
            expect(screen.getByText('Test Title')).toBeInTheDocument();
        });

        it('renders children in body', () => {
            render(
                <Modal isOpen={true} title="Test">
                    <p>Modal content</p>
                </Modal>
            );
            expect(screen.getByText('Modal content')).toBeInTheDocument();
        });

        it('renders footer', () => {
            render(
                <Modal
                    isOpen={true}
                    title="Test"
                    footer={<button>Submit</button>}
                />
            );
            expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
        });

        it('renders close button by default', () => {
            render(<Modal isOpen={true} title="Test" />);
            expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
        });

        it('hides close button when showCloseButton is false', () => {
            render(<Modal isOpen={true} title="Test" showCloseButton={false} />);
            expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
        });
    });

    describe('sizes', () => {
        it('applies sm size class', () => {
            render(<Modal isOpen={true} title="Test" size="sm" />);
            expect(screen.getByRole('dialog')).toHaveClass('modal--sm');
        });

        it('applies md size class by default', () => {
            render(<Modal isOpen={true} title="Test" />);
            expect(screen.getByRole('dialog')).toHaveClass('modal--md');
        });

        it('applies lg size class', () => {
            render(<Modal isOpen={true} title="Test" size="lg" />);
            expect(screen.getByRole('dialog')).toHaveClass('modal--lg');
        });
    });

    describe('interactions', () => {
        it('calls onClose when close button is clicked', () => {
            const handleClose = vi.fn();
            render(<Modal isOpen={true} title="Test" onClose={handleClose} />);

            fireEvent.click(screen.getByLabelText('Close modal'));
            expect(handleClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when Escape key is pressed', () => {
            const handleClose = vi.fn();
            render(<Modal isOpen={true} title="Test" onClose={handleClose} />);

            fireEvent.keyDown(document, { key: 'Escape' });
            expect(handleClose).toHaveBeenCalledTimes(1);
        });

        it('does not call onClose on Escape when closeOnEscape is false', () => {
            const handleClose = vi.fn();
            render(
                <Modal
                    isOpen={true}
                    title="Test"
                    onClose={handleClose}
                    closeOnEscape={false}
                />
            );

            fireEvent.keyDown(document, { key: 'Escape' });
            expect(handleClose).not.toHaveBeenCalled();
        });

        it('prevents body scroll when open', () => {
            render(<Modal isOpen={true} title="Test" />);
            expect(document.body.style.overflow).toBe('hidden');
        });

        it('restores body scroll when closed', () => {
            const { rerender } = render(<Modal isOpen={true} title="Test" />);
            expect(document.body.style.overflow).toBe('hidden');

            rerender(<Modal isOpen={false} title="Test" />);
            expect(document.body.style.overflow).toBe('');
        });
    });

    describe('accessibility', () => {
        it('has dialog role', () => {
            render(<Modal isOpen={true} title="Test" />);
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('has aria-modal attribute', () => {
            render(<Modal isOpen={true} title="Test" />);
            expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        });

        it('has aria-labelledby when title is provided', () => {
            render(<Modal isOpen={true} title="Test Title" />);
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
        });
    });

    describe('custom className', () => {
        it('applies custom className', () => {
            render(<Modal isOpen={true} title="Test" className="custom-modal" />);
            expect(screen.getByRole('dialog')).toHaveClass('modal', 'custom-modal');
        });
    });
});
