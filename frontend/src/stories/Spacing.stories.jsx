import React from 'react';

export default {
  title: 'Design System/Spacing',
  parameters: {
    layout: 'fullscreen',
  },
};

const SpacingBox = ({ name, cssVar, size }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
    <div style={{
      width: `var(${cssVar})`,
      height: '32px',
      backgroundColor: 'var(--accent-primary)',
      borderRadius: '4px',
      minWidth: '4px'
    }} />
    <div style={{ minWidth: '80px' }}>
      <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>{name}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{size}</div>
    </div>
    <code style={{
      fontSize: '12px',
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-family-mono)',
      backgroundColor: 'var(--background-tertiary)',
      padding: '2px 8px',
      borderRadius: '4px'
    }}>
      {cssVar}
    </code>
  </div>
);

const RadiusBox = ({ name, cssVar, size }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
    <div style={{
      width: '64px',
      height: '64px',
      backgroundColor: 'var(--accent-primary-light)',
      border: '2px solid var(--accent-primary)',
      borderRadius: `var(${cssVar})`
    }} />
    <div style={{ minWidth: '80px' }}>
      <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>{name}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{size}</div>
    </div>
    <code style={{
      fontSize: '12px',
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-family-mono)',
      backgroundColor: 'var(--background-tertiary)',
      padding: '2px 8px',
      borderRadius: '4px'
    }}>
      {cssVar}
    </code>
  </div>
);

const ShadowBox = ({ name, cssVar }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
    <div style={{
      width: '120px',
      height: '80px',
      backgroundColor: 'var(--background-primary)',
      borderRadius: '8px',
      boxShadow: `var(${cssVar})`
    }} />
    <div>
      <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>{name}</div>
      <code style={{
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-family-mono)'
      }}>
        {cssVar}
      </code>
    </div>
  </div>
);

const SpacingPage = () => (
  <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
      Spacing & Layout
    </h1>
    <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '48px' }}>
      Spacing scale, border radii, shadows, and layout tokens.
    </p>

    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
      Spacing Scale
    </h2>

    <SpacingBox name="Extra Extra Small" cssVar="--space-xxs" size="2px" />
    <SpacingBox name="Extra Small" cssVar="--space-xs" size="4px" />
    <SpacingBox name="Small" cssVar="--space-sm" size="8px" />
    <SpacingBox name="Medium" cssVar="--space-md" size="12px" />
    <SpacingBox name="Large" cssVar="--space-lg" size="16px" />
    <SpacingBox name="Extra Large" cssVar="--space-xl" size="24px" />
    <SpacingBox name="2X Large" cssVar="--space-2xl" size="32px" />
    <SpacingBox name="3X Large" cssVar="--space-3xl" size="48px" />
    <SpacingBox name="4X Large" cssVar="--space-4xl" size="64px" />

    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '48px 0 24px', color: 'var(--text-primary)' }}>
      Border Radius
    </h2>

    <RadiusBox name="Small" cssVar="--radius-sm" size="4px" />
    <RadiusBox name="Medium" cssVar="--radius-md" size="6px" />
    <RadiusBox name="Large" cssVar="--radius-lg" size="8px" />
    <RadiusBox name="Extra Large" cssVar="--radius-xl" size="12px" />

    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '48px 0 24px', color: 'var(--text-primary)' }}>
      Shadows
    </h2>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: 'var(--text-secondary)' }}>Default Shadows</h3>
      <ShadowBox name="Small" cssVar="--shadow-sm" />
      <ShadowBox name="Medium" cssVar="--shadow-md" />
      <ShadowBox name="Large" cssVar="--shadow-lg" />
    </div>

    <div>
      <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: 'var(--text-secondary)' }}>Accent Shadows (Purple)</h3>
      <ShadowBox name="Small Accent" cssVar="--shadow-sm-accent" />
      <ShadowBox name="Medium Accent" cssVar="--shadow-md-accent" />
      <ShadowBox name="Large Accent" cssVar="--shadow-lg-accent" />
    </div>

    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '48px 0 24px', color: 'var(--text-primary)' }}>
      Layout Dimensions
    </h2>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
      {[
        { name: 'Left Sidebar', cssVar: '--left-sidebar-width', value: '280px' },
        { name: 'Content Width', cssVar: '--content-width', value: '640px' },
        { name: 'Right Sidebar', cssVar: '--right-sidebar-width', value: '320px' },
        { name: 'Header Height', cssVar: '--header-height', value: '50px' },
        { name: 'Footer Height', cssVar: '--footer-height', value: '64px' },
      ].map(({ name, cssVar, value }) => (
        <div key={cssVar} style={{
          padding: '16px',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-default)'
        }}>
          <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {name}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
            {value}
          </div>
          <code style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-family-mono)'
          }}>
            {cssVar}
          </code>
        </div>
      ))}
    </div>

    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '48px 0 24px', color: 'var(--text-primary)' }}>
      Z-Index Scale
    </h2>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[
        { name: 'Sticky', cssVar: '--z-index-sticky', value: '100' },
        { name: 'Menu', cssVar: '--z-index-menu', value: '1100' },
        { name: 'Popover', cssVar: '--z-index-popover', value: '1110' },
        { name: 'Modal', cssVar: '--z-index-modal', value: '1200' },
      ].map(({ name, cssVar, value }) => (
        <div key={cssVar} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '100px',
            fontWeight: 500,
            fontSize: '14px',
            color: 'var(--text-primary)'
          }}>
            {name}
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--accent-primary)',
            minWidth: '60px'
          }}>
            {value}
          </div>
          <code style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-family-mono)',
            backgroundColor: 'var(--background-tertiary)',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            {cssVar}
          </code>
        </div>
      ))}
    </div>

    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '48px 0 24px', color: 'var(--text-primary)' }}>
      Transitions
    </h2>

    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      {[
        { name: 'Fast', cssVar: '--transition-fast', value: '0.15s ease' },
        { name: 'Base', cssVar: '--transition-base', value: '0.2s ease' },
        { name: 'Slow', cssVar: '--transition-slow', value: '0.3s ease' },
      ].map(({ name, cssVar, value }) => (
        <div key={cssVar} style={{
          padding: '16px 24px',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-default)',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {name}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {value}
          </div>
          <code style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-family-mono)'
          }}>
            {cssVar}
          </code>
        </div>
      ))}
    </div>
  </div>
);

export const AllSpacing = {
  render: () => <SpacingPage />,
  parameters: {
    docs: {
      description: {
        story: 'Spacing scale, border radii, shadows, and layout tokens.',
      },
    },
  },
};
