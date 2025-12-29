import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText } from 'lucide-react';
import './SpaceHierarchy.css';

const HierarchyItem = ({ label, children, depth = 0 }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="hierarchy-item-container">
            <div
                className="hierarchy-row"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="hierarchy-icon">
                    {children ? (
                        isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                        <span className="spacer-icon" />
                    )}
                </span>
                <FileText size={14} className="file-icon" />
                <span className="hierarchy-label">{label}</span>
            </div>
            {isOpen && children && (
                <div className="hierarchy-children">
                    {children}
                </div>
            )}
        </div>
    );
};

const SpaceHierarchy = () => {
    return (
        <div className="space-hierarchy">
            <div className="hierarchy-header">
                Space Name
            </div>
            <div className="hierarchy-content">
                <HierarchyItem label="Product Specs">
                    <HierarchyItem label="V1 Requirements" depth={1} />
                    <HierarchyItem label="Market Analysis" depth={1} />
                </HierarchyItem>
                <HierarchyItem label="Design Requirements">
                    <HierarchyItem label="Color Palette" depth={1} />
                    <HierarchyItem label="Typography" depth={1} />
                </HierarchyItem>
                <HierarchyItem label="Meeting Notes" />
                <HierarchyItem label="Team Updates" />
            </div>
        </div>
    );
};

export default SpaceHierarchy;
