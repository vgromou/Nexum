import React from 'react';
import LeftSidebar from '../Navigation/LeftSidebar';
import PageContent from '../Page/PageContent';
import RightSidebar from '../Page/RightSidebar';
import './Layout.css';

const Layout = () => {
    return (
        <div className="layout-container">
            <LeftSidebar />
            <div className="content-block">
                <PageContent />
                <RightSidebar />
            </div>
        </div>
    );
};

export default Layout;
