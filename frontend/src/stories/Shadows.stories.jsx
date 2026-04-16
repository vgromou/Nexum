import React from 'react';

export default {
  title: 'Design System/Shadows',
  parameters: {
    layout: 'padded',
  },
};

const ShadowBox = ({ shadow, label, description }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '200px',
  }}>
    <div style={{
      background: 'var(--background-primary)',
      padding: '32px',
      borderRadius: 'var(--radius-md)',
      boxShadow: shadow,
      textAlign: 'center',
      minHeight: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-family-sans)',
      color: 'var(--text-secondary)',
      fontWeight: 500,
    }}>
      {label}
    </div>
    {description && (
      <div style={{
        fontFamily: 'var(--font-family-mono)',
        fontSize: '12px',
        color: 'var(--text-tertiary)',
        textAlign: 'center',
      }}>
        {description}
      </div>
    )}
  </div>
);

export const DefaultShadows = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{
        marginBottom: '24px',
        fontFamily: 'var(--font-family-sans)',
        color: 'var(--text-primary)',
      }}>
        Default Shadows (Black)
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '32px',
      }}>
        <ShadowBox
          shadow="var(--shadow-sm)"
          label="Small"
          description="--shadow-sm"
        />
        <ShadowBox
          shadow="var(--shadow-md)"
          label="Medium"
          description="--shadow-md"
        />
        <ShadowBox
          shadow="var(--shadow-lg)"
          label="Large"
          description="--shadow-lg"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default shadow system using black with varying opacity. Use for standard elevation and depth.',
      },
    },
  },
};

export const AccentShadows = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{
        marginBottom: '24px',
        fontFamily: 'var(--font-family-sans)',
        color: 'var(--text-primary)',
      }}>
        Accent Shadows (Purple)
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '32px',
      }}>
        <ShadowBox
          shadow="var(--shadow-sm-accent)"
          label="Small Accent"
          description="--shadow-sm-accent"
        />
        <ShadowBox
          shadow="var(--shadow-md-accent)"
          label="Medium Accent"
          description="--shadow-md-accent"
        />
        <ShadowBox
          shadow="var(--shadow-lg-accent)"
          label="Large Accent"
          description="--shadow-lg-accent"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accent shadow system using the primary brand color (purple). Use for interactive elements, focus states, or to draw attention.',
      },
    },
    backgrounds: {
      default: 'sidebar',
    },
  },
};

export const AllShadows = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{
          marginBottom: '24px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--text-primary)',
        }}>
          Default Shadows
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '32px',
          marginBottom: '48px',
        }}>
          <ShadowBox shadow="var(--shadow-sm)" label="Small" description="--shadow-sm" />
          <ShadowBox shadow="var(--shadow-md)" label="Medium" description="--shadow-md" />
          <ShadowBox shadow="var(--shadow-lg)" label="Large" description="--shadow-lg" />
        </div>
      </div>

      <div>
        <h2 style={{
          marginBottom: '24px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--text-primary)',
        }}>
          Accent Shadows
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '32px',
        }}>
          <ShadowBox shadow="var(--shadow-sm-accent)" label="Small Accent" description="--shadow-sm-accent" />
          <ShadowBox shadow="var(--shadow-md-accent)" label="Medium Accent" description="--shadow-md-accent" />
          <ShadowBox shadow="var(--shadow-lg-accent)" label="Large Accent" description="--shadow-lg-accent" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete shadow system from Figma tokens showing both default (black) and accent (purple) variants.',
      },
    },
  },
};

export const UsageExamples = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{
        marginBottom: '24px',
        fontFamily: 'var(--font-family-sans)',
        color: 'var(--text-primary)',
      }}>
        Usage Examples
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Card with shadow */}
        <div>
          <h3 style={{
            marginBottom: '16px',
            fontFamily: 'var(--font-family-sans)',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Card with Shadow
          </h3>
          <div style={{
            background: 'var(--surface-card)',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            maxWidth: '400px',
          }}>
            <h4 style={{ marginBottom: '8px', fontFamily: 'var(--font-family-sans)' }}>
              Card Title
            </h4>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Card content with medium shadow for elevation.
            </p>
          </div>
        </div>

        {/* Button with accent shadow */}
        <div>
          <h3 style={{
            marginBottom: '16px',
            fontFamily: 'var(--font-family-sans)',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Button with Accent Shadow
          </h3>
          <button
            className="btn btn-primary"
            style={{ boxShadow: 'var(--shadow-md-accent)' }}
          >
            Call to Action
          </button>
        </div>

        {/* Floating menu */}
        <div>
          <h3 style={{
            marginBottom: '16px',
            fontFamily: 'var(--font-family-sans)',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Floating Menu
          </h3>
          <div style={{
            background: 'var(--surface-elevated)',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            maxWidth: '200px',
            border: '1px solid var(--border-light)',
          }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-sans)',
              fontSize: '14px',
            }}>
              Menu Item 1
            </div>
            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-sans)',
              fontSize: '14px',
            }}>
              Menu Item 2
            </div>
            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-sans)',
              fontSize: '14px',
            }}>
              Menu Item 3
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world examples showing how to use shadows in different UI contexts.',
      },
    },
  },
};
