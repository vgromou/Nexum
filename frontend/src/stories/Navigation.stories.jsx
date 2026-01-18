import React from 'react';
import LeftSidebar from '../components/Navigation/LeftSidebar';
import ActivityBar from '../components/Navigation/ActivityBar';
import SpaceHierarchy from '../components/Navigation/SpaceHierarchy';
import '../components/Navigation/LeftSidebar.css';
import '../components/Navigation/ActivityBar.css';
import '../components/Navigation/SpaceHierarchy.css';

export default {
  title: 'Components/Navigation',
  parameters: {
    layout: 'fullscreen',
  },
};

export const LeftSidebarStory = {
  name: 'Left Sidebar',
  render: () => (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--background-tertiary)' }}>
      <LeftSidebar />
      <div style={{ flex: 1, padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Left Sidebar</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Main navigation sidebar with page hierarchy, collections, and user info.
        </p>
        <ul style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.8 }}>
          <li>Space selector with emoji</li>
          <li>Search button</li>
          <li>Standard pages (News, Glossary)</li>
          <li>Collection divider with editable name</li>
          <li>Expandable page hierarchy</li>
          <li>Collection switcher (PAGES, PRD, SPEC, etc.)</li>
          <li>User profile footer</li>
        </ul>
      </div>
    </div>
  ),
};

export const ActivityBarStory = {
  name: 'Activity Bar',
  render: () => (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--background-tertiary)' }}>
      <ActivityBar />
      <div style={{ flex: 1, padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Activity Bar</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Vertical activity/workspace bar on the left side.
        </p>
        <ul style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.8 }}>
          <li>Workspace list with color indicators</li>
          <li>Add workspace button</li>
          <li>Notifications button</li>
          <li>User profile button</li>
        </ul>
      </div>
    </div>
  ),
};

export const SpaceHierarchyStory = {
  name: 'Space Hierarchy',
  render: () => (
    <div style={{ padding: '24px', maxWidth: '300px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Space Hierarchy</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
        Collapsible tree view of pages within a space.
      </p>
      <SpaceHierarchy />
    </div>
  ),
};

export const PageItemVariants = {
  name: 'Page Item Variants',
  render: () => {
    const PageItemDemo = ({ emoji, label, isActive, hasChildren, isExpanded, depth = 0 }) => {
      const paddingLeft = 16 + depth * 20;
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px',
            paddingLeft: `${paddingLeft}px`,
            borderRadius: '6px',
            backgroundColor: isActive ? 'var(--background-active)' : 'transparent',
            cursor: 'pointer',
          }}
        >
          {hasChildren && (
            <span style={{ color: 'var(--icons-default)', width: '16px' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span style={{ fontSize: '16px' }}>{emoji}</span>
          <span style={{
            flex: 1,
            fontSize: '14px',
            color: 'var(--text-primary)',
            fontWeight: isActive ? 500 : 400,
          }}>
            {label}
          </span>
          <span style={{ color: 'var(--icons-default)' }}>⋮</span>
        </div>
      );
    };

    return (
      <div style={{ padding: '24px', maxWidth: '300px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Page Item Variants</h2>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Default</h3>
          <PageItemDemo emoji="📄" label="Page title" />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Active</h3>
          <PageItemDemo emoji="💙" label="Active page" isActive />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>With Children (Expanded)</h3>
          <PageItemDemo emoji="📁" label="Parent page" hasChildren isExpanded />
          <PageItemDemo emoji="📄" label="Child page" depth={1} />
          <PageItemDemo emoji="📄" label="Child page" depth={1} />
        </div>

        <div>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>With Children (Collapsed)</h3>
          <PageItemDemo emoji="📁" label="Parent page" hasChildren isExpanded={false} />
        </div>
      </div>
    );
  },
};

export const CollectionSwitcher = {
  name: 'Collection Switcher',
  render: () => {
    const collections = ['PAGES', 'PRD', 'SPEC', 'FR', 'API'];
    const [active, setActive] = React.useState('PAGES');

    return (
      <div style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Collection Switcher</h2>

        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '6px',
          width: 'fit-content',
        }}>
          {collections.map((key) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: active === key ? 'var(--background-active)' : 'transparent',
                color: active === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {key}
            </button>
          ))}
        </div>

        <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Click to switch between collections. Current: <strong>{active}</strong>
        </p>
      </div>
    );
  },
};
