import React, { useState, useCallback, useRef, useEffect, useDeferredValue } from 'react';
import {
    Heart,
    Star,
    PenLine,
    MoreHorizontal,
    ChevronsRight,
    PanelLeft,
} from 'lucide-react';
import BlockEditor from '../Editor/UnifiedBlockEditor';
import './PageContent.css';

const INITIAL_TITLE = 'Page Title';
const FALLBACK_TITLE = 'Untitled';
const MAX_TITLE_LENGTH = 100;

const PageContent = () => {
    const [displayTitle, setDisplayTitle] = useState(INITIAL_TITLE);
    const deferredTitle = useDeferredValue(displayTitle);
    const titleRef = useRef(null);
    const isInitializedRef = useRef(false);

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
                    <button className="nav-btn" aria-label="Edit page">
                        <PenLine size={18} />
                    </button>
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
                    <div className="page-header">
                        <div className="page-icon-large">
                            <Heart size={48} strokeWidth={1} color="black" />
                        </div>
                        <h1
                            ref={titleRef}
                            className="page-title-h1"
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleTitleInput}
                            onKeyDown={handleTitleKeyDown}
                            onBlur={handleTitleBlur}
                            onPaste={handleTitlePaste}
                            spellCheck={false}
                            aria-label="Page title, click to edit"
                            data-placeholder="Untitled"
                        />
                    </div>

                    {/* Block-based Editor */}
                    <BlockEditor />

                    {/* Added extra space at bottom for scrolling feel */}
                    <div className="spacer-bottom"></div>
                </div>
            </div>
        </div>
    );
};

export default PageContent;
