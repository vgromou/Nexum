import React from 'react';
import PropTypes from 'prop-types';
import './RoleBadge.css';

/**
 * RoleBadge Component
 *
 * Displays a user role badge with optional scope label (Organization or Space).
 * Two variants: with label showing the scope, or without label showing just the role.
 *
 * @example
 * // Badge without label
 * <RoleBadge role="Admin" />
 *
 * @example
 * // Badge with organization scope
 * <RoleBadge role="Member" scope="organization" showLabel />
 *
 * @example
 * // Badge with space scope
 * <RoleBadge role="Admin" scope="space" showLabel />
 */
const RoleBadge = ({
    role,
    scope = 'organization',
    showLabel = false,
    className = '',
}) => {
    const scopeLabel = scope === 'space' ? 'Space' : 'Organization';

    const badgeClasses = [
        'role-badge',
        scope === 'space' && 'role-badge--space',
        className
    ].filter(Boolean).join(' ');

    if (showLabel) {
        return (
            <div className={`role-badge-container ${className}`}>
                <span className="role-badge__label">{scopeLabel}</span>
                <span className={badgeClasses}>{role}</span>
            </div>
        );
    }

    return (
        <span className={badgeClasses}>{role}</span>
    );
};

RoleBadge.propTypes = {
    /** The role name to display (e.g., "Admin", "Member") */
    role: PropTypes.string.isRequired,
    /** The scope of the role */
    scope: PropTypes.oneOf(['organization', 'space']),
    /** Whether to show the scope label above the badge */
    showLabel: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default RoleBadge;
