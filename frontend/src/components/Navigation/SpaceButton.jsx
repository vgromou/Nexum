import React from 'react';
import PropTypes from 'prop-types';
import { Search } from 'lucide-react';
import './SpaceButton.css';

/**
 * SpaceButton - Interactive button for space selection
 * Features hover state and integrated search button
 */
const SpaceButton = ({
    icon,
    name = 'Space Name',
    onSpaceClick,
    onSearchClick
}) => {
    return (
        <div className="space-button-container">
            <button
                className="space-button"
                onClick={onSpaceClick}
                aria-label={`Switch to ${name} space`}
            >
                <div className="space-info">
                    <div className="space-icon">
                        {icon}
                    </div>
                    <span className="space-name">{name}</span>
                </div>
                <button
                    className="icon-btn icon-btn-md space-search-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSearchClick?.();
                    }}
                    aria-label="Search in space"
                >
                    <Search />
                </button>
            </button>
        </div>
    );
};

SpaceButton.propTypes = {
    icon: PropTypes.node.isRequired,
    name: PropTypes.string,
    onSpaceClick: PropTypes.func,
    onSearchClick: PropTypes.func,
};

export default SpaceButton;
