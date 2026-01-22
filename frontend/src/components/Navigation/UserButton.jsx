import React from 'react';
import PropTypes from 'prop-types';
import { Bell } from 'lucide-react';
import './UserButton.css';

/**
 * UserButton - Interactive button for user profile
 * Features hover state and integrated notification button
 */
const UserButton = ({
    avatarUrl,
    name = 'User Name',
    role = 'Role',
    onUserClick,
    onNotificationClick
}) => {
    return (
        <div className="user-button-container">
            <button
                className="user-button"
                onClick={onUserClick}
                aria-label={`User profile: ${name}`}
            >
                <div className="user-avatar">
                    <img
                        src={avatarUrl}
                        alt={name}
                    />
                </div>
                <div className="user-info">
                    <span className="user-name">{name}</span>
                    <span className="user-role">{role}</span>
                </div>
                <button
                    className="icon-btn icon-btn-md user-notification-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNotificationClick?.();
                    }}
                    aria-label="Notifications"
                >
                    <Bell />
                </button>
            </button>
        </div>
    );
};

UserButton.propTypes = {
    avatarUrl: PropTypes.string.isRequired,
    name: PropTypes.string,
    role: PropTypes.string,
    onUserClick: PropTypes.func,
    onNotificationClick: PropTypes.func,
};

export default UserButton;
