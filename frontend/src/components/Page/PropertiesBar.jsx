import React from 'react';
import './PropertiesBar.css';

const PropertiesBar = () => {
    return (
        <div className="properties-bar">
            {/* Placeholder for properties content */}
            <div className="properties-header">Property</div>
            <div className="property-row">
                <span className="prop-label">Created by</span>
                <span className="prop-value">User Name</span>
            </div>
            <div className="property-row">
                <span className="prop-label">Last edited</span>
                <span className="prop-value">Today 2:30 PM</span>
            </div>
            <div className="property-row">
                <span className="prop-label">Tags</span>
                <span className="prop-value badge">Design</span>
            </div>
        </div>
    );
};

export default PropertiesBar;
