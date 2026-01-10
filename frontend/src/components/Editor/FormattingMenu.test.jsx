import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FormattingMenu from './FormattingMenu';

describe('FormattingMenu', () => {
    // Clear localStorage before each test to avoid Recently Used colors affecting tests
    beforeEach(() => {
        localStorage.clear();
    });

    const defaultProps = {
        position: { top: 100, left: 200 },
        currentBlockType: 'paragraph',
        activeSubmenu: null,
        onToggleSubmenu: vi.fn(),
        onFormat: vi.fn(),
        onHighlight: vi.fn(),
        onClearHighlight: vi.fn(),
        onTextColor: vi.fn(),
        onClearTextColor: vi.fn(),
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
        expect(document.querySelector('[title="Inline Code"]')).toBeTruthy();
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

    it('should call onFormat when inline code button is clicked', () => {
        const onFormat = vi.fn();
        render(<FormattingMenu {...defaultProps} onFormat={onFormat} />);

        const inlineCodeButton = document.querySelector('[title="Inline Code"]');
        fireEvent.click(inlineCodeButton);

        expect(onFormat).toHaveBeenCalledWith('inlineCode');
    });

    it('should show Turn Into popup when activeSubmenu is turnInto', () => {
        render(<FormattingMenu {...defaultProps} activeSubmenu="turnInto" />);
        expect(document.querySelector('.turn-into-menu')).toBeTruthy();
        expect(screen.getByText('Basic blocks')).toBeTruthy();
    });

    it('should show ColorPicker popup when activeSubmenu is highlight', () => {
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
        expect(document.querySelector('.color-picker')).toBeTruthy();
    });

    it('should render color rows in color picker', () => {
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);

        const colorRows = document.querySelectorAll('.color-picker-row');
        // Recently Used (1 row) + Text Color (2 rows) + Background Color (2 rows) = 5 rows
        expect(colorRows.length).toBeGreaterThanOrEqual(4);
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

        const activeItem = document.querySelector('.turn-into-menu-item.selected');
        expect(activeItem).toBeTruthy();
        expect(activeItem.textContent).toContain('Heading 2');
    });

    it('should call onChangeBlockType when Turn Into item is clicked', () => {
        const onChangeBlockType = vi.fn();
        const onToggleSubmenu = vi.fn();
        render(<FormattingMenu {...defaultProps} activeSubmenu="turnInto" onChangeBlockType={onChangeBlockType} onToggleSubmenu={onToggleSubmenu} />);

        const items = document.querySelectorAll('.turn-into-menu-item');
        fireEvent.click(items[1]); // Click on "Heading 1"

        expect(onChangeBlockType).toHaveBeenCalledWith('h1');
        expect(onToggleSubmenu).toHaveBeenCalledWith(null);
    });

    it('should render text and background color swatches', () => {
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);

        // Check for text color swatches (10 colors)
        const textSwatches = document.querySelectorAll('.text-swatch');
        expect(textSwatches.length).toBe(10);

        // Check for background color swatches (10 colors)
        const bgSwatches = document.querySelectorAll('.bg-swatch');
        expect(bgSwatches.length).toBe(10);
    });

    it('should call onHighlight when background swatch is clicked', () => {
        const onHighlight = vi.fn();
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" onHighlight={onHighlight} />);

        const purpleSwatch = document.querySelector('.bg-swatch.color-purple');
        fireEvent.click(purpleSwatch);

        expect(onHighlight).toHaveBeenCalledWith('purple');
    });

    it('should call onTextColor when text swatch is clicked', () => {
        const onTextColor = vi.fn();
        render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" onTextColor={onTextColor} />);

        const purpleSwatch = document.querySelector('.text-swatch.color-purple');
        fireEvent.click(purpleSwatch);

        expect(onTextColor).toHaveBeenCalledWith('purple');
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

    it('should call onToggleSubmenu when Color button is clicked', () => {
        const onToggleSubmenu = vi.fn();
        render(<FormattingMenu {...defaultProps} onToggleSubmenu={onToggleSubmenu} />);

        const colorButton = document.querySelector('[title="Color"]');
        fireEvent.click(colorButton);

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

        it('should apply active class to inline code button when inlineCode is active', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ inlineCode: true }} />);
            const inlineCodeButton = document.querySelector('[title="Inline Code"]');
            expect(inlineCodeButton.className).toContain('active');
        });

        it('should apply active class to link button when link is active', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ link: true }} />);
            const linkButton = document.querySelector('[title="Insert link (⌘K)"]');
            expect(linkButton.className).toContain('active');
        });

        it('should apply active class to color picker button when highlightColor is set', () => {
            render(<FormattingMenu {...defaultProps} activeFormats={{ highlightColor: 'purple' }} />);
            const colorButton = document.querySelector('[title="Color"]');
            expect(colorButton.className).toContain('active');
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
        it('should call onHighlight with gray when gray background swatch is clicked', () => {
            const onHighlight = vi.fn();
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" onHighlight={onHighlight} />);

            const graySwatch = document.querySelector('.bg-swatch.color-gray');
            fireEvent.click(graySwatch);

            expect(onHighlight).toHaveBeenCalledWith('gray');
        });

        it('should mark gray background swatch as active when highlightColor is gray', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" activeFormats={{ highlightColor: 'gray' }} />);
            // Get the swatch from the Background Color section (third section)
            const sections = document.querySelectorAll('.color-picker-section');
            const bgSection = sections[2];
            const graySwatch = bgSection.querySelector('.bg-swatch.color-gray');
            expect(graySwatch.className).toContain('active');
        });
    });

    describe('Color Picker Sections', () => {
        it('should render three color picker sections', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            const sections = document.querySelectorAll('.color-picker-section');
            expect(sections.length).toBe(3); // Recently Used, Text Color, Background Color
        });

        it('should render section headers', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            const headers = document.querySelectorAll('.color-picker-header');
            expect(headers.length).toBe(3);
        });
    });

    describe('Color Swatches Count', () => {
        it('should render ten text color swatches in Text Color section', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            // Get swatches from Text Color section (second section)
            const sections = document.querySelectorAll('.color-picker-section');
            const textSection = sections[1]; // Text Color is second section
            const textSwatches = textSection.querySelectorAll('.text-swatch');
            expect(textSwatches.length).toBe(10);
        });

        it('should render ten background color swatches in Background Color section', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="highlight" />);
            // Get swatches from Background Color section (third section)
            const sections = document.querySelectorAll('.color-picker-section');
            const bgSection = sections[2]; // Background Color is third section
            const bgSwatches = bgSection.querySelectorAll('.bg-swatch');
            expect(bgSwatches.length).toBe(10);
        });
    });

    describe('Block Type Items', () => {
        it('should render all block type items in Turn Into popup', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="turnInto" />);

            const menuItems = document.querySelectorAll('.turn-into-menu-item');
            expect(menuItems.length).toBe(8); // Text, H1, H2, H3, H4, Bulleted, Numbered, Quote

            // Check specific items exist
            expect(screen.getByText('Heading 1')).toBeTruthy();
            expect(screen.getByText('Heading 2')).toBeTruthy();
            expect(screen.getByText('Heading 3')).toBeTruthy();
            expect(screen.getByText('Heading 4')).toBeTruthy();
            expect(screen.getByText('Bulleted List')).toBeTruthy();
            expect(screen.getByText('Numbered List')).toBeTruthy();
            expect(screen.getByText('Quote')).toBeTruthy();
        });

        it('should apply selected class to active block type', () => {
            render(<FormattingMenu {...defaultProps} activeSubmenu="turnInto" currentBlockType="h1" />);
            const selectedItem = document.querySelector('.turn-into-menu-item.selected');
            expect(selectedItem).toBeTruthy();
            expect(selectedItem.textContent).toContain('Heading 1');
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
