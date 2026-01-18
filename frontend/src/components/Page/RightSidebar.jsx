import React, { useState } from 'react';
import {
    List,
    MessageCircle,
    Link2,
    Paperclip,
    Clock
} from 'lucide-react';
import './RightSidebar.css';

const tabs = [
    { id: 'properties', icon: List, label: 'PROPERTIES' },
    { id: 'comments', icon: MessageCircle, label: 'COMMENTS' },
    { id: 'links', icon: Link2, label: 'LINKS' },
    { id: 'files', icon: Paperclip, label: 'FILES' },
    { id: 'history', icon: Clock, label: 'HISTORY' }
];

const PropertyRow = ({ label, value, isEmpty = false }) => (
    <div className="property-row">
        <span className="property-label">{label}</span>
        <span className={`property-value ${isEmpty ? 'empty' : ''}`}>
            {isEmpty ? 'Empty' : value}
        </span>
    </div>
);

const PropertiesContent = () => (
    <div className="properties-content">
        <PropertyRow label="Status" value="Published" />
        <PropertyRow label="Author" value="Viktor Gromov" />
        <PropertyRow label="Created" value="Jan 7, 2026" />
        <PropertyRow label="Updated" value="Today 2:30 PM" />
        <PropertyRow label="Tags" value="Documentation, Guide" />
        <PropertyRow label="Category" isEmpty />
    </div>
);

const RightSidebar = () => {
    const [activeTab, setActiveTab] = useState('properties');

    const activeTabData = tabs.find(tab => tab.id === activeTab);

    const renderContent = () => {
        switch (activeTab) {
            case 'properties':
                return <PropertiesContent />;
            case 'comments':
                return <div className="tab-placeholder">No comments yet</div>;
            case 'links':
                return <div className="tab-placeholder">No links yet</div>;
            case 'files':
                return <div className="tab-placeholder">No files attached</div>;
            case 'history':
                return <div className="tab-placeholder">No history available</div>;
            default:
                return null;
        }
    };

    return (
        <aside className="right-sidebar">
            {/* Header with title and tabs */}
            <header className="sidebar-tabs-header">
                <span className="sidebar-tab-title">{activeTabData?.label}</span>
                <div className="tabs-group">
                    {tabs.map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            className={`tab-button ${activeTab === id ? 'active' : ''}`}
                            onClick={() => setActiveTab(id)}
                            aria-label={label}
                            title={label}
                        >
                            <Icon size={18} />
                        </button>
                    ))}
                </div>
            </header>

            {/* Content */}
            <div className="sidebar-tab-content">
                {renderContent()}
            </div>
        </aside>
    );
};

export default RightSidebar;
