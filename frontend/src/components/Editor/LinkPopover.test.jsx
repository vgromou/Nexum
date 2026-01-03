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
        formattingMenuHeight: 40,
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
        expect(input.placeholder).toBe('Paste or type a link...');
    });

    it('should render apply button', () => {
        render(<LinkPopover {...defaultProps} />);
        const applyButton = document.querySelector('.link-popover-apply');
        expect(applyButton).toBeTruthy();
    });

    it('should not render open button when not editing', () => {
        render(<LinkPopover {...defaultProps} isEditing={false} />);
        const openButton = document.querySelector('.link-popover-open');
        expect(openButton).toBeNull();
    });

    it('should render open button when editing and URL is present', () => {
        render(<LinkPopover {...defaultProps} isEditing={true} currentUrl="https://example.com" />);
        const openButton = document.querySelector('.link-popover-open');
        expect(openButton).toBeTruthy();
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

        const applyButton = document.querySelector('.link-popover-apply');
        fireEvent.click(applyButton);

        expect(onClose).toHaveBeenCalled();
        expect(onApply).not.toHaveBeenCalled();
    });

    it('should have correct positioning styles', () => {
        render(<LinkPopover {...defaultProps} position={{ top: 150, left: 250 }} />);
        const popover = document.querySelector('.link-popover');
        expect(popover.style.left).toBe('250px');
    });

    it('should not render unlink button when not editing', () => {
        render(<LinkPopover {...defaultProps} isEditing={false} />);
        const unlinkButton = document.querySelector('.link-popover-unlink');
        expect(unlinkButton).toBeNull();
    });

    it('should render unlink button when editing', () => {
        render(<LinkPopover {...defaultProps} isEditing={true} currentUrl="https://example.com" />);
        const unlinkButton = document.querySelector('.link-popover-unlink');
        expect(unlinkButton).toBeTruthy();
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
});
