import React, { useState, useRef, useLayoutEffect } from 'react';
import {
    Search,
    Bell,
    ChevronRight,
    ChevronDown,
    FileText,
    Newspaper,
    BookOpen,
    MoreVertical,
    Plus,
    Settings
} from 'lucide-react';
import './LeftSidebar.css';

// Page item component for navigation
const PageItem = ({
    icon,
    emoji,
    label,
    isActive = false,
    depth = 0,
    hasChildren = false,
    isExpanded = false,
    onToggle,
    onMoreClick
}) => {
    const paddingLeft = 16 + depth * 20;

    const renderIcon = () => {
        if (emoji) return <span className="page-emoji">{emoji}</span>;
        if (icon) return React.createElement(icon, { size: 20 });
        return <FileText size={20} />;
    };

    return (
        <div
            className={`page-item ${isActive ? 'active' : ''} ${hasChildren ? 'has-children' : ''}`}
            style={{ paddingLeft: `${paddingLeft}px` }}
        >
            <div className="icon-chevron-wrapper">
                {/* Icon - shown by default, hidden on hover if has children */}
                <div className="page-icon-wrapper">
                    {renderIcon()}
                </div>

                {/* Chevron - hidden by default, shown on hover if has children */}
                {hasChildren && (
                    <button
                        className="expand-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle?.();
                        }}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? (
                            <ChevronDown size={16} />
                        ) : (
                            <ChevronRight size={16} />
                        )}
                    </button>
                )}
            </div>

            <span className="page-label">{label}</span>

            <button
                className="more-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    onMoreClick?.();
                }}
                aria-label="More options"
            >
                <MoreVertical size={18} />
            </button>
        </div>
    );
};

// Collection name divider component
const CollectionNameDivider = ({ collectionKey, name, isPages = false, onNameChange }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(name);
    const inputRef = useRef(null);

    const handleDoubleClick = () => {
        if (!isPages) {
            setIsEditing(true);
            setEditValue(name);
        }
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (editValue.trim() && editValue !== name) {
            onNameChange?.(collectionKey, editValue.trim());
        } else {
            setEditValue(name);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            setEditValue(name);
            setIsEditing(false);
        }
    };

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    React.useEffect(() => {
        setEditValue(name);
    }, [name]);

    return (
        <div
            className="collection-name-divider"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="divider-line left" />

            <div className="divider-label-wrapper">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="divider-label-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                    />
                ) : (
                    <span
                        className="divider-label"
                        onDoubleClick={handleDoubleClick}
                        title={name}
                    >
                        {name}
                    </span>
                )}
            </div>

            <div className="divider-line right" />

            {isHovered && !isEditing && (
                <div className="divider-actions">
                    {!isPages && (
                        <button className="divider-action-btn" aria-label="Settings">
                            <Settings size={16} />
                        </button>
                    )}
                    <button className="divider-action-btn" aria-label="Add page">
                        <Plus size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

// Expandable page (page with nested pages)
const ExpandablePage = ({ emoji, label, children, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="expandable-page">
            <PageItem
                emoji={emoji}
                label={label}
                depth={depth}
                hasChildren={true}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
            />
            {isExpanded && (
                <div className="nested-pages">
                    {children}
                </div>
            )}
        </div>
    );
};

// Collection Switcher component
const CollectionSwitcher = ({ collections, activeCollection, onCollectionChange }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const containerRef = useRef(null);
    const innerRef = useRef(null);

    // Check for overflow after render using useLayoutEffect
    useLayoutEffect(() => {
        const checkOverflow = () => {
            if (innerRef.current) {
                // Check if content is taller than single row (roughly 18px for buttons + gaps)
                const contentHeight = innerRef.current.scrollHeight;
                setHasOverflow(contentHeight > 20);
            }
        };
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [collections]);

    return (
        <div
            ref={containerRef}
            className={`collection-switcher ${isHovered && hasOverflow ? 'expanded' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div ref={innerRef} className="collection-switcher-inner">
                {collections.map((collection) => (
                    <button
                        key={collection.key}
                        className={`collection-key-btn ${activeCollection === collection.key ? 'active' : ''}`}
                        onClick={() => onCollectionChange(collection.key)}
                    >
                        {collection.key}
                    </button>
                ))}
            </div>
        </div>
    );
};

const LeftSidebar = () => {
    const [activePageId, setActivePageId] = useState('page-title-active');
    const [activeCollection, setActiveCollection] = useState('PAGES');

    // Mock collections data - with full names
    const [collections, setCollections] = useState([
        { key: 'PAGES', name: 'Pages' },
        { key: 'PRD', name: 'Product Requirements' },
        { key: 'SPEC', name: 'Specifications' },
        { key: 'FR', name: 'Functional Requirements' },
        { key: 'API', name: 'API Documentation' },
    ]);

    const handleCollectionNameChange = (key, newName) => {
        setCollections(prev => prev.map(c =>
            c.key === key ? { ...c, name: newName } : c
        ));
    };

    const activeCollectionData = collections.find(c => c.key === activeCollection);
    return (
        <aside className="left-sidebar">
            {/* Header */}
            <header className="sidebar-header">
                <button className="space-button">
                    <div className="space-icon">
                        <span>🚀</span>
                    </div>
                    <span className="space-name">Space Name</span>
                </button>
                <button className="search-button" aria-label="Search">
                    <Search size={18} />
                </button>
            </header>

            {/* Divider after header */}
            <div className="header-divider" />

            {/* Content */}
            <nav className="sidebar-content">
                {/* Standard Pages */}
                <div className="standard-pages">
                    <PageItem
                        icon={Newspaper}
                        label="News"
                    />
                    <PageItem
                        icon={BookOpen}
                        label="Glossary"
                    />
                </div>

                <CollectionNameDivider
                    collectionKey={activeCollection}
                    name={activeCollectionData?.name || activeCollection}
                    isPages={activeCollection === 'PAGES'}
                    onNameChange={handleCollectionNameChange}
                />

                {/* Collection Pages */}
                <div className="collection-pages">
                    {/* Expandable page with children */}
                    <ExpandablePage emoji="📁" label="Page title">
                        <PageItem
                            emoji="📄"
                            label="Page title"
                            depth={1}
                        />
                    </ExpandablePage>

                    <PageItem emoji="📄" label="Page title" />
                    <PageItem emoji="📄" label="Page title" />
                    <PageItem emoji="📄" label="Page title" />
                    <PageItem emoji="📄" label="Page title" />

                    {/* Active page */}
                    <PageItem
                        emoji="💙"
                        label="Page title"
                        isActive={true}
                    />

                    <PageItem emoji="📄" label="Page title" />

                    {/* Nested pages example */}
                    <ExpandablePage emoji="📁" label="Page title">
                        <ExpandablePage emoji="📁" label="Nested page" depth={1}>
                            <PageItem
                                emoji="📄"
                                label="Page title"
                                depth={2}
                            />
                            <PageItem
                                emoji="📄"
                                label="Page title"
                                depth={2}
                            />
                            <PageItem
                                emoji="📄"
                                label="Page title"
                                depth={2}
                            />
                        </ExpandablePage>
                    </ExpandablePage>
                </div>
            </nav>

            {/* Collection Switcher - above footer divider */}
            <CollectionSwitcher
                collections={collections}
                activeCollection={activeCollection}
                onCollectionChange={setActiveCollection}
            />

            {/* Divider before footer */}
            <div className="footer-divider" />

            {/* Footer */}
            <footer className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Viktor"
                            alt="Viktor Gromov"
                        />
                    </div>
                    <div className="user-details">
                        <span className="user-name">Viktor Gromov</span>
                        <span className="user-role">Business Analyst</span>
                    </div>
                </div>
                <button className="notification-button" aria-label="Notifications">
                    <Bell size={18} />
                </button>
            </footer>
        </aside>
    );
};

export default LeftSidebar;
