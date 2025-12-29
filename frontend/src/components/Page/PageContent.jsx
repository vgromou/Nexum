import React from 'react';
import {
    Heart,
    Star,
    PenLine,
    MoreHorizontal,
    ChevronsRight,
    PanelLeft,
} from 'lucide-react';
import './PageContent.css';

const PageContent = () => {
    return (
        <div className="page-content-card">
            {/* Top Navigation Bar */}
            <div className="top-nav-bar">
                <div className="breadcrumbs-area">
                    <PanelLeft size={18} className="sidebar-icon" />
                    <div className="breadcrumbs">
                        <span className="breadcrumb-link">Main</span>
                        <span className="breadcrumb-separator">&gt;</span>
                        <span className="current-page">
                            <Heart size={12} fill="black" className="text-black" />
                            <span>Page Title</span>
                        </span>
                    </div>
                </div>

                <div className="nav-actions">
                    <button className="nav-btn" aria-label="Add to favorites">
                        <Star size={18} />
                    </button>
                    <button className="nav-btn" aria-label="Edit page">
                        <PenLine size={18} />
                    </button>
                    <button className="nav-btn" aria-label="More options">
                        <MoreHorizontal size={18} />
                    </button>
                    <button className="nav-btn ml-1" aria-label="Toggle properties panel">
                        <ChevronsRight size={18} />
                    </button>
                </div>
            </div>

            {/* Main Scrollable Content Area */}
            <div className="scrollable-content">
                <div className="content-wrapper">

                    {/* Page Icon & Title */}
                    <div className="page-header">
                        <div className="page-icon-large">
                            <Heart size={48} strokeWidth={1} color="black" />
                        </div>
                        <h1 className="page-title-h1">
                            Page Title
                        </h1>
                    </div>

                    {/* Content Blocks */}
                    <div className="text-blocks">
                        <p>
                            Text Block With Simple Text Text Block With Simple Text Text Block With Simple Text Text Block With Simple Text Text Block With Simple Text Text Block With Simple Text Text Block With Simple Text Text Block With Simple Text Text Block With Simple Text
                        </p>
                    </div>

                    <div className="headings-section">
                        <h1 className="content-h1">Heading 1</h1>
                        <h2 className="content-h2">Heading 2</h2>
                        <h3 className="content-h3">Heading 3</h3>
                    </div>

                    {/* Added extra space at bottom for scrolling feel */}
                    <div className="spacer-bottom"></div>
                </div>
            </div>
        </div>
    );
};

export default PageContent;
