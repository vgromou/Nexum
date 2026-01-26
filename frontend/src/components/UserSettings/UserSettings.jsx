import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { User, Shield } from 'lucide-react';
import Dialog from '../Dialog';
import Button from '../Button/Button';
import UserDetailsTab from './UserDetailsTab';
import SecurityTab from './SecurityTab';
import './UserSettings.css';

/** Form ID for user details form (used for footer buttons) */
const USER_DETAILS_FORM_ID = 'user-details-form';

/**
 * UserSettings Component
 *
 * A settings dialog with two tabs: User Details and Security.
 * Uses the Dialog component with tab navigation.
 *
 * @example
 * <UserSettings
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   user={currentUser}
 *   onSave={handleSaveProfile}
 *   onChangePassword={handleChangePassword}
 * />
 */
const UserSettings = ({
    isOpen = false,
    onClose,
    user,
    onSave,
    onChangePassword,
    className = '',
}) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isFormDirty, setIsFormDirty] = useState(false);
    const userDetailsRef = useRef(null);

    const tabs = [
        { id: 'profile', icon: <User size={24} />, label: 'User Details' },
        { id: 'security', icon: <Shield size={24} />, label: 'Security' },
    ];

    const getTitle = () => {
        switch (activeTab) {
            case 'profile':
                return 'User Details';
            case 'security':
                return 'Security';
            default:
                return 'Settings';
        }
    };

    const handleDirtyChange = useCallback((isDirty) => {
        setIsFormDirty(isDirty);
    }, []);

    const handleDiscard = () => {
        userDetailsRef.current?.reset();
    };

    // Footer only for profile tab
    const footer = activeTab === 'profile' ? (
        <>
            <Button
                variant="destructive-outline"
                onClick={handleDiscard}
                disabled={!isFormDirty}
            >
                Discard
            </Button>
            <Button
                type="submit"
                form={USER_DETAILS_FORM_ID}
                variant="success"
                disabled={!isFormDirty}
            >
                Save
            </Button>
        </>
    ) : null;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            footer={footer}
            className={`user-settings ${className}`}
        >
            {activeTab === 'profile' && (
                <UserDetailsTab
                    ref={userDetailsRef}
                    user={user}
                    onSave={onSave}
                    onDirtyChange={handleDirtyChange}
                    formId={USER_DETAILS_FORM_ID}
                />
            )}
            {activeTab === 'security' && (
                <SecurityTab
                    user={user}
                    onChangePassword={onChangePassword}
                />
            )}
        </Dialog>
    );
};

UserSettings.propTypes = {
    /** Controls dialog visibility */
    isOpen: PropTypes.bool,
    /** Callback when dialog should close */
    onClose: PropTypes.func,
    /** Current user data */
    user: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        avatarUrl: PropTypes.string,
        email: PropTypes.string,
        username: PropTypes.string,
        birthday: PropTypes.string,
        location: PropTypes.string,
        jobTitle: PropTypes.string,
        department: PropTypes.string,
        orgRole: PropTypes.string,
        spaceRole: PropTypes.string,
        passwordLastChanged: PropTypes.string,
    }),
    /** Callback when profile is saved */
    onSave: PropTypes.func,
    /** Callback when password is changed */
    onChangePassword: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default UserSettings;
