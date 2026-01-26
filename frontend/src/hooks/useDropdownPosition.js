import { useState, useCallback, useLayoutEffect } from 'react';

/**
 * Hook for calculating dropdown position relative to a trigger element.
 * Used with Portal to position dropdowns outside overflow containers.
 *
 * @param {React.RefObject} triggerRef - Reference to the trigger element
 * @param {boolean} isOpen - Whether the dropdown is open
 * @param {Object} options - Configuration options
 * @param {string} options.placement - Preferred placement ('bottom' | 'top')
 * @param {number} options.offset - Vertical offset from trigger (default: 4)
 * @param {number} options.dropdownHeight - Estimated dropdown height for placement calculation (default: 300)
 * @returns {Object} Position styles for the dropdown
 */
const useDropdownPosition = (triggerRef, isOpen, options = {}) => {
    const { placement = 'bottom', offset = 4, dropdownHeight = 300 } = options;
    const [position, setPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
        placement: 'bottom',
    });

    const updatePosition = useCallback(() => {
        if (!triggerRef.current || !isOpen) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Determine best placement
        let actualPlacement = placement;
        if (placement === 'bottom' && spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            actualPlacement = 'top';
        } else if (placement === 'top' && spaceAbove < dropdownHeight && spaceBelow > spaceAbove) {
            actualPlacement = 'bottom';
        }

        const newPosition = {
            left: rect.left,
            width: rect.width,
            placement: actualPlacement,
        };

        if (actualPlacement === 'bottom') {
            newPosition.top = rect.bottom + offset;
        } else {
            newPosition.bottom = viewportHeight - rect.top + offset;
        }

        setPosition(newPosition);
    }, [triggerRef, isOpen, placement, offset, dropdownHeight]);

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();

            // Update on scroll and resize
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);

            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen, updatePosition]);

    return position;
};

export default useDropdownPosition;
