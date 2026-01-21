import React from 'react';

export default {
  title: 'Design System/Button Utilities',
  parameters: {
    layout: 'padded',
  },
};

const ButtonShowcase = ({ variant, label }) => (
  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
    <button className={`btn ${variant}`}>{label}</button>
    <button className={`btn ${variant}`} disabled>{label} Disabled</button>
    <button className={`btn ${variant} btn-sm`}>{label} Small</button>
    <button className={`btn ${variant} btn-lg`}>{label} Large</button>
  </div>
);

export const AllButtonVariants = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '24px', fontFamily: 'var(--font-family-sans)' }}>
        Button System - All Variants
      </h2>

      <div style={{ marginBottom: '40px' }}>
        <h3 style={{
          marginBottom: '16px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Primary
        </h3>
        <ButtonShowcase variant="btn-primary" label="Primary" />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h3 style={{
          marginBottom: '16px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Ghost
        </h3>
        <ButtonShowcase variant="btn-ghost" label="Ghost" />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h3 style={{
          marginBottom: '16px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Outline
        </h3>
        <ButtonShowcase variant="btn-outline" label="Outline" />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h3 style={{
          marginBottom: '16px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Destructive
        </h3>
        <ButtonShowcase variant="btn-destructive" label="Destructive" />
        <ButtonShowcase variant="btn-destructive-ghost" label="Destructive Ghost" />
        <ButtonShowcase variant="btn-destructive-outline" label="Destructive Outline" />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h3 style={{
          marginBottom: '16px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Success
        </h3>
        <ButtonShowcase variant="btn-success" label="Success" />
        <ButtonShowcase variant="btn-success-ghost" label="Success Ghost" />
        <ButtonShowcase variant="btn-success-outline" label="Success Outline" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants from Figma design tokens with states (default, hover, active, disabled) and sizes (small, medium, large).',
      },
    },
  },
};

export const Primary = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <button className="btn btn-primary">Primary</button>
      <button className="btn btn-primary" disabled>Disabled</button>
    </div>
  ),
};

export const Ghost = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <button className="btn btn-ghost">Ghost</button>
      <button className="btn btn-ghost" disabled>Disabled</button>
    </div>
  ),
};

export const Outline = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <button className="btn btn-outline">Outline</button>
      <button className="btn btn-outline" disabled>Disabled</button>
    </div>
  ),
};

export const Destructive = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <button className="btn btn-destructive">Destructive</button>
      <button className="btn btn-destructive-ghost">Ghost</button>
      <button className="btn btn-destructive-outline">Outline</button>
    </div>
  ),
};

export const Success = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <button className="btn btn-success">Success</button>
      <button className="btn btn-success-ghost">Ghost</button>
      <button className="btn btn-success-outline">Outline</button>
    </div>
  ),
};

export const Sizes = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <button className="btn btn-primary btn-sm">Small</button>
      <button className="btn btn-primary btn-md">Medium</button>
      <button className="btn btn-primary btn-lg">Large</button>
    </div>
  ),
};

export const IconButtons = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <button className="btn btn-primary btn-icon">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z"/>
        </svg>
      </button>
      <button className="btn btn-ghost btn-icon">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm10.03 4.97a.75.75 0 0 1 .011 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.75.75 0 0 1 1.08-.022z"/>
        </svg>
      </button>
      <button className="btn btn-outline btn-icon">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1H.5zm3.915 10L3.102 4h10.796l-1.313 7h-8.17zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
      </button>
    </div>
  ),
};

export const FullWidth = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <button className="btn btn-primary btn-full" style={{ marginBottom: '12px' }}>
        Full Width Primary
      </button>
      <button className="btn btn-outline btn-full">
        Full Width Outline
      </button>
    </div>
  ),
};
