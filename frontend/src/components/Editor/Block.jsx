import React, { useRef, useEffect, useCallback, memo } from 'react';
import { GripVertical } from 'lucide-react';

// Mapping of block types to HTML tags
const BLOCK_TYPE_TAGS = {
    'paragraph': 'p',
    'h1': 'h1',
    'h2': 'h2',
    'h3': 'h3',
    'bulleted-list': 'li',
    'numbered-list': 'li',
    'quote': 'blockquote',
};

/**
 * Block component - renders a single editable block in the editor.
 * Uses memo for performance optimization.
 */
const Block = memo(({
    block,
    index,
    isSelected,
    hasTextSelection,
    isBeingDragged,
    isFocused,
    focusVersion,
    onContentChange,
    onKeyDown,
    onFocus,
    onHandleMouseDown,
    onDragOver,
    onDrop,
    onHandleClick,
    listNumber,
}) => {
    const contentRef = useRef(null);
    const blockRef = useRef(null);

    /**
     * Syncs contentEditable innerHTML with block.content.
     * Only updates if the content has actually changed to avoid cursor jumps.
     */
    useEffect(() => {
        if (contentRef.current) {
            console.log('[Block.jsx useEffect] block.id:', block.id);
            console.log('[Block.jsx useEffect] contentRef.current.innerHTML:', contentRef.current.innerHTML);
            console.log('[Block.jsx useEffect] block.content:', block.content);
            console.log('[Block.jsx useEffect] equal?', contentRef.current.innerHTML === block.content);

            if (contentRef.current.innerHTML !== block.content) {
                console.log('[Block.jsx useEffect] OVERWRITING innerHTML!');
                contentRef.current.innerHTML = block.content;
            }
        }
    }, [block.content, block.id]);

    /**
     * Focuses the block and sets cursor to end when isFocused changes.
     */
    useEffect(() => {
        if (isFocused && contentRef.current) {
            requestAnimationFrame(() => {
                if (contentRef.current) {
                    contentRef.current.focus();
                    // Set cursor at end of content
                    const range = document.createRange();
                    const sel = window.getSelection();
                    if (contentRef.current.childNodes.length > 0) {
                        const lastChild = contentRef.current.childNodes[contentRef.current.childNodes.length - 1];
                        if (lastChild.nodeType === Node.TEXT_NODE) {
                            range.setStart(lastChild, lastChild.textContent.length);
                        } else {
                            range.setStartAfter(lastChild);
                        }
                    } else {
                        range.setStart(contentRef.current, 0);
                    }
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            });
        }
    }, [isFocused, focusVersion]);

    /**
     * Handles input events from contentEditable.
     */
    const handleInput = useCallback((e) => {
        const content = e.target.innerHTML;
        onContentChange(block.id, content);
    }, [block.id, onContentChange]);

    /**
     * Handles keydown events in the block.
     */
    const handleKeyDown = useCallback((e) => {
        onKeyDown(e, block.id, contentRef.current);
    }, [block.id, onKeyDown]);

    /**
     * Handles focus events on the block.
     */
    const handleFocus = useCallback(() => {
        onFocus(block.id);
    }, [block.id, onFocus]);

    /**
     * Handles dragover events for drop targeting.
     */
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        onDragOver(e, index);
    }, [index, onDragOver]);

    /**
     * Handles drop events.
     */
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        onDrop(index, e);
    }, [index, onDrop]);

    /**
     * Handles click on the drag handle for block selection.
     */
    const handleHandleClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        onHandleClick(e, block.id);
    }, [block.id, onHandleClick]);

    /**
     * Handles mousedown on the drag handle to initiate drag.
     */
    const handleHandleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        onHandleMouseDown(e, block.id, index);
    }, [block.id, index, onHandleMouseDown]);

    const Tag = BLOCK_TYPE_TAGS[block.type] || 'p';

    // Build className based on block state
    const blockClassName = [
        'block-wrapper',
        `block-type-${block.type}`,
        isSelected ? 'block-selected' : '',
        hasTextSelection ? 'block-text-selected' : '',
        isBeingDragged ? 'block-being-dragged' : '',
        isFocused ? 'block-focused' : '',
    ].filter(Boolean).join(' ');

    /**
     * Renders the block content based on block type.
     */
    const renderContent = () => {
        // Bulleted list rendering
        if (block.type === 'bulleted-list') {
            return (
                <div className="list-item-wrapper">
                    <span className="list-bullet">•</span>
                    <Tag
                        ref={contentRef}
                        className="block-content"
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        data-placeholder="List item"
                    />
                </div>
            );
        }

        // Numbered list rendering
        if (block.type === 'numbered-list') {
            return (
                <div className="list-item-wrapper">
                    <span className="list-number">{listNumber}.</span>
                    <Tag
                        ref={contentRef}
                        className="block-content"
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        data-placeholder="List item"
                    />
                </div>
            );
        }

        // Quote rendering
        if (block.type === 'quote') {
            return (
                <Tag
                    ref={contentRef}
                    className="block-content quote-content"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    data-placeholder="Quote"
                />
            );
        }

        // Default rendering for paragraph and headings
        const placeholder = {
            'paragraph': 'Type \'/\' for commands...',
            'h1': 'Heading 1',
            'h2': 'Heading 2',
            'h3': 'Heading 3',
        }[block.type] || 'Type something...';

        return (
            <Tag
                ref={contentRef}
                className="block-content"
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                data-placeholder={placeholder}
            />
        );
    };

    return (
        <div
            ref={blockRef}
            className={blockClassName}
            data-block-id={block.id}
            data-block-index={index}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div
                className="block-handle"
                onMouseDown={handleHandleMouseDown}
                onClick={handleHandleClick}
            >
                <GripVertical size={16} />
            </div>
            <div className="block-content-wrapper">
                {renderContent()}
            </div>
        </div>
    );
});

Block.displayName = 'Block';

export default Block;
