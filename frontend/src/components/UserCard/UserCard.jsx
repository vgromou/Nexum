import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {
    LogOut,
    Settings,
    Maximize2,
    Minimize2,
    X,
    Bell,
    Loader2
} from 'lucide-react';
import IconButton from '../Button/IconButton';
import RoleBadge from '../RoleBadge';
import ConfirmationPopover from '../ConfirmationPopover';
import './UserCard.css';

/** Maximum combined length of email + username for inline layout */
const CONTACTS_INLINE_THRESHOLD = 35;

/** Confirmation dialog title for sign out */
const SIGN_OUT_CONFIRMATION_TITLE = 'Sign out of Nexum?';

/**
 * Copyable text component - renders a button that copies text to clipboard on click
 */
const CopyableText = ({ text, field, copiedField, onCopy, className = '' }) => (
    <button
        type="button"
        className={`user-card__copyable ${className} ${copiedField === field ? 'user-card__copyable--copied' : ''}`}
        onClick={() => onCopy(text, field)}
        title={copiedField === field ? 'Copied!' : 'Click to copy'}
    >
        {text}
    </button>
);

CopyableText.propTypes = {
    /** Text to display and copy */
    text: PropTypes.string.isRequired,
    /** Unique field identifier for tracking copied state */
    field: PropTypes.string.isRequired,
    /** Currently copied field (for visual feedback) */
    copiedField: PropTypes.string,
    /** Callback when text is copied */
    onCopy: PropTypes.func.isRequired,
    /** Additional CSS classes */
    className: PropTypes.string,
};

/**
 * UserCard Component
 *
 * A user profile card with two modes: compact and expanded.
 * Features smooth macOS-style animations when switching between modes.
 *
 * @example
 * <UserCard
 *   isOpen={true}
 *   user={{
 *     firstName: 'Viktor',
 *     lastName: 'Gromov',
 *     avatarUrl: '/avatar.jpg',
 *     description: '25 y.o. Business Analyst',
 *     email: 'v.gromou@gmail.com',
 *     username: '@vgromou',
 *     orgRole: 'Member',
 *     spaceRole: 'Admin',
 *     birthday: '16.03.2000',
 *     location: 'Obninsk city, Kaluga oblast',
 *     jobTitle: 'Business Analyst',
 *     department: 'Analysis Department'
 *   }}
 *   onClose={handleClose}
 * />
 */
const UserCard = ({
    isOpen = false,
    user,
    onClose,
    onLogout,
    onSettings,
    onNotificationClick,
    anchorRef,
    isLoggingOut = false,
    className = '',
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [copiedField, setCopiedField] = useState(null);
    const [isSignOutPopoverOpen, setIsSignOutPopoverOpen] = useState(false);
    const cardRef = useRef(null);
    const compactRef = useRef(null);
    const expandedRef = useRef(null);
    const signOutButtonRef = useRef(null);
    const signOutButtonExpandedRef = useRef(null);

    // Handle open/close animation
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            const timer = setTimeout(() => setIsActive(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsActive(false);
            setIsExpanded(false);
            const timer = setTimeout(() => setShouldRender(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Measure content dimensions for smooth animation
    useEffect(() => {
        if (!shouldRender) return;

        const measureDimensions = () => {
            const contentRef = isExpanded ? expandedRef : compactRef;
            if (contentRef.current) {
                setDimensions({
                    width: contentRef.current.offsetWidth,
                    height: contentRef.current.offsetHeight
                });
            }
        };

        // Initial measurement
        measureDimensions();
        // Remeasure after a short delay to ensure styles are applied
        const timer = setTimeout(measureDimensions, 50);
        return () => clearTimeout(timer);
    }, [shouldRender, isExpanded]);

    // Handle click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            // Don't close UserCard while sign out popover is open
            if (isSignOutPopoverOpen) {
                return;
            }

            if (
                cardRef.current &&
                !cardRef.current.contains(event.target) &&
                anchorRef?.current &&
                !anchorRef.current.contains(event.target)
            ) {
                onClose?.();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, anchorRef, isSignOutPopoverOpen]);

    // Handle escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Copy to clipboard handler
    const copyToClipboard = useCallback(async (text, field) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            // Clipboard API may fail in some browsers/contexts - silently ignore
        }
    }, []);

    // Sign out popover handlers
    const handleSignOutClick = useCallback(() => {
        setIsSignOutPopoverOpen(true);
    }, []);

    const handleSignOutCancel = useCallback(() => {
        setIsSignOutPopoverOpen(false);
    }, []);

    const handleSignOutConfirm = useCallback(() => {
        setIsSignOutPopoverOpen(false);
        onLogout?.();
    }, [onLogout]);

    if (!shouldRender || !user) return null;

    const {
        firstName,
        lastName,
        avatarUrl,
        description,
        email,
        username,
        orgRole,
        spaceRole,
        birthday,
        location,
        jobTitle,
        department
    } = user;

    const fullName = `${firstName} ${lastName}`;
    const isContactsShort = (email?.length || 0) + (username?.length || 0) < CONTACTS_INLINE_THRESHOLD;

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const containerClasses = [
        'user-card',
        isActive && 'user-card--active',
        isExpanded && 'user-card--expanded',
        className
    ].filter(Boolean).join(' ');

    const cardStyle = dimensions.width > 0 ? {
        width: dimensions.width,
        height: dimensions.height
    } : {};

    return (
        <div
            ref={cardRef}
            className={containerClasses}
            style={cardStyle}
            role="dialog"
            aria-modal="true"
            aria-label="User profile"
        >
            {/* Compact Mode Content */}
            <div
                ref={compactRef}
                className={`user-card__content user-card__content--compact ${!isExpanded ? 'user-card__content--visible' : ''}`}
            >
                {/* Header */}
                <header className="user-card__header">
                    <div ref={signOutButtonRef}>
                        <IconButton
                            icon={isLoggingOut ? <Loader2 size={16} className="user-card__spinner" /> : <LogOut size={16} />}
                            size="sm"
                            onClick={handleSignOutClick}
                            disabled={isLoggingOut || isSignOutPopoverOpen}
                            aria-label={isLoggingOut ? 'Signing out...' : 'Sign out'}
                        />
                    </div>
                    <div className="user-card__header-actions">
                        <IconButton
                            icon={<Settings size={16} />}
                            size="sm"
                            onClick={onSettings}
                            disabled={isLoggingOut}
                            aria-label="Settings"
                        />
                        <IconButton
                            icon={<Maximize2 size={16} />}
                            size="sm"
                            onClick={toggleExpanded}
                            disabled={isLoggingOut}
                            aria-label="Expand details"
                        />
                        <IconButton
                            icon={<X size={16} />}
                            size="sm"
                            onClick={onClose}
                            disabled={isLoggingOut}
                            aria-label="Close"
                        />
                    </div>
                </header>

                {/* Avatar */}
                <div className="user-card__avatar-section user-card__avatar-section--centered">
                    <div className="user-card__avatar user-card__avatar--large">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={fullName} />
                        ) : (
                            <div className="user-card__avatar-placeholder" />
                        )}
                    </div>
                </div>

                {/* Name & Description */}
                <div className="user-card__info user-card__info--centered">
                    <h3 className="user-card__name">{fullName}</h3>
                    {description && (
                        <p className="user-card__description">{description}</p>
                    )}
                </div>

                {/* Contact Info */}
                <div className={`user-card__contacts ${isContactsShort ? 'user-card__contacts--inline' : 'user-card__contacts--stacked'}`}>
                    <CopyableText text={email} field="email-compact" copiedField={copiedField} onCopy={copyToClipboard} className="user-card__email" />
                    {isContactsShort && (
                        <span className="user-card__contacts-separator">•</span>
                    )}
                    <CopyableText text={username} field="username-compact" copiedField={copiedField} onCopy={copyToClipboard} className="user-card__username" />
                </div>

                {/* Roles */}
                <div className="user-card__roles">
                    <RoleBadge role={orgRole} scope="organization" />
                    <RoleBadge role={spaceRole} scope="space" />
                </div>

                {/* Footer: Notification */}
                <div className="user-card__footer">
                    <div className="user-card__notification">
                        <IconButton
                            icon={<Bell size={16} />}
                            size="sm"
                            onClick={onNotificationClick}
                            aria-label="Notifications"
                        />
                    </div>
                </div>
            </div>

            {/* Expanded Mode Content */}
            <div
                ref={expandedRef}
                className={`user-card__content user-card__content--expanded ${isExpanded ? 'user-card__content--visible' : ''}`}
            >
                {/* Header */}
                <header className="user-card__header">
                    <div ref={signOutButtonExpandedRef}>
                        <IconButton
                            icon={isLoggingOut ? <Loader2 size={16} className="user-card__spinner" /> : <LogOut size={16} />}
                            size="sm"
                            onClick={handleSignOutClick}
                            disabled={isLoggingOut || isSignOutPopoverOpen}
                            aria-label={isLoggingOut ? 'Signing out...' : 'Sign out'}
                        />
                    </div>
                    <div className="user-card__header-actions">
                        <IconButton
                            icon={<Settings size={16} />}
                            size="sm"
                            onClick={onSettings}
                            disabled={isLoggingOut}
                            aria-label="Settings"
                        />
                        <IconButton
                            icon={<Minimize2 size={16} />}
                            size="sm"
                            onClick={toggleExpanded}
                            disabled={isLoggingOut}
                            aria-label="Collapse details"
                        />
                        <IconButton
                            icon={<X size={16} />}
                            size="sm"
                            onClick={onClose}
                            disabled={isLoggingOut}
                            aria-label="Close"
                        />
                    </div>
                </header>

                {/* Profile Section */}
                <div className="user-card__profile">
                    <div className="user-card__avatar user-card__avatar--medium">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={fullName} />
                        ) : (
                            <div className="user-card__avatar-placeholder" />
                        )}
                    </div>
                    <div className="user-card__profile-info">
                        <h3 className="user-card__name">{fullName}</h3>
                        <div className="user-card__roles user-card__roles--inline">
                            <RoleBadge role={orgRole} scope="organization" />
                            <RoleBadge role={spaceRole} scope="space" />
                        </div>
                    </div>
                </div>

                {/* Personal Section */}
                <section className="user-card__section">
                    <h4 className="user-card__section-title">PERSONAL</h4>
                    <div className="user-card__section-grid">
                        <div className="user-card__field">
                            <span className="user-card__field-label">Birthday</span>
                            <span className={`user-card__field-value ${!birthday ? 'user-card__field-value--empty' : ''}`}>
                                {birthday || 'Not provided'}
                            </span>
                        </div>
                        <div className="user-card__field">
                            <span className="user-card__field-label">Location</span>
                            <span className={`user-card__field-value ${!location ? 'user-card__field-value--empty' : ''}`}>
                                {location || 'Not provided'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Work Section */}
                <section className="user-card__section">
                    <h4 className="user-card__section-title">WORK</h4>
                    <div className="user-card__section-grid">
                        <div className="user-card__field">
                            <span className="user-card__field-label">Job Title</span>
                            <span className={`user-card__field-value ${!jobTitle ? 'user-card__field-value--empty' : ''}`}>
                                {jobTitle || 'Not provided'}
                            </span>
                        </div>
                        <div className="user-card__field">
                            <span className="user-card__field-label">Department</span>
                            <span className={`user-card__field-value ${!department ? 'user-card__field-value--empty' : ''}`}>
                                {department || 'Not provided'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Account Section */}
                <section className="user-card__section">
                    <h4 className="user-card__section-title">ACCOUNT</h4>
                    <div className="user-card__section-grid">
                        <div className="user-card__field">
                            <span className="user-card__field-label">E-mail</span>
                            <CopyableText
                                text={email}
                                field="email-expanded"
                                copiedField={copiedField}
                                onCopy={copyToClipboard}
                                className="user-card__field-value user-card__field-value--link"
                            />
                        </div>
                        <div className="user-card__field">
                            <span className="user-card__field-label">Username</span>
                            <CopyableText
                                text={username}
                                field="username-expanded"
                                copiedField={copiedField}
                                onCopy={copyToClipboard}
                                className="user-card__field-value user-card__field-value--link"
                            />
                        </div>
                    </div>
                </section>

                {/* Footer: Notification */}
                <div className="user-card__footer user-card__footer--expanded">
                    <div className="user-card__notification">
                        <IconButton
                            icon={<Bell size={16} />}
                            size="sm"
                            onClick={onNotificationClick}
                            aria-label="Notifications"
                        />
                    </div>
                </div>
            </div>

            {/* Sign Out Confirmation Popover - rendered via portal to escape overflow:hidden */}
            {ReactDOM.createPortal(
                <ConfirmationPopover
                    isOpen={isSignOutPopoverOpen}
                    onClose={handleSignOutCancel}
                    title={SIGN_OUT_CONFIRMATION_TITLE}
                    anchorRef={isExpanded ? signOutButtonExpandedRef : signOutButtonRef}
                    placement="bottom"
                    actions={[
                        {
                            label: 'Cancel',
                            variant: 'outline',
                            onClick: handleSignOutCancel,
                        },
                        {
                            label: 'Sign Out',
                            variant: 'destructive',
                            onClick: handleSignOutConfirm,
                            disabled: isLoggingOut,
                        },
                    ]}
                />,
                document.body
            )}
        </div>
    );
};

UserCard.propTypes = {
    /** Controls card visibility */
    isOpen: PropTypes.bool,
    /** User data object */
    user: PropTypes.shape({
        /** User's first name (required) */
        firstName: PropTypes.string.isRequired,
        /** User's last name (required) */
        lastName: PropTypes.string.isRequired,
        /** Avatar image URL */
        avatarUrl: PropTypes.string,
        /** Short description (e.g., "25 y.o. Business Analyst") */
        description: PropTypes.string,
        /** Email address (required) */
        email: PropTypes.string.isRequired,
        /** Username with @ prefix (required) */
        username: PropTypes.string.isRequired,
        /** Organization role (required) */
        orgRole: PropTypes.string.isRequired,
        /** Space role (required) */
        spaceRole: PropTypes.string.isRequired,
        /** Birthday date string */
        birthday: PropTypes.string,
        /** Location string */
        location: PropTypes.string,
        /** Job title */
        jobTitle: PropTypes.string,
        /** Department name */
        department: PropTypes.string,
    }),
    /** Callback when card should close */
    onClose: PropTypes.func,
    /** Callback when logout is clicked */
    onLogout: PropTypes.func,
    /** Callback when settings is clicked */
    onSettings: PropTypes.func,
    /** Callback when notification button is clicked */
    onNotificationClick: PropTypes.func,
    /** Reference to anchor element for positioning */
    anchorRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
    /** Whether logout is in progress */
    isLoggingOut: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default UserCard;
