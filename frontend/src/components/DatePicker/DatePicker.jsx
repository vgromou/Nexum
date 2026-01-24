import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import './DatePicker.css';

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Get days in month
 */
const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

/**
 * Get first day of month (0 = Sunday, 1 = Monday, etc.)
 * Adjusted for Monday start
 */
const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert to Monday = 0
};

/**
 * Check if two dates are the same day
 */
const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
};

/**
 * Check if date is between two dates
 */
const isInRange = (date, start, end) => {
    if (!date || !start || !end) return false;
    const time = date.getTime();
    return time > start.getTime() && time < end.getTime();
};

/**
 * Format date to string
 */
const formatDate = (date, format = 'DD.MM.YYYY') => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return format
        .replace('DD', day)
        .replace('MM', month)
        .replace('YYYY', year);
};

/**
 * Parse date string to Date object
 */
const parseDate = (str, format = 'DD.MM.YYYY') => {
    if (!str) return null;

    const parts = str.split(/[.\-\/]/);
    if (parts.length !== 3) return null;

    let day, month, year;

    if (format.startsWith('DD')) {
        [day, month, year] = parts;
    } else if (format.startsWith('MM')) {
        [month, day, year] = parts;
    } else {
        [year, month, day] = parts;
    }

    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
};

/**
 * DatePicker Component
 */
const DatePicker = forwardRef(({
    value,
    onChange,
    rangeStart,
    rangeEnd,
    onRangeChange,
    placeholder = 'DD.MM.YYYY',
    label,
    error,
    helper,
    disabled = false,
    required = false,
    minDate,
    maxDate,
    format = 'DD.MM.YYYY',
    isRange = false,
    name,
    id,
    className = '',
    ...rest
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('days'); // 'days', 'months', 'years'
    const [viewDate, setViewDate] = useState(() => value || new Date());
    const [inputValue, setInputValue] = useState('');
    const [rangeInputStart, setRangeInputStart] = useState('');
    const [rangeInputEnd, setRangeInputEnd] = useState('');

    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const pickerId = id || (name ? `datepicker-${name}` : undefined);
    const today = new Date();

    // Update input value when value prop changes
    useEffect(() => {
        if (!isRange && value) {
            setInputValue(formatDate(value, format));
        }
    }, [value, format, isRange]);

    // Update range inputs when range props change
    useEffect(() => {
        if (isRange) {
            setRangeInputStart(rangeStart ? formatDate(rangeStart, format) : '');
            setRangeInputEnd(rangeEnd ? formatDate(rangeEnd, format) : '');
        }
    }, [rangeStart, rangeEnd, format, isRange]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setView('days');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Navigation handlers
    const goToPrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const goToPrevYear = () => {
        setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
    };

    const goToNextYear = () => {
        setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
    };

    const goToPrevDecade = () => {
        setViewDate(new Date(viewDate.getFullYear() - 12, viewDate.getMonth(), 1));
    };

    const goToNextDecade = () => {
        setViewDate(new Date(viewDate.getFullYear() + 12, viewDate.getMonth(), 1));
    };

    // Selection handlers
    const handleDayClick = (day) => {
        const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

        if (isRange) {
            if (!rangeStart || (rangeStart && rangeEnd)) {
                onRangeChange?.(selectedDate, null);
            } else {
                if (selectedDate < rangeStart) {
                    onRangeChange?.(selectedDate, rangeStart);
                } else {
                    onRangeChange?.(rangeStart, selectedDate);
                }
            }
        } else {
            onChange?.(selectedDate);
        }
        setView('days');
    };

    const handleMonthClick = (monthIndex) => {
        setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
        setView('days');
    };

    const handleYearClick = (year) => {
        setViewDate(new Date(year, viewDate.getMonth(), 1));
        setView('months');
    };

    // Input change handler
    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);

        const parsed = parseDate(val, format);
        if (parsed) {
            onChange?.(parsed);
            setViewDate(parsed);
        }
    };

    // Check if date is disabled
    const isDateDisabled = (date) => {
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        return false;
    };

    // Render calendar header
    const renderHeader = () => {
        let title = '';
        let onPrev, onNext;

        if (view === 'days') {
            title = `${MONTHS_FULL[viewDate.getMonth()]}, ${viewDate.getFullYear()}`;
            onPrev = goToPrevMonth;
            onNext = goToNextMonth;
        } else if (view === 'months') {
            title = `${viewDate.getFullYear()}`;
            onPrev = goToPrevYear;
            onNext = goToNextYear;
        } else {
            const startYear = Math.floor(viewDate.getFullYear() / 12) * 12;
            title = `${startYear}-${startYear + 11}`;
            onPrev = goToPrevDecade;
            onNext = goToNextDecade;
        }

        return (
            <div className="datepicker__header">
                <button
                    type="button"
                    className="datepicker__nav-btn"
                    onClick={onPrev}
                    aria-label="Previous"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    type="button"
                    className="datepicker__title"
                    onClick={() => {
                        if (view === 'days') setView('months');
                        else if (view === 'months') setView('years');
                    }}
                >
                    {title}
                </button>
                <button
                    type="button"
                    className="datepicker__nav-btn"
                    onClick={onNext}
                    aria-label="Next"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        );
    };

    // Render days view
    const renderDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Days from previous month
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

        for (let i = 0; i < firstDay; i++) {
            const day = daysInPrevMonth - firstDay + 1 + i;
            const date = new Date(prevYear, prevMonth, day);
            const isRangeStart = isRange && isSameDay(date, rangeStart);
            const isRangeEnd = isRange && isSameDay(date, rangeEnd);
            const isInRangeDay = isRange && isInRange(date, rangeStart, rangeEnd);

            const dayClasses = [
                'datepicker__day',
                'datepicker__day--other-month',
                isRangeStart && 'datepicker__day--range-start',
                isRangeEnd && 'datepicker__day--range-end',
                isInRangeDay && 'datepicker__day--in-range',
            ].filter(Boolean).join(' ');

            days.push(
                <div key={`prev-${i}`} className={dayClasses}>
                    {day}
                </div>
            );
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = isSameDay(date, today);
            const isSelected = !isRange && isSameDay(date, value);
            const isRangeStart = isRange && isSameDay(date, rangeStart);
            const isRangeEnd = isRange && isSameDay(date, rangeEnd);
            const isInRangeDay = isRange && isInRange(date, rangeStart, rangeEnd);
            const isDisabled = isDateDisabled(date);

            const isRangeSingle = isRangeStart && (!rangeEnd || isSameDay(rangeStart, rangeEnd));

            const dayClasses = [
                'datepicker__day',
                isToday && 'datepicker__day--today',
                isSelected && 'datepicker__day--selected',
                isRangeStart && 'datepicker__day--range-start',
                isRangeEnd && 'datepicker__day--range-end',
                isRangeSingle && 'datepicker__day--range-single',
                isInRangeDay && 'datepicker__day--in-range',
                isDisabled && 'datepicker__day--disabled',
            ].filter(Boolean).join(' ');

            days.push(
                <button
                    key={day}
                    type="button"
                    className={dayClasses}
                    onClick={() => !isDisabled && handleDayClick(day)}
                    disabled={isDisabled}
                >
                    {day}
                </button>
            );
        }

        // Days from next month to fill remaining cells (6 rows x 7 = 42 total)
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const totalCells = 42;
        const remainingCells = totalCells - days.length;

        for (let i = 1; i <= remainingCells; i++) {
            const date = new Date(nextYear, nextMonth, i);
            const isRangeStart = isRange && isSameDay(date, rangeStart);
            const isRangeEnd = isRange && isSameDay(date, rangeEnd);
            const isInRangeDay = isRange && isInRange(date, rangeStart, rangeEnd);

            const dayClasses = [
                'datepicker__day',
                'datepicker__day--other-month',
                isRangeStart && 'datepicker__day--range-start',
                isRangeEnd && 'datepicker__day--range-end',
                isInRangeDay && 'datepicker__day--in-range',
            ].filter(Boolean).join(' ');

            days.push(
                <div key={`next-${i}`} className={dayClasses}>
                    {i}
                </div>
            );
        }

        return (
            <div className="datepicker__days">
                <div className="datepicker__weekdays">
                    {DAYS_OF_WEEK.map((day, i) => (
                        <div key={i} className="datepicker__weekday">{day}</div>
                    ))}
                </div>
                <div className="datepicker__days-grid">
                    {days}
                </div>
            </div>
        );
    };

    // Render months view
    const renderMonths = () => {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const selectedMonth = value?.getMonth();
        const selectedYear = value?.getFullYear();

        return (
            <div className="datepicker__months-grid">
                {MONTHS.map((month, index) => {
                    const isCurrentMonth = index === currentMonth && viewDate.getFullYear() === currentYear;
                    const isSelected = index === selectedMonth && viewDate.getFullYear() === selectedYear;

                    const monthClasses = [
                        'datepicker__month',
                        isCurrentMonth && 'datepicker__month--current',
                        isSelected && 'datepicker__month--selected',
                    ].filter(Boolean).join(' ');

                    return (
                        <button
                            key={month}
                            type="button"
                            className={monthClasses}
                            onClick={() => handleMonthClick(index)}
                        >
                            {month}
                        </button>
                    );
                })}
            </div>
        );
    };

    // Render years view
    const renderYears = () => {
        const startYear = Math.floor(viewDate.getFullYear() / 12) * 12;
        const currentYear = today.getFullYear();
        const selectedYear = value?.getFullYear();
        const years = [];

        for (let i = 0; i < 12; i++) {
            const year = startYear + i;
            const isCurrentYear = year === currentYear;
            const isSelected = year === selectedYear;

            const yearClasses = [
                'datepicker__year',
                isCurrentYear && 'datepicker__year--current',
                isSelected && 'datepicker__year--selected',
            ].filter(Boolean).join(' ');

            years.push(
                <button
                    key={year}
                    type="button"
                    className={yearClasses}
                    onClick={() => handleYearClick(year)}
                >
                    {year}
                </button>
            );
        }

        return (
            <div className="datepicker__years-grid">
                {years}
            </div>
        );
    };

    const showError = !!error;
    const showHelper = !showError && !!helper;

    const containerClasses = [
        'datepicker',
        isOpen && 'datepicker--open',
        showError && 'datepicker--error',
        disabled && 'datepicker--disabled',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses} ref={containerRef} {...rest}>
            {label && (
                <label className="datepicker__label" htmlFor={pickerId}>
                    {label}
                    {required && <span className="datepicker__required">*</span>}
                </label>
            )}

            <div
                ref={ref}
                className="datepicker__trigger"
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {isRange ? (
                    <div className="datepicker__range-display">
                        <span className={rangeStart ? 'datepicker__value' : 'datepicker__placeholder'}>
                            {rangeStart ? formatDate(rangeStart, format) : placeholder}
                        </span>
                        <div className="datepicker__range-divider" />
                        <span className={rangeEnd ? 'datepicker__value' : 'datepicker__placeholder'}>
                            {rangeEnd ? formatDate(rangeEnd, format) : placeholder}
                        </span>
                    </div>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        id={pickerId}
                        name={name}
                        className="datepicker__input"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
                <button
                    type="button"
                    className="datepicker__icon-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) setIsOpen(!isOpen);
                    }}
                    disabled={disabled}
                    tabIndex={-1}
                >
                    <Calendar size={20} />
                </button>
            </div>

            {isOpen && (
                <div className="datepicker__dropdown">
                    {renderHeader()}
                    {view === 'days' && renderDays()}
                    {view === 'months' && renderMonths()}
                    {view === 'years' && renderYears()}
                </div>
            )}

            {showError && (
                <span className="datepicker__error" role="alert">
                    {error}
                </span>
            )}
            {showHelper && (
                <span className="datepicker__helper">
                    {helper}
                </span>
            )}
        </div>
    );
});

DatePicker.displayName = 'DatePicker';

DatePicker.propTypes = {
    /** Selected date value */
    value: PropTypes.instanceOf(Date),
    /** Change handler for single date */
    onChange: PropTypes.func,
    /** Range start date */
    rangeStart: PropTypes.instanceOf(Date),
    /** Range end date */
    rangeEnd: PropTypes.instanceOf(Date),
    /** Change handler for date range */
    onRangeChange: PropTypes.func,
    /** Placeholder text */
    placeholder: PropTypes.string,
    /** Label text */
    label: PropTypes.string,
    /** Error message */
    error: PropTypes.string,
    /** Helper text */
    helper: PropTypes.string,
    /** Disable the picker */
    disabled: PropTypes.bool,
    /** Mark as required */
    required: PropTypes.bool,
    /** Minimum selectable date */
    minDate: PropTypes.instanceOf(Date),
    /** Maximum selectable date */
    maxDate: PropTypes.instanceOf(Date),
    /** Date format string */
    format: PropTypes.string,
    /** Enable range selection mode */
    isRange: PropTypes.bool,
    /** Input name */
    name: PropTypes.string,
    /** Input id */
    id: PropTypes.string,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default DatePicker;
