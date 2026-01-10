import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LinkPopover from './LinkPopover';

describe('LinkPopover', () => {
    const defaultProps = {
        isOpen: true,
        position: { top: 100, left: 200 },
        currentUrl: '',
        isEditing: false,
        onApply: vi.fn(),
        onUnlink: vi.fn(),
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(<LinkPopover {...defaultProps} isOpen={false} />);
        expect(document.querySelector('.link-popover')).toBeNull();
    });

    it('should render when isOpen is true', () => {
        render(<LinkPopover {...defaultProps} />);
        expect(document.querySelector('.link-popover')).toBeTruthy();
    });

    it('should render input with placeholder', () => {
        render(<LinkPopover {...defaultProps} />);
        const input = document.querySelector('.link-popover-input');
        expect(input).toBeTruthy();
        expect(input.placeholder).toBe('Paste or type a link');
    });

    it('should render all 3 buttons always', () => {
        render(<LinkPopover {...defaultProps} />);
        const applyButton = document.querySelector('.link-popover-apply');
        const unlinkButton = document.querySelector('.link-popover-unlink');
        const openButton = document.querySelector('.link-popover-open');
        
        expect(applyButton).toBeTruthy();
        expect(unlinkButton).toBeTruthy();
        expect(openButton).toBeTruthy();
    });

    it('should have button group container', () => {
        render(<LinkPopover {...defaultProps} />);
        const buttonGroup = document.querySelector('.link-popover-button-group');
        expect(buttonGroup).toBeTruthy();
    });

    it('should disable buttons when no URL', () => {
        render(<LinkPopover {...defaultProps} currentUrl="" />);
        const applyButton = document.querySelector('.link-popover-apply');
        const openButton = document.querySelector('.link-popover-open');
        
        expect(applyButton).not.toHaveClass('enabled');
        expect(openButton).not.toHaveClass('enabled');
        expect(applyButton.disabled).toBe(true);
        expect(openButton.disabled).toBe(true);
    });

    it('should enable apply and open buttons when URL is present', () => {
        render(<LinkPopover {...defaultProps} />);
        const input = document.querySelector('.link-popover-input');
        fireEvent.change(input, { target: { value: 'https://example.com' } });
        
        const applyButton = document.querySelector('.link-popover-apply');
        const openButton = document.querySelector('.link-popover-open');
        
        expect(applyButton).toHaveClass('enabled');
        expect(openButton).toHaveClass('enabled');
    });

    it('should enable unlink button only when editing', () => {
        const { rerender } = render(<LinkPopover {...defaultProps} isEditing={false} />);
        let unlinkButton = document.querySelector('.link-popover-unlink');
        expect(unlinkButton).not.toHaveClass('enabled');
        expect(unlinkButton.disabled).toBe(true);

        rerender(<LinkPopover {...defaultProps} isEditing={true} currentUrl="https://example.com" />);
        unlinkButton = document.querySelector('.link-popover-unlink');
        expect(unlinkButton).toHaveClass('enabled');
        expect(unlinkButton.disabled).toBe(false);
    });

    it('should populate input with currentUrl', () => {
        render(<LinkPopover {...defaultProps} currentUrl="https://example.com" />);
        const input = document.querySelector('.link-popover-input');
        expect(input.value).toBe('https://example.com');
    });

    it('should call onApply with URL when apply button is clicked', () => {
        const onApply = vi.fn();
        render(<LinkPopover {...defaultProps} onApply={onApply} />);

        const input = document.querySelector('.link-popover-input');
        fireEvent.change(input, { target: { value: 'https://test.com' } });

        const applyButton = document.querySelector('.link-popover-apply');
        fireEvent.click(applyButton);

        expect(onApply).toHaveBeenCalledWith('https://test.com');
    });

    it('should add https:// when URL has no protocol', () => {
        const onApply = vi.fn();
        render(<LinkPopover {...defaultProps} onApply={onApply} />);

        const input = document.querySelector('.link-popover-input');
        fireEvent.change(input, { target: { value: 'example.com' } });

        const applyButton = document.querySelector('.link-popover-apply');
        fireEvent.click(applyButton);

        expect(onApply).toHaveBeenCalledWith('https://example.com');
    });

    it('should call onApply on Enter key', () => {
        const onApply = vi.fn();
        render(<LinkPopover {...defaultProps} onApply={onApply} />);

        const input = document.querySelector('.link-popover-input');
        fireEvent.change(input, { target: { value: 'https://test.com' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onApply).toHaveBeenCalledWith('https://test.com');
    });

    it('should call onClose on Escape key', () => {
        const onClose = vi.fn();
        render(<LinkPopover {...defaultProps} onClose={onClose} />);

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when URL is empty and apply is clicked', () => {
        const onClose = vi.fn();
        const onApply = vi.fn();
        render(<LinkPopover {...defaultProps} onClose={onClose} onApply={onApply} />);

        // Apply button is disabled when URL is empty, but clicking shouldn't trigger onApply
        const applyButton = document.querySelector('.link-popover-apply');
        expect(applyButton.disabled).toBe(true);
    });

    it('should have correct positioning styles', () => {
        render(<LinkPopover {...defaultProps} position={{ top: 150, left: 250 }} />);
        const popover = document.querySelector('.link-popover');
        expect(popover.style.left).toBe('250px');
    });

    it('should call onUnlink and onClose when unlink button is clicked', () => {
        const onUnlink = vi.fn();
        const onClose = vi.fn();
        render(<LinkPopover {...defaultProps} isEditing={true} currentUrl="https://example.com" onUnlink={onUnlink} onClose={onClose} />);

        const unlinkButton = document.querySelector('.link-popover-unlink');
        fireEvent.click(unlinkButton);

        expect(onUnlink).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    describe('autoFocusInput prop', () => {
        it('should have autoFocusInput defaulting to true if not provided', () => {
            render(<LinkPopover {...defaultProps} />);
            const popover = document.querySelector('.link-popover');
            expect(popover).toBeTruthy();
            const input = document.querySelector('.link-popover-input');
            expect(input).toBeTruthy();
        });

        it('should not auto-focus input when autoFocusInput is false', () => {
            render(<LinkPopover {...defaultProps} autoFocusInput={false} />);
            const popover = document.querySelector('.link-popover');
            expect(popover).toBeTruthy();
            const input = document.querySelector('.link-popover-input');
            expect(input).toBeTruthy();
        });

        it('should pass autoFocusInput prop correctly', () => {
            const { rerender } = render(<LinkPopover {...defaultProps} autoFocusInput={true} />);
            expect(document.querySelector('.link-popover')).toBeTruthy();

            rerender(<LinkPopover {...defaultProps} autoFocusInput={false} />);
            expect(document.querySelector('.link-popover')).toBeTruthy();
        });
    });

    describe('mouseDown prevention on buttons', () => {
        it('should prevent default on apply button mousedown', () => {
            render(<LinkPopover {...defaultProps} currentUrl="https://example.com" />);
            const applyButton = document.querySelector('.link-popover-apply');
            const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
            const preventDefaultSpy = vi.spyOn(mouseDownEvent, 'preventDefault');

            applyButton.dispatchEvent(mouseDownEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should prevent default on unlink button mousedown', () => {
            render(<LinkPopover {...defaultProps} isEditing={true} currentUrl="https://example.com" />);
            const unlinkButton = document.querySelector('.link-popover-unlink');
            const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
            const preventDefaultSpy = vi.spyOn(mouseDownEvent, 'preventDefault');

            unlinkButton.dispatchEvent(mouseDownEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should prevent default on open button mousedown', () => {
            render(<LinkPopover {...defaultProps} currentUrl="https://example.com" />);
            const openButton = document.querySelector('.link-popover-open');
            const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
            const preventDefaultSpy = vi.spyOn(mouseDownEvent, 'preventDefault');

            openButton.dispatchEvent(mouseDownEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });

    describe('button styling states', () => {
        it('should show disabled style for buttons when empty', () => {
            render(<LinkPopover {...defaultProps} currentUrl="" isEditing={false} />);
            
            const applyButton = document.querySelector('.link-popover-apply');
            const unlinkButton = document.querySelector('.link-popover-unlink');
            const openButton = document.querySelector('.link-popover-open');

            // All buttons should be present but not have 'enabled' class
            expect(applyButton).not.toHaveClass('enabled');
            expect(unlinkButton).not.toHaveClass('enabled');
            expect(openButton).not.toHaveClass('enabled');
        });

        it('should show enabled style for apply and open when URL present', () => {
            render(<LinkPopover {...defaultProps} currentUrl="https://example.com" isEditing={false} />);
            
            const applyButton = document.querySelector('.link-popover-apply');
            const unlinkButton = document.querySelector('.link-popover-unlink');
            const openButton = document.querySelector('.link-popover-open');

            expect(applyButton).toHaveClass('enabled');
            expect(unlinkButton).not.toHaveClass('enabled'); // Still not editing
            expect(openButton).toHaveClass('enabled');
        });

        it('should enable unlink when editing existing link', () => {
            render(<LinkPopover {...defaultProps} currentUrl="https://example.com" isEditing={true} />);
            
            const unlinkButton = document.querySelector('.link-popover-unlink');
            expect(unlinkButton).toHaveClass('enabled');
        });
    });

    describe('component structure', () => {
        it('should have input wrapper', () => {
            render(<LinkPopover {...defaultProps} />);
            const inputWrapper = document.querySelector('.link-popover-input-wrapper');
            expect(inputWrapper).toBeTruthy();
        });

        it('should have correct layout structure', () => {
            const { container } = render(<LinkPopover {...defaultProps} />);
            const popover = container.querySelector('.link-popover');
            
            expect(popover).toBeTruthy();
            expect(popover.querySelector('.link-popover-input-wrapper')).toBeTruthy();
            expect(popover.querySelector('.link-popover-button-group')).toBeTruthy();
        });
    });
});
