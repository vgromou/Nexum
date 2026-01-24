import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Check, ChevronDown, X } from 'lucide-react';
import './Select.css';

/**
 * SelectOption component - individual item in the dropdown
 */
const SelectOption = ({ option, isSelected, isDisabled, onSelect, multiple }) => {
    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDisabled) {
            onSelect(option);
            e.currentTarget.blur();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isDisabled) {
                onSelect(option);
            }
        }
    };

    const classes = [
        'select__option',
        isSelected && 'select__option--selected',
        isDisabled && 'select__option--disabled',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classes}
            role="option"
            aria-selected={isSelected}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <span className="select__option-label">{option.label}</span>
            {isSelected && (
                <span className="select__option-check">
                    <Check size={20} />
                </span>
            )}
        </div>
    );
};

SelectOption.propTypes = {
    option: PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
    }).isRequired,
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    multiple: PropTypes.bool,
};

/**
 * Tag component for multi-select display
 */
const SelectTag = ({ label, onRemove, disabled }) => (
    <span className="select__tag">
        <span className="select__tag-label">{label}</span>
        {onRemove && !disabled && (
            <button
                type="button"
                className="select__tag-remove"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                aria-label={`Remove ${label}`}
            >
                <X size={14} />
            </button>
        )}
    </span>
);

SelectTag.propTypes = {
    label: PropTypes.string.isRequired,
    onRemove: PropTypes.func,
    disabled: PropTypes.bool,
};

/**
 * Select Component
 *
 * A dropdown select component that supports single and multi-select modes.
 * Follows the design system specifications from Figma.
 *
 * @example
 * // Single select
 * <Select
 *   options={[{ value: 1, label: 'Option 1' }]}
 *   value={1}
 *   onChange={(value) => setValue(value)}
 * />
 *
 * @example
 * // Multi-select
 * <Select
 *   multiple
 *   options={[{ value: 1, label: 'Option 1' }]}
 *   value={[1, 2]}
 *   onChange={(values) => setValues(values)}
 * />
 */
const Select = forwardRef(({
    options = [],
    value,
    onChange,
    placeholder = 'Select...',
    label,
    error,
    helper,
    disabled = false,
    required = false,
    multiple = false,
    searchable = true,
    clearable = false,
    name,
    id,
    className = '',
    menuClassName = '',
    ...rest
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolling, setIsScrolling] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const menuRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    // Generate unique ID if not provided
    const selectId = id || (name ? `select-${name}` : undefined);

    // Normalize value to array for consistent handling
    const selectedValues = multiple
        ? (Array.isArray(value) ? value : [])
        : (value !== undefined && value !== null ? [value] : []);

    // Get selected options
    const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));

    // Filter options based on search
    const filteredOptions = searchable && searchQuery
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Handle scroll to show scrollbar
    const handleMenuScroll = useCallback(() => {
        setIsScrolling(true);

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 1000);
    }, []);

    // Cleanup scroll timeout
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (disabled) return;

        switch (e.key) {
            case 'Enter':
            case ' ':
                if (!isOpen) {
                    e.preventDefault();
                    setIsOpen(true);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchQuery('');
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                break;
        }
    }, [disabled, isOpen]);

    // Handle option selection
    const handleSelect = useCallback((option) => {
        if (multiple) {
            const newValues = selectedValues.includes(option.value)
                ? selectedValues.filter(v => v !== option.value)
                : [...selectedValues, option.value];
            onChange?.(newValues);
        } else {
            onChange?.(option.value);
            setIsOpen(false);
            setSearchQuery('');
        }
    }, [multiple, selectedValues, onChange]);

    // Handle tag removal in multi-select
    const handleRemoveTag = useCallback((valueToRemove) => {
        if (multiple) {
            const newValues = selectedValues.filter(v => v !== valueToRemove);
            onChange?.(newValues);
        }
    }, [multiple, selectedValues, onChange]);

    // Handle clear all
    const handleClear = useCallback((e) => {
        e.stopPropagation();
        onChange?.(multiple ? [] : null);
    }, [multiple, onChange]);

    // Toggle dropdown
    const toggleOpen = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && searchable && inputRef.current) {
            inputRef.current.focus();
            // Move caret to end
            const len = inputRef.current.value.length;
            inputRef.current.setSelectionRange(len, len);
        }
    }, [isOpen, searchable]);

    // Determine display value
    const renderDisplayValue = () => {
        if (multiple && selectedOptions.length > 0) {
            return (
                <div className="select__tags">
                    {selectedOptions.map(opt => (
                        <SelectTag
                            key={opt.value}
                            label={opt.label}
                            onRemove={() => handleRemoveTag(opt.value)}
                            disabled={disabled}
                        />
                    ))}
                </div>
            );
        }

        if (!multiple && selectedOptions.length > 0) {
            return (
                <span className="select__value">{selectedOptions[0].label}</span>
            );
        }

        return (
            <span className="select__placeholder">{placeholder}</span>
        );
    };

    // Determine if we should show error or helper
    const showError = !!error;
    const showHelper = !showError && !!helper;

    // Build container classes
    const containerClasses = [
        'select',
        isOpen && 'select--open',
        showError && 'select--error',
        disabled && 'select--disabled',
        multiple && 'select--multiple',
        className,
    ].filter(Boolean).join(' ');

    // Build menu classes
    const menuClasses = [
        'select__menu',
        isScrolling && 'select__menu--scrolling',
        menuClassName,
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses} ref={containerRef} {...rest}>
            {label && (
                <label className="select__label" htmlFor={selectId}>
                    {label}
                    {required && <span className="select__required">*</span>}
                </label>
            )}

            <div
                ref={ref}
                className="select__trigger"
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-disabled={disabled}
                aria-labelledby={label ? selectId : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={toggleOpen}
                onKeyDown={handleKeyDown}
            >
                <div className="select__display">
                    {multiple && selectedOptions.length > 0 ? (
                        <div className="select__tags">
                            {selectedOptions.map(opt => (
                                <SelectTag
                                    key={opt.value}
                                    label={opt.label}
                                    onRemove={() => handleRemoveTag(opt.value)}
                                    disabled={disabled}
                                />
                            ))}
                            {searchable && isOpen && (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="select__search select__search--inline"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder=""
                                    onClick={(e) => e.stopPropagation()}
                                />
                            )}
                        </div>
                    ) : searchable && isOpen ? (
                        <input
                            ref={inputRef}
                            type="text"
                            className="select__search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={selectedOptions.length > 0
                                ? selectedOptions[0].label
                                : placeholder
                            }
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        renderDisplayValue()
                    )}
                </div>

                <div className="select__actions">
                    {clearable && selectedValues.length > 0 && !disabled && (
                        <button
                            type="button"
                            className="select__clear"
                            onClick={handleClear}
                            aria-label="Clear selection"
                        >
                            <X size={16} />
                        </button>
                    )}
                    <span className="select__arrow">
                        <ChevronDown size={20} />
                    </span>
                </div>
            </div>

            {isOpen && (
                <div
                    ref={menuRef}
                    className={menuClasses}
                    role="listbox"
                    aria-multiselectable={multiple}
                    onScroll={handleMenuScroll}
                >
                    {filteredOptions.length === 0 ? (
                        <div className="select__no-options">No options</div>
                    ) : (
                        filteredOptions.map((option) => (
                            <SelectOption
                                key={option.value}
                                option={option}
                                isSelected={selectedValues.includes(option.value)}
                                isDisabled={option.disabled}
                                onSelect={handleSelect}
                                multiple={multiple}
                            />
                        ))
                    )}
                </div>
            )}

            {showError && (
                <span className="select__error" id={`${selectId}-error`} role="alert">
                    {error}
                </span>
            )}
            {showHelper && (
                <span className="select__helper" id={`${selectId}-helper`}>
                    {helper}
                </span>
            )}
        </div>
    );
});

Select.displayName = 'Select';

Select.propTypes = {
    /** Array of options to display */
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
    })).isRequired,
    /** Selected value(s) - single value for select, array for multi-select */
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    ]),
    /** Change handler */
    onChange: PropTypes.func,
    /** Placeholder text when no selection */
    placeholder: PropTypes.string,
    /** Label text displayed above the select */
    label: PropTypes.string,
    /** Error message displayed below the select */
    error: PropTypes.string,
    /** Helper text displayed below the select */
    helper: PropTypes.string,
    /** Disable the select */
    disabled: PropTypes.bool,
    /** Mark field as required */
    required: PropTypes.bool,
    /** Enable multi-select mode */
    multiple: PropTypes.bool,
    /** Enable search/filter functionality */
    searchable: PropTypes.bool,
    /** Show clear button when value is selected */
    clearable: PropTypes.bool,
    /** Input name attribute */
    name: PropTypes.string,
    /** Input id attribute */
    id: PropTypes.string,
    /** Additional CSS classes for container */
    className: PropTypes.string,
    /** Additional CSS classes for dropdown menu */
    menuClassName: PropTypes.string,
};

export default Select;
