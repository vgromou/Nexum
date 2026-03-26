import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Portal Component
 *
 * Renders children into a DOM node outside the parent component hierarchy.
 * Useful for modals, dropdowns, and tooltips that need to escape overflow constraints.
 *
 * @example
 * <Portal>
 *   <Dropdown />
 * </Portal>
 */
const Portal = ({ children, container }) => {
    const mountNode = container || (typeof document !== 'undefined' ? document.body : null);

    if (!mountNode) return null;

    return createPortal(children, mountNode);
};

Portal.propTypes = {
    /** Content to render in the portal */
    children: PropTypes.node.isRequired,
    /** Target DOM node (defaults to document.body) */
    container: PropTypes.instanceOf(Element),
};

export default Portal;
