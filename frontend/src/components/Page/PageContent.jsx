import React, { useState, useCallback, useRef, useEffect, useDeferredValue } from 'react';
import * as LucideIcons from 'lucide-react';
import {
    Heart,
    Star,
    PenLine,
    MoreHorizontal,
    ChevronsRight,
    PanelLeft,
    Smile,
    X,
    Check,
} from 'lucide-react';
import BlockEditor from '../Editor/UnifiedBlockEditor';
import { EmojiPicker, ICON_COLORS, toPascalCase } from '../EmojiPicker';
import './PageContent.css';

const INITIAL_TITLE = 'Page Title';
const FALLBACK_TITLE = 'Untitled';
const MAX_TITLE_LENGTH = 100;

const PageContent = () => {
    const [displayTitle, setDisplayTitle] = useState(INITIAL_TITLE);
    const deferredTitle = useDeferredValue(displayTitle);
    const titleRef = useRef(null);
    const isInitializedRef = useRef(false);

    // Page icon state
    const [pageIcon, setPageIcon] = useState(null);
    const [showAddIcon, setShowAddIcon] = useState(false);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
    const iconButtonRef = useRef(null);

    // Edit mode state
    const [isEditMode, setIsEditMode] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const originalTitleRef = useRef(INITIAL_TITLE);
    const originalIconRef = useRef(null);
    const originalBlocksRef = useRef(null);
    const blockEditorRef = useRef(null);

    // Set initial content only once
    useEffect(() => {
        if (titleRef.current && !isInitializedRef.current) {
            titleRef.current.textContent = INITIAL_TITLE;
            isInitializedRef.current = true;
        }
    }, []);

    const handleTitleInput = useCallback(() => {
        let newTitle = titleRef.current?.textContent || '';

        // Enforce max length
        if (newTitle.length > MAX_TITLE_LENGTH) {
            newTitle = newTitle.slice(0, MAX_TITLE_LENGTH);
            if (titleRef.current) {
                titleRef.current.textContent = newTitle;
                // Restore cursor to end
                const range = document.createRange();
                range.selectNodeContents(titleRef.current);
                range.collapse(false);
                window.getSelection()?.removeAllRanges();
                window.getSelection()?.addRange(range);
            }
        }

        setDisplayTitle(newTitle);
    }, []);

    const handleTitleKeyDown = useCallback((e) => {
        // Prevent Enter from creating new lines in title
        if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
            return;
        }

        // Block all formatting shortcuts (Cmd/Ctrl + B, I, U)
        const isMod = e.metaKey || e.ctrlKey;
        if (isMod && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    }, []);

    const handleTitleBlur = useCallback(() => {
        const rawTitle = titleRef.current?.textContent || '';
        const newTitle = rawTitle.trim();

        // If title is empty, restore default
        if (!newTitle) {
            if (titleRef.current) {
                titleRef.current.textContent = FALLBACK_TITLE;
            }
            setDisplayTitle(FALLBACK_TITLE);
        } else {
            // Sync DOM if trim changed the value
            if (newTitle !== rawTitle && titleRef.current) {
                titleRef.current.textContent = newTitle;
            }
            setDisplayTitle(newTitle);
        }
    }, []);

    const handleTitlePaste = useCallback((e) => {
        e.preventDefault();
        // Get plain text only, stripping all formatting
        const text = e.clipboardData?.getData('text/plain') || '';
        // Remove newlines - title should be single line
        let cleanText = text.replace(/[\r\n]+/g, ' ').trim();

        if (!cleanText) return;

        // Check current length and limit pasted text
        const currentLength = titleRef.current?.textContent?.length || 0;
        const availableSpace = MAX_TITLE_LENGTH - currentLength;
        if (availableSpace <= 0) return;

        if (cleanText.length > availableSpace) {
            cleanText = cleanText.slice(0, availableSpace);
        }

        // Use modern Selection API instead of deprecated execCommand
        const selection = window.getSelection();
        if (selection?.rangeCount > 0) {
            selection.deleteFromDocument();
            const textNode = document.createTextNode(cleanText);
            selection.getRangeAt(0).insertNode(textNode);
            // Move cursor to end of inserted text
            selection.collapseToEnd();
            // Trigger input event to sync state
            titleRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }, []);

    // Open emoji picker with position
    const openEmojiPicker = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setEmojiPickerPosition({
            top: rect.bottom + 8,
            left: rect.left,
        });
        setEmojiPickerOpen(true);
    }, []);

    // Handle emoji/icon selection
    const handleIconSelect = useCallback((selection) => {
        setPageIcon(selection);
        setEmojiPickerOpen(false);
    }, []);

    // Handle icon removal
    const handleIconRemove = useCallback(() => {
        setPageIcon(null);
        setEmojiPickerOpen(false);
    }, []);

    // Enter edit mode
    const enterEditMode = useCallback(() => {
        originalTitleRef.current = displayTitle;
        originalIconRef.current = pageIcon;
        // Snapshot current blocks state
        if (blockEditorRef.current) {
            originalBlocksRef.current = blockEditorRef.current.getBlocks();
        }
        setIsEditMode(true);
    }, [displayTitle, pageIcon]);

    // Save changes and exit edit mode
    const handleSave = useCallback(() => {
        setIsEditMode(false);
    }, []);

    // Request cancel (shows modal)
    const handleCancelRequest = useCallback(() => {
        setShowCancelModal(true);
    }, []);

    // Confirm cancel - discard changes
    const handleConfirmCancel = useCallback(() => {
        // Restore original title
        setDisplayTitle(originalTitleRef.current);
        if (titleRef.current) {
            titleRef.current.textContent = originalTitleRef.current;
        }
        // Restore original icon
        setPageIcon(originalIconRef.current);
        // Restore original blocks
        if (blockEditorRef.current && originalBlocksRef.current) {
            blockEditorRef.current.setBlocks(originalBlocksRef.current);
        }
        setShowCancelModal(false);
        setIsEditMode(false);
    }, []);

    // Close cancel modal without discarding
    const handleCloseModal = useCallback(() => {
        setShowCancelModal(false);
    }, []);

    // Render the page icon
    const renderPageIcon = () => {
        if (!pageIcon) return null;

        if (pageIcon.type === 'emoji') {
            return <span className="page-icon-emoji">{pageIcon.value}</span>;
        }

        // Use shared utility to convert kebab-case to PascalCase
        const iconName = toPascalCase(pageIcon.value);
        const IconComponent = LucideIcons[iconName];

        if (IconComponent) {
            return <IconComponent size={48} color={pageIcon.color} strokeWidth={1.5} />;
        }
        return null;
    };

    return (
        <div className="page-content-card">
            {/* Top Navigation Bar */}
            <div className="top-nav-bar">
                <div className="breadcrumbs-area">
                    <PanelLeft size={18} className="sidebar-icon" />
                    <div className="breadcrumbs">
                        <span className="breadcrumb-link">Main</span>
                        <span className="breadcrumb-separator">&gt;</span>
                        <span className="current-page">
                            <Heart size={12} fill="black" className="text-black" />
                            <span>{deferredTitle || 'Untitled'}</span>
                        </span>
                    </div>
                </div>

                <div className="nav-actions">
                    <button className="nav-btn" aria-label="Add to favorites">
                        <Star size={18} />
                    </button>
                    {isEditMode ? (
                        <>
                            <button
                                className="nav-btn nav-btn-cancel"
                                aria-label="Cancel editing"
                                onClick={handleCancelRequest}
                            >
                                <X size={18} />
                            </button>
                            <button
                                className="nav-btn nav-btn-save"
                                aria-label="Save changes"
                                onClick={handleSave}
                            >
                                <Check size={18} />
                            </button>
                        </>
                    ) : (
                        <button
                            className="nav-btn"
                            aria-label="Edit page"
                            onClick={enterEditMode}
                        >
                            <PenLine size={18} />
                        </button>
                    )}
                    <button className="nav-btn" aria-label="More options">
                        <MoreHorizontal size={18} />
                    </button>
                    <button className="nav-btn ml-1" aria-label="Toggle properties panel">
                        <ChevronsRight size={18} />
                    </button>
                </div>
            </div>

            {/* Main Scrollable Content Area */}
            <div className="scrollable-content">
                <div className="content-wrapper">

                    {/* Page Icon & Title */}
                    <div
                        className={`page-header ${!isEditMode ? 'read-mode' : ''}`}
                        onMouseEnter={() => isEditMode && setShowAddIcon(true)}
                        onMouseLeave={() => setShowAddIcon(false)}
                    >
                        {/* Icon/Add icon area */}
                        {pageIcon ? (
                            /* Icon area - expanded when icon is set */
                            <div className="page-icon-area">
                                {isEditMode ? (
                                    <button
                                        ref={iconButtonRef}
                                        className="page-icon-button"
                                        onClick={openEmojiPicker}
                                        aria-label="Change page icon"
                                    >
                                        {renderPageIcon()}
                                    </button>
                                ) : (
                                    <div className="page-icon-display">
                                        {renderPageIcon()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Small hover area for Add icon button - only in edit mode */
                            <div className="page-icon-hover-area">
                                {isEditMode && showAddIcon && (
                                    <button
                                        className="add-icon-button"
                                        onClick={openEmojiPicker}
                                    >
                                        <Smile size={16} />
                                        <span>Add icon</span>
                                    </button>
                                )}
                            </div>
                        )}

                        <h1
                            ref={titleRef}
                            className={`page-title-h1 ${!isEditMode ? 'read-mode' : ''}`}
                            contentEditable={isEditMode}
                            suppressContentEditableWarning
                            onInput={isEditMode ? handleTitleInput : undefined}
                            onKeyDown={isEditMode ? handleTitleKeyDown : undefined}
                            onBlur={isEditMode ? handleTitleBlur : undefined}
                            onPaste={isEditMode ? handleTitlePaste : undefined}
                            spellCheck={false}
                            aria-label={isEditMode ? 'Page title, click to edit' : 'Page title'}
                            data-placeholder="Untitled"
                        />
                    </div>

                    {/* Block-based Editor */}
                    <BlockEditor ref={blockEditorRef} readOnly={!isEditMode} />

                    {/* Added extra space at bottom for scrolling feel */}
                    <div className="spacer-bottom"></div>
                </div>
            </div>

            {/* Emoji Picker */}
            <EmojiPicker
                isOpen={emojiPickerOpen}
                position={emojiPickerPosition}
                onSelect={handleIconSelect}
                onRemove={handleIconRemove}
                onClose={() => setEmojiPickerOpen(false)}
                currentValue={pageIcon}
                showRemove={!!pageIcon}
            />

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Discard changes?</h3>
                        <p>Your unsaved changes will be lost.</p>
                        <div className="modal-actions">
                            <button
                                className="modal-btn modal-btn-secondary"
                                onClick={handleCloseModal}
                            >
                                Keep editing
                            </button>
                            <button
                                className="modal-btn modal-btn-danger"
                                onClick={handleConfirmCancel}
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageContent;
