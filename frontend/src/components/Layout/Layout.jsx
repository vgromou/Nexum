import React from 'react';
import ActivityBar from '../Navigation/ActivityBar';
import SpaceHierarchy from '../Navigation/SpaceHierarchy';
import PageContent from '../Page/PageContent';
import PropertiesBar from '../Page/PropertiesBar';
import './Layout.css';

const Layout = () => {
    return (
        <div className="layout-container">
            <ActivityBar />
            <SpaceHierarchy />
            <PageContent />
            <PropertiesBar />
        </div>
    );
};

export default Layout;
