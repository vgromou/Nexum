import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import './Field.css';

/**
 * Tag/Chip component for multi-select fields
 */
const FieldTag = ({ label, onRemove, disabled }) => (
    <span className="field__tag">
        <span className="field__tag-label">{label}</span>
        {onRemove && !disabled && (
            <button
                type="button"
                className="field__tag-remove"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                aria-label={`Remove ${label}`}
            >
                <X size={16} />
            </button>
        )}
    </span>
);

FieldTag.propTypes = {
    label: PropTypes.string.isRequired,
    onRemove: PropTypes.func,
    disabled: PropTypes.bool,
};

/**
 * Field Component
 *
 * A unified form field component that supports labels, placeholders, error states,
 * helper text, icons, and tags. Follows the design system specifications from Figma.
 *
 * @example
 * // Basic input
 * <Field placeholder="Paste or type" />
 *
 * @example
 * // With left icon
 * <Field leftIcon={<Search size={20} />} placeholder="Search..." />
 *
 * @example
 * // With right icon button
 * <Field rightIcon={<Calendar size={20} />} onRightIconClick={openDatePicker} />
 *
 * @example
 * // With tags (multi-select)
 * <Field tags={[{ id: 1, label: 'Tag 1' }]} onTagRemove={(id) => removeTag(id)} />
 */
const Field = forwardRef(({
    label,
    placeholder = '',
    error,
    helper,
    disabled = false,
    type = 'text',
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    name,
    id,
    autoFocus = false,
    autoComplete,
    required = false,
    readOnly = false,
    maxLength,
    minLength,
    pattern,
    className = '',
    inputClassName = '',
    // Visual mode (default or readonly)
    variant = 'default',
    // Icon props
    leftIcon,
    rightIcon,
    onRightIconClick,
    // Tags props
    tags,
    onTagRemove,
    // Custom content
    children,
    ...rest
}, ref) => {
    // Generate unique ID if not provided
    const fieldId = id || (name ? `field-${name}` : undefined);

    // Determine if we should show error or helper
    const showError = !!error;
    const showHelper = !showError && !!helper;

    // Determine if using tags mode
    const hasTagsMode = Array.isArray(tags);
    // In readonly variant, icons are hidden
    const isReadonlyVariant = variant === 'readonly';
    const hasIcons = !isReadonlyVariant && (leftIcon || rightIcon);

    // Build container classes
    const containerClasses = [
        'field',
        showError && 'field--error',
        disabled && 'field--disabled',
        variant === 'readonly' && 'field--readonly',
        className
    ].filter(Boolean).join(' ');

    // Build input wrapper classes
    const wrapperClasses = [
        'field__input-wrapper',
        leftIcon && 'field__input-wrapper--has-left-icon',
        rightIcon && 'field__input-wrapper--has-right-icon',
        hasTagsMode && 'field__input-wrapper--tags',
    ].filter(Boolean).join(' ');

    // Build input classes
    const inputClasses = [
        'field__input',
        hasIcons && 'field__input--with-icons',
        hasTagsMode && 'field__input--tags',
        inputClassName
    ].filter(Boolean).join(' ');

    // Render the input or custom children
    const renderInput = () => {
        if (children) {
            return children;
        }

        return (
            <input
                ref={ref}
                type={type}
                id={fieldId}
                name={name}
                className={inputClasses}
                placeholder={placeholder}
                disabled={disabled}
                value={value}
                defaultValue={defaultValue}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                autoFocus={autoFocus}
                autoComplete={autoComplete}
                required={required}
                readOnly={readOnly}
                maxLength={maxLength}
                minLength={minLength}
                pattern={pattern}
                aria-invalid={showError ? 'true' : undefined}
                aria-describedby={
                    showError ? `${fieldId}-error` :
                    showHelper ? `${fieldId}-helper` :
                    undefined
                }
                {...rest}
            />
        );
    };

    // Render tags content
    const renderTagsContent = () => (
        <div className="field__tags-container">
            {tags.map((tag) => (
                <FieldTag
                    key={tag.id}
                    label={tag.label}
                    onRemove={onTagRemove ? () => onTagRemove(tag.id) : undefined}
                    disabled={disabled}
                />
            ))}
        </div>
    );

    // If no icons and no tags, render simple input
    if (!hasIcons && !hasTagsMode) {
        return (
            <div className={containerClasses}>
                {label && (
                    <label className="field__label" htmlFor={fieldId}>
                        {label}
                        {required && <span className="field__required">*</span>}
                    </label>
                )}
                {renderInput()}
                {showError && (
                    <span className="field__error" id={`${fieldId}-error`} role="alert">
                        {error}
                    </span>
                )}
                {showHelper && (
                    <span className="field__helper" id={`${fieldId}-helper`}>
                        {helper}
                    </span>
                )}
            </div>
        );
    }

    // Render with icons and/or tags
    return (
        <div className={containerClasses}>
            {label && (
                <label className="field__label" htmlFor={fieldId}>
                    {label}
                    {required && <span className="field__required">*</span>}
                </label>
            )}
            <div className={wrapperClasses}>
                {leftIcon && (
                    <span className="field__icon field__icon--left">
                        {leftIcon}
                    </span>
                )}
                {hasTagsMode ? renderTagsContent() : renderInput()}
                {rightIcon && (
                    onRightIconClick ? (
                        <button
                            type="button"
                            className="field__icon-button field__icon-button--right"
                            onClick={onRightIconClick}
                            disabled={disabled}
                            tabIndex={-1}
                        >
                            {rightIcon}
                        </button>
                    ) : (
                        <span className="field__icon field__icon--right">
                            {rightIcon}
                        </span>
                    )
                )}
            </div>
            {showError && (
                <span className="field__error" id={`${fieldId}-error`} role="alert">
                    {error}
                </span>
            )}
            {showHelper && (
                <span className="field__helper" id={`${fieldId}-helper`}>
                    {helper}
                </span>
            )}
        </div>
    );
});

Field.displayName = 'Field';

Field.propTypes = {
    /** Label text displayed above the input */
    label: PropTypes.string,
    /** Placeholder text for the input */
    placeholder: PropTypes.string,
    /** Error message displayed below the input (takes precedence over helper) */
    error: PropTypes.string,
    /** Helper text displayed below the input */
    helper: PropTypes.string,
    /** Disable the input */
    disabled: PropTypes.bool,
    /** Input type */
    type: PropTypes.oneOf(['text', 'email', 'password', 'number', 'tel', 'url', 'search']),
    /** Controlled input value */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Default value for uncontrolled input */
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Change handler */
    onChange: PropTypes.func,
    /** Focus handler */
    onFocus: PropTypes.func,
    /** Blur handler */
    onBlur: PropTypes.func,
    /** Keydown handler */
    onKeyDown: PropTypes.func,
    /** Input name attribute */
    name: PropTypes.string,
    /** Input id attribute */
    id: PropTypes.string,
    /** Auto-focus on mount */
    autoFocus: PropTypes.bool,
    /** Autocomplete attribute */
    autoComplete: PropTypes.string,
    /** Mark field as required */
    required: PropTypes.bool,
    /** Make input read-only */
    readOnly: PropTypes.bool,
    /** Maximum character length */
    maxLength: PropTypes.number,
    /** Minimum character length */
    minLength: PropTypes.number,
    /** Validation pattern */
    pattern: PropTypes.string,
    /** Additional CSS classes for container */
    className: PropTypes.string,
    /** Additional CSS classes for input */
    inputClassName: PropTypes.string,
    /** Visual mode - 'default' (white bg, border) or 'readonly' (transparent, flat) */
    variant: PropTypes.oneOf(['default', 'readonly']),
    /** Icon element to display on the left side of input */
    leftIcon: PropTypes.element,
    /** Icon element to display on the right side of input */
    rightIcon: PropTypes.element,
    /** Click handler for right icon (makes it a button) */
    onRightIconClick: PropTypes.func,
    /** Array of tags for multi-select mode */
    tags: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
    })),
    /** Handler called when a tag is removed */
    onTagRemove: PropTypes.func,
    /** Custom content to render instead of input */
    children: PropTypes.node,
};

export default Field;
