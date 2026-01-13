import React from 'react';

export default {
  title: 'Design System/Colors',
  parameters: {
    layout: 'fullscreen',
  },
};

const ColorSwatch = ({ name, cssVar, showBorder = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        backgroundColor: `var(${cssVar})`,
        border: showBorder ? '1px solid var(--border-default)' : 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    />
    <div>
      <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>{name}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-family-mono)' }}>{cssVar}</div>
    </div>
  </div>
);

const ColorSection = ({ title, colors }) => (
  <div style={{ marginBottom: '32px' }}>
    <h3 style={{
      fontSize: '18px',
      fontWeight: 600,
      marginBottom: '16px',
      color: 'var(--text-primary)',
      borderBottom: '1px solid var(--border-default)',
      paddingBottom: '8px'
    }}>
      {title}
    </h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
      {colors.map(({ name, cssVar, showBorder }) => (
        <ColorSwatch key={cssVar} name={name} cssVar={cssVar} showBorder={showBorder} />
      ))}
    </div>
  </div>
);

const ColorsPage = () => (
  <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
      Color System
    </h1>
    <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
      Complete color palette used throughout the application.
    </p>

    <ColorSection
      title="Background Colors"
      colors={[
        { name: 'Primary', cssVar: '--background-primary', showBorder: true },
        { name: 'Secondary', cssVar: '--background-secondary' },
        { name: 'Tertiary', cssVar: '--background-tertiary' },
        { name: 'Hover', cssVar: '--background-hover' },
        { name: 'Active', cssVar: '--background-active' },
      ]}
    />

    <ColorSection
      title="Text Colors"
      colors={[
        { name: 'Primary', cssVar: '--text-primary' },
        { name: 'Secondary', cssVar: '--text-secondary' },
        { name: 'Tertiary', cssVar: '--text-tertiary' },
        { name: 'Placeholder', cssVar: '--text-placeholder' },
        { name: 'Disabled', cssVar: '--text-disabled' },
        { name: 'Link', cssVar: '--text-link' },
        { name: 'Link Hover', cssVar: '--text-link-hover' },
      ]}
    />

    <ColorSection
      title="Border Colors"
      colors={[
        { name: 'Default', cssVar: '--border-default' },
        { name: 'Light', cssVar: '--border-light' },
        { name: 'Medium', cssVar: '--border-medium' },
        { name: 'Strong', cssVar: '--border-strong' },
        { name: 'Focus', cssVar: '--border-focus' },
      ]}
    />

    <ColorSection
      title="Accent Colors"
      colors={[
        { name: 'Primary', cssVar: '--accent-primary' },
        { name: 'Primary Hover', cssVar: '--accent-primary-hover' },
        { name: 'Primary Active', cssVar: '--accent-primary-active' },
        { name: 'Primary Light', cssVar: '--accent-primary-light' },
        { name: 'Secondary', cssVar: '--accent-secondary' },
        { name: 'Secondary Light', cssVar: '--accent-secondary-light' },
      ]}
    />

    <ColorSection
      title="Semantic Colors"
      colors={[
        { name: 'Success', cssVar: '--semantic-success' },
        { name: 'Success Light', cssVar: '--semantic-success-light' },
        { name: 'Error', cssVar: '--semantic-error' },
        { name: 'Error Light', cssVar: '--semantic-error-light' },
        { name: 'Warning', cssVar: '--semantic-warning' },
        { name: 'Warning Light', cssVar: '--semantic-warning-light' },
        { name: 'Info', cssVar: '--semantic-info' },
        { name: 'Info Light', cssVar: '--semantic-info-light' },
      ]}
    />

    <ColorSection
      title="Icon Colors"
      colors={[
        { name: 'Default', cssVar: '--icons-default' },
        { name: 'Hover', cssVar: '--icons-hover' },
        { name: 'Active', cssVar: '--icons-active' },
        { name: 'Disabled', cssVar: '--icons-disabled' },
      ]}
    />

    <ColorSection
      title="Highlight Colors (Background)"
      colors={[
        { name: 'Gray', cssVar: '--color-highlight-gray-bg' },
        { name: 'Brown', cssVar: '--color-highlight-brown-bg' },
        { name: 'Orange', cssVar: '--color-highlight-orange-bg' },
        { name: 'Yellow', cssVar: '--color-highlight-yellow-bg' },
        { name: 'Green', cssVar: '--color-highlight-green-bg' },
        { name: 'Blue', cssVar: '--color-highlight-blue-bg' },
        { name: 'Purple', cssVar: '--color-highlight-purple-bg' },
        { name: 'Magenta', cssVar: '--color-highlight-magenta-bg' },
        { name: 'Red', cssVar: '--color-highlight-red-bg' },
      ]}
    />

    <ColorSection
      title="Highlight Colors (Text)"
      colors={[
        { name: 'Gray', cssVar: '--color-highlight-gray-text' },
        { name: 'Brown', cssVar: '--color-highlight-brown-text' },
        { name: 'Orange', cssVar: '--color-highlight-orange-text' },
        { name: 'Yellow', cssVar: '--color-highlight-yellow-text' },
        { name: 'Green', cssVar: '--color-highlight-green-text' },
        { name: 'Blue', cssVar: '--color-highlight-blue-text' },
        { name: 'Purple', cssVar: '--color-highlight-purple-text' },
        { name: 'Magenta', cssVar: '--color-highlight-magenta-text' },
        { name: 'Red', cssVar: '--color-highlight-red-text' },
      ]}
    />

    <ColorSection
      title="Collection Colors"
      colors={[
        { name: 'Collection 1', cssVar: '--collection-key-1' },
        { name: 'Collection 2', cssVar: '--collection-key-2' },
        { name: 'Collection 3', cssVar: '--collection-key-3' },
        { name: 'Collection 4', cssVar: '--collection-key-4' },
        { name: 'Collection 5', cssVar: '--collection-key-5' },
        { name: 'Collection 6', cssVar: '--collection-key-6' },
      ]}
    />

    <ColorSection
      title="Code Colors"
      colors={[
        { name: 'Background', cssVar: '--code-background' },
        { name: 'Inline Background', cssVar: '--code-inline-background' },
        { name: 'Border', cssVar: '--code-border' },
        { name: 'Text', cssVar: '--code-text' },
        { name: 'Comment', cssVar: '--code-comment' },
        { name: 'Keyword', cssVar: '--code-keyword' },
        { name: 'String', cssVar: '--code-string' },
        { name: 'Number', cssVar: '--code-number' },
      ]}
    />
  </div>
);

export const AllColors = {
  render: () => <ColorsPage />,
  parameters: {
    docs: {
      description: {
        story: 'Complete color palette with all design tokens.',
      },
    },
  },
};
