import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { AtSign } from 'lucide-react';
import Field from '../Field';
import Select from '../Select';
import DatePicker from '../DatePicker';
import RoleBadge from '../RoleBadge';
import './UserDetailsTab.css';

/**
 * Parse date string (DD.MM.YYYY) to Date object
 */
const parseDate = (str) => {
    if (!str) return null;
    const parts = str.split('.');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Format Date object to string (DD.MM.YYYY)
 */
const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

// Mock options - in real app these would come from API
const JOB_TITLE_OPTIONS = [
    { value: 'system_analyst', label: 'System Analyst' },
    { value: 'business_analyst', label: 'Business Analyst' },
    { value: 'developer', label: 'Developer' },
    { value: 'designer', label: 'Designer' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'qa_engineer', label: 'QA Engineer' },
];

const DEPARTMENT_OPTIONS = [
    { value: 'system_analysis', label: 'System Analysis Department' },
    { value: 'development', label: 'Development Department' },
    { value: 'design', label: 'Design Department' },
    { value: 'qa', label: 'QA Department' },
    { value: 'management', label: 'Management' },
];

/**
 * Get initial form data from user object
 */
const getInitialData = (user) => ({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    birthday: user?.birthday || '',
    location: user?.location || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    email: user?.email || '',
    username: user?.username?.replace('@', '') || '',
});

/**
 * Check if two form data objects are equal
 */
const isFormDataEqual = (a, b) => {
    return Object.keys(a).every(key => a[key] === b[key]);
};

/**
 * UserDetailsTab Component
 *
 * Profile editing form with personal, work, and account sections.
 * Exposes reset() method via ref for external control.
 */
const UserDetailsTab = forwardRef(({
    user,
    onSave,
    onDirtyChange,
    formId,
}, ref) => {
    const [initialData, setInitialData] = useState(() => getInitialData(user));
    const [formData, setFormData] = useState(() => getInitialData(user));

    // Initialize form with user data
    useEffect(() => {
        const newInitialData = getInitialData(user);
        setInitialData(newInitialData);
        setFormData(newInitialData);
    }, [user]);

    // Check if form is dirty
    const isDirty = !isFormDataEqual(formData, initialData);

    // Notify parent about dirty state changes
    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    // Expose reset method via ref
    useImperativeHandle(ref, () => ({
        reset: () => {
            setFormData(initialData);
        },
        applyChanges: () => {
            // Update initial data to current form data (marks as "saved")
            setInitialData(formData);
        },
    }), [initialData, formData]);

    const handleChange = useCallback((field) => (e) => {
        const value = e.target ? e.target.value : e;
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            username: formData.username.startsWith('@') ? formData.username : `@${formData.username}`,
        };
        onSave?.(dataToSave);
        // Mark current data as the new "saved" state
        setInitialData(formData);
    };

    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';

    return (
        <form id={formId} className="user-details-tab" onSubmit={handleSubmit}>
            {/* Profile Header */}
            <div className="user-details-tab__header">
                <div className="user-details-tab__avatar">
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={fullName} />
                    ) : (
                        <div className="user-details-tab__avatar-placeholder" />
                    )}
                </div>
                <div className="user-details-tab__info">
                    <h3 className="user-details-tab__name">{fullName}</h3>
                    <div className="user-details-tab__roles">
                        {user?.orgRole && <RoleBadge role={user.orgRole} scope="organization" />}
                        {user?.spaceRole && <RoleBadge role={user.spaceRole} scope="space" />}
                    </div>
                </div>
            </div>

            {/* Personal Section */}
            <section className="user-details-tab__section">
                <h4 className="user-details-tab__section-title">PERSONAL</h4>
                <div className="user-details-tab__grid">
                    <Field
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange('firstName')}
                        placeholder="Enter first name"
                    />
                    <Field
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange('lastName')}
                        placeholder="Enter last name"
                    />
                    <DatePicker
                        label="Birthday"
                        name="birthday"
                        value={parseDate(formData.birthday)}
                        onChange={(date) => handleChange('birthday')(formatDate(date))}
                        placeholder="DD.MM.YYYY"
                    />
                    <Field
                        label="Location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange('location')}
                        placeholder="Enter location"
                    />
                </div>
            </section>

            {/* Work Section */}
            <section className="user-details-tab__section">
                <h4 className="user-details-tab__section-title">WORK</h4>
                <div className="user-details-tab__grid">
                    <Select
                        label="Job Title"
                        name="jobTitle"
                        options={JOB_TITLE_OPTIONS}
                        value={formData.jobTitle}
                        onChange={handleChange('jobTitle')}
                        placeholder="Select job title"
                    />
                    <Select
                        label="Department"
                        name="department"
                        options={DEPARTMENT_OPTIONS}
                        value={formData.department}
                        onChange={handleChange('department')}
                        placeholder="Select department"
                    />
                </div>
            </section>

            {/* Account Section */}
            <section className="user-details-tab__section">
                <h4 className="user-details-tab__section-title">ACCOUNT</h4>
                <div className="user-details-tab__grid">
                    <Field
                        label="E-mail"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange('email')}
                        placeholder="Enter email"
                    />
                    <Field
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange('username')}
                        placeholder="username"
                        leftIcon={<AtSign size={20} />}
                    />
                </div>
            </section>
        </form>
    );
});

UserDetailsTab.displayName = 'UserDetailsTab';

UserDetailsTab.propTypes = {
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
    }),
    /** Callback when form is submitted */
    onSave: PropTypes.func,
    /** Callback when dirty state changes */
    onDirtyChange: PropTypes.func,
    /** Form ID for external submit button */
    formId: PropTypes.string,
};

export default UserDetailsTab;
