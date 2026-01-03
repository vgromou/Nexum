import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FormattingMenu from './FormattingMenu';

describe('FormattingMenu', () => {
    const defaultProps = {
        position: { top: 100, left: 200 },
        currentBlockType: 'paragraph',
        activeSubmenu: null,
        onToggleSubmenu: vi.fn(),
        onFormat: vi.fn(),
        onHighlight: vi.fn(),
        onClearHighlight: vi.fn(),
        onOpenLinkPopover: vi.fn(),
        onRemoveLink: vi.fn(),
        onChangeBlockType: vi.fn(),
        onClose: vi.fn(),
    };

    it('should render the formatting menu', () => {
        render(<FormattingMenu {...defaultProps} />);
        expect(document.querySelector('.formatting-menu')).toBeTruthy();
    });

    it('should render all formatting buttons', () => {
        render(<FormattingMenu {...defaultProps} />);

        // Check for button titles
        expect(document.querySelector('[title="Bold (⌘B)"]')).toBeTruthy();
        expect(document.querySelector('[title="Italic (⌘I)"]')).toBeTruthy();
        expect(document.querySelector('[title="Underline (⌘U)"]')).toBeTruthy();
        expect(document.querySelector('[title="Strikethrough"]')).toBeTruthy();
        expect(document.querySelector('[title="Insert link (⌘K)"]')).toBeTruthy();
        expect(document.querySelector('[title="Remove link"]')).toBeTruthy();
    });

    it('should display current block type label in Turn Into button', () => {
        render(<FormattingMenu {...defaultProps} currentBlockType="paragraph" />);
        expect(screen.getByText('Text')).toBeTruthy();
    });

    it('should display correct block type label for h1', () => {
        render(<FormattingMenu {...defaultProps} currentBlockType="h1" />);
        expect(screen.getByText('Heading 1')).toBeTruthy();
    });

    it('should call onFormat when bold button is clicked', () => {
        const onFormat = vi.fn();
        render(<FormattingMenu {...defaultProps} onFormat={onFormat} />);

        const boldButton = document.querySelector('[title="Bold (⌘B)"]');
        fireEvent.click(boldButton);

        expect(onFormat).toHaveBeenCalledWith('bold');
    });

    it('should call onFormat when italic button is clicked', () => {
        const onFormat = vi.fn();
        render(<FormattingMenu {...defaultProps} onFormat={onFormat} />);

        const italicButton = document.querySelector('[title="Italic (⌘I)"]');
        fireEvent.click(italicButton);

        expect(onFormat).toHaveBeenCalledWith('italic');
    });

    it('should show Turn Into popup when activeSubmenu is turnInto', () => {
        render(<FormattingMenu {...defaultProps} activeSubmenu="turnInto" />);
        expect(document.querySelector('.turn-into-popup')).toBeTruthy();
        expect(screen.getByText('Turn into')).toBeTruthy();
    });

    it('should show Highlight popup when activeSubmenu is highlight', () => {
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
        expect(document.querySelector('.highlight-popup')).toBeTruthy();
    });

    it('should render four rows of color swatches in highlight popup (2 sections × 2 rows)', () => {
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);

        const colorRows = document.querySelectorAll('.color-row');
        expect(colorRows.length).toBe(4);
    });

    it('should render letter A in color swatches', () => {
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);

        const letters = document.querySelectorAll('.swatch-letter');
        expect(letters.length).toBeGreaterThan(0);
        letters.forEach(letter => {
            expect(letter.textContent).toBe('A');
        });
    });

    it('should mark current block type as active in Turn Into popup', () => {
        render(<FormattingMenu {...defaultProps} activeSubmenu="turnInto" currentBlockType="h2" />);

        const activeItem = document.querySelector('.popup-item.active');
        expect(activeItem).toBeTruthy();
        expect(activeItem.textContent).toContain('Heading 2');
    });

    it('should call onChangeBlockType when Turn Into item is clicked', () => {
        const onChangeBlockType = vi.fn();
        render(<FormattingMenu {...defaultProps} activeSubmenu="turnInto" onChangeBlockType={onChangeBlockType} />);

        const items = document.querySelectorAll('.popup-item');
        fireEvent.click(items[1]); // Click on "Heading 1"

        expect(onChangeBlockType).toHaveBeenCalledWith('h1');
    });

    it('should render highlight and tag color swatches', () => {
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);

        // Check for highlight swatches
        expect(document.querySelector('.highlight-swatch-purple')).toBeTruthy();
        expect(document.querySelector('.highlight-swatch-blue')).toBeTruthy();
        expect(document.querySelector('.highlight-swatch-green')).toBeTruthy();

        // Check for tag swatches
        expect(document.querySelector('.tag-swatch-purple')).toBeTruthy();
        expect(document.querySelector('.tag-swatch-blue')).toBeTruthy();
    });

    it('should call onHighlight when highlight swatch is clicked', () => {
        const onHighlight = vi.fn();
        const onToggleSubmenu = vi.fn();
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" onHighlight={onHighlight} onToggleSubmenu={onToggleSubmenu} />);

        const purpleSwatch = document.querySelector('.highlight-swatch-purple');
        fireEvent.click(purpleSwatch);

        expect(onHighlight).toHaveBeenCalledWith('purple', false);
        expect(onToggleSubmenu).toHaveBeenCalledWith(null); // Closes popup
    });

    it('should call onHighlight with isTag=true when tag swatch is clicked', () => {
        const onHighlight = vi.fn();
        const onToggleSubmenu = vi.fn();
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" onHighlight={onHighlight} onToggleSubmenu={onToggleSubmenu} />);

        const tagSwatch = document.querySelector('.tag-swatch-purple');
        fireEvent.click(tagSwatch);

        expect(onHighlight).toHaveBeenCalledWith('purple', true);
        expect(onToggleSubmenu).toHaveBeenCalledWith(null); // Closes popup
    });

    it('should call onClearHighlight when clear button is clicked', () => {
        const onClearHighlight = vi.fn();
        const onToggleSubmenu = vi.fn();
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" onClearHighlight={onClearHighlight} onToggleSubmenu={onToggleSubmenu} />);

        const clearButton = document.querySelector('.clear-formatting-button');
        fireEvent.click(clearButton);

        expect(onClearHighlight).toHaveBeenCalledWith(null);
        expect(onToggleSubmenu).toHaveBeenCalledWith(null); // Closes popup
    });

    it('should call onOpenLinkPopover when link button is clicked', () => {
        const onOpenLinkPopover = vi.fn();
        render(<FormattingMenu {...defaultProps} onOpenLinkPopover={onOpenLinkPopover} />);

        const linkButton = document.querySelector('[title="Insert link (⌘K)"]');
        fireEvent.click(linkButton);

        expect(onOpenLinkPopover).toHaveBeenCalled();
    });

    it('should call onRemoveLink when unlink button is clicked and link is active', () => {
        const onRemoveLink = vi.fn();
        render(<FormattingMenu {...defaultProps} activeFormats={{ link: true }} onRemoveLink={onRemoveLink} />);

        const unlinkButton = document.querySelector('[title="Remove link"]');
        fireEvent.click(unlinkButton);

        expect(onRemoveLink).toHaveBeenCalled();
    });

    it('should call onToggleSubmenu when Turn Into button is clicked', () => {
        const onToggleSubmenu = vi.fn();
        render(<FormattingMenu {...defaultProps} onToggleSubmenu={onToggleSubmenu} />);

        const turnIntoButton = document.querySelector('.turn-into-button');
        fireEvent.click(turnIntoButton);

        expect(onToggleSubmenu).toHaveBeenCalledWith('turnInto');
    });

    it('should call onToggleSubmenu when Highlight button is clicked', () => {
        const onToggleSubmenu = vi.fn();
        render(<FormattingMenu {...defaultProps} onToggleSubmenu={onToggleSubmenu} />);

        const highlightButton = document.querySelector('[title="Highlight"]');
        fireEvent.click(highlightButton);

        expect(onToggleSubmenu).toHaveBeenCalledWith('highlight');
    });

    describe('Active Format States', () => {
        it('should apply active class to bold button when bold is active', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ bold: true }} />);
            const boldButton = document.querySelector('[title="Bold (⌘B)"]');
            expect(boldButton.className).toContain('active');
        });

        it('should apply active class to italic button when italic is active', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ italic: true }} />);
            const italicButton = document.querySelector('[title="Italic (⌘I)"]');
            expect(italicButton.className).toContain('active');
        });

        it('should apply active class to underline button when underline is active', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ underline: true }} />);
            const underlineButton = document.querySelector('[title="Underline (⌘U)"]');
            expect(underlineButton.className).toContain('active');
        });

        it('should apply active class to strikethrough button when strikeThrough is active', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ strikeThrough: true }} />);
            const strikeButton = document.querySelector('[title="Strikethrough"]');
            expect(strikeButton.className).toContain('active');
        });

        it('should apply active class to link button when link is active', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ link: true }} />);
            const linkButton = document.querySelector('[title="Insert link (⌘K)"]');
            expect(linkButton.className).toContain('active');
        });

        it('should apply active class to highlight button when highlightColor is set', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ highlightColor: 'purple' }} />);
            const highlightButton = document.querySelector('[title="Highlight"]');
            expect(highlightButton.className).toContain('active');
        });

        it('should apply active class to highlight button when tagColor is set', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ tagColor: 'blue' }} />);
            const highlightButton = document.querySelector('[title="Highlight"]');
            expect(highlightButton.className).toContain('active');
        });
    });

    describe('Unlink Button Disabled State', () => {
        it('should disable unlink button when no link is active', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ link: false }} />);
            const unlinkButton = document.querySelector('[title="Remove link"]');
            expect(unlinkButton.disabled).toBe(true);
            expect(unlinkButton.className).toContain('disabled');
        });

        it('should enable unlink button when link is active', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ link: true }} />);
            const unlinkButton = document.querySelector('[title="Remove link"]');
            expect(unlinkButton.disabled).toBe(false);
            expect(unlinkButton.className).not.toContain('disabled');
        });

        it('should not call onRemoveLink when unlink button is disabled and clicked', () => {
            const onRemoveLink = vi.fn();
            render(<FormattingMenu {...defaultProps} activeFormats={{ link: false }} onRemoveLink={onRemoveLink} />);

            const unlinkButton = document.querySelector('[title="Remove link"]');
            fireEvent.click(unlinkButton);

            expect(onRemoveLink).not.toHaveBeenCalled();
        });

        it('should call onRemoveLink when unlink button is enabled and clicked', () => {
            const onRemoveLink = vi.fn();
            render(<FormattingMenu {...defaultProps} activeFormats={{ link: true }} onRemoveLink={onRemoveLink} />);

            const unlinkButton = document.querySelector('[title="Remove link"]');
            fireEvent.click(unlinkButton);

            expect(onRemoveLink).toHaveBeenCalled();
        });
    });

    describe('Gray Color Support', () => {
        it('should render gray highlight swatch', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            expect(document.querySelector('.highlight-swatch-gray')).toBeTruthy();
        });

        it('should render gray tag swatch', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            expect(document.querySelector('.tag-swatch-gray')).toBeTruthy();
        });

        it('should call onHighlight with gray when gray highlight swatch is clicked', () => {
            const onHighlight = vi.fn();
            const onToggleSubmenu = vi.fn();
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" onHighlight={onHighlight} onToggleSubmenu={onToggleSubmenu} />);

            const graySwatch = document.querySelector('.highlight-swatch-gray');
            fireEvent.click(graySwatch);

            expect(onHighlight).toHaveBeenCalledWith('gray', false);
        });

        it('should call onHighlight with gray tag when gray tag swatch is clicked', () => {
            const onHighlight = vi.fn();
            const onToggleSubmenu = vi.fn();
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" onHighlight={onHighlight} onToggleSubmenu={onToggleSubmenu} />);

            const grayTagSwatch = document.querySelector('.tag-swatch-gray');
            fireEvent.click(grayTagSwatch);

            expect(onHighlight).toHaveBeenCalledWith('gray', true);
        });

        it('should mark gray highlight swatch as active when highlightColor is gray', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" activeFormats={{ highlightColor: 'gray' }} />);
            const graySwatch = document.querySelector('.highlight-swatch-gray');
            expect(graySwatch.className).toContain('active');
        });
    });

    describe('Clear Formatting Button', () => {
        it('should render clear formatting button in highlight popup', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            const clearButton = document.querySelector('.clear-formatting-button');
            expect(clearButton).toBeTruthy();
            expect(clearButton.textContent).toBe('Clear');
        });

        it('should call onClearHighlight with null when clear button is clicked', () => {
            const onClearHighlight = vi.fn();
            const onToggleSubmenu = vi.fn();
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" onClearHighlight={onClearHighlight} onToggleSubmenu={onToggleSubmenu} />);

            const clearButton = document.querySelector('.clear-formatting-button');
            fireEvent.click(clearButton);

            expect(onClearHighlight).toHaveBeenCalledWith(null);
            expect(onToggleSubmenu).toHaveBeenCalledWith(null);
        });
    });

    describe('Highlight Popup Sections', () => {
        it('should render Normal section header', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            expect(screen.getByText('Normal')).toBeTruthy();
        });

        it('should render Tag section header', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            expect(screen.getByText('Tag')).toBeTruthy();
        });

        it('should render two color sections', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            const sections = document.querySelectorAll('.color-section');
            expect(sections.length).toBe(2);
        });

        it('should render six highlight swatches (gray, purple, blue, green, orange, red)', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            const highlightSwatches = document.querySelectorAll('.highlight-swatch');
            expect(highlightSwatches.length).toBe(6);
        });

        it('should render six tag swatches', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            const tagSwatches = document.querySelectorAll('.tag-swatch');
            expect(tagSwatches.length).toBe(6);
        });
    });

    describe('Block Type Items', () => {
        it('should render all block type items in Turn Into popup', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="turnInto" />);

            const popupItems = document.querySelectorAll('.popup-item');
            expect(popupItems.length).toBe(7); // Text, H1, H2, H3, Bulleted, Numbered, Quote

            // Check specific items exist
            expect(screen.getByText('Heading 1')).toBeTruthy();
            expect(screen.getByText('Heading 2')).toBeTruthy();
            expect(screen.getByText('Heading 3')).toBeTruthy();
            expect(screen.getByText('Bulleted List')).toBeTruthy();
            expect(screen.getByText('Numbered List')).toBeTruthy();
            expect(screen.getByText('Quote')).toBeTruthy();
        });

        it('should display check icon for active block type', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="turnInto" currentBlockType="h1" />);
            const checkIcons = document.querySelectorAll('.check-icon');
            expect(checkIcons.length).toBe(1);
        });
    });

    describe('Keyboard Navigation', () => {
        it('should close submenu on Escape when submenu is open', () => {
            const onToggleSubmenu = vi.fn();
            const onClose = vi.fn();
            render(<FormattingMenu {...defaultProps} activeSubmenu="turnInto" onToggleSubmenu={onToggleSubmenu} onClose={onClose} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onToggleSubmenu).toHaveBeenCalledWith(null);
            expect(onClose).not.toHaveBeenCalled();
        });

        it('should call onClose on Escape when no submenu is open', () => {
            const onToggleSubmenu = vi.fn();
            const onClose = vi.fn();
            render(<FormattingMenu {...defaultProps} activeSubmenu={null} onToggleSubmenu={onToggleSubmenu} onClose={onClose} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onClose).toHaveBeenCalled();
        });
    });
});
