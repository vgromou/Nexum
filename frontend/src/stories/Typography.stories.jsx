import React from 'react';

export default {
  title: 'Design System/Typography',
  parameters: {
    layout: 'fullscreen',
  },
};

const TypographyExample = ({ name, cssVars, children }) => (
  <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--border-default)', paddingBottom: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '12px' }}>
      <span style={{
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        minWidth: '140px'
      }}>
        {name}
      </span>
      <span style={{
        fontSize: '11px',
        color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-family-mono)'
      }}>
        {cssVars}
      </span>
    </div>
    <div>{children}</div>
  </div>
);

const TypographyPage = () => (
  <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
      Typography
    </h1>
    <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '48px' }}>
      Typography scale and text styles used throughout the application.
    </p>

    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
      Font Families
    </h2>

    <TypographyExample name="Sans Serif" cssVars="--font-family-sans">
      <p style={{ fontFamily: 'var(--font-family-sans)', fontSize: '16px' }}>
        Inter, -apple-system, BlinkMacSystemFont, sans-serif
      </p>
      <p style={{ fontFamily: 'var(--font-family-sans)', fontSize: '16px', marginTop: '8px' }}>
        The quick brown fox jumps over the lazy dog. 0123456789
      </p>
    </TypographyExample>

    <TypographyExample name="Monospace" cssVars="--font-family-mono">
      <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: '14px' }}>
        JetBrains Mono, Monaco, Courier New, monospace
      </p>
      <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: '14px', marginTop: '8px' }}>
        const greeting = "Hello, World!"; // 0123456789
      </p>
    </TypographyExample>

    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '48px 0 24px', color: 'var(--text-primary)' }}>
      Headings
    </h2>

    <TypographyExample name="Page Title" cssVars="40px / 48px / 700">
      <h1 style={{
        fontSize: 'var(--typography-page-title-size)',
        lineHeight: 'var(--typography-page-title-line-height)',
        fontWeight: 'var(--typography-page-title-weight)',
        letterSpacing: 'var(--typography-page-title-letter-spacing)',
        color: 'var(--text-primary)',
        margin: 0
      }}>
        Page Title Example
      </h1>
    </TypographyExample>

    <TypographyExample name="Heading 1" cssVars="32px / 40px / 700">
      <h1 style={{
        fontSize: 'var(--typography-h1-size)',
        lineHeight: 'var(--typography-h1-line-height)',
        fontWeight: 'var(--typography-h1-weight)',
        letterSpacing: 'var(--typography-h1-letter-spacing)',
        color: 'var(--text-primary)',
        margin: 0
      }}>
        Heading Level 1
      </h1>
    </TypographyExample>

    <TypographyExample name="Heading 2" cssVars="24px / 32px / 600">
      <h2 style={{
        fontSize: 'var(--typography-h2-size)',
        lineHeight: 'var(--typography-h2-line-height)',
        fontWeight: 'var(--typography-h2-weight)',
        letterSpacing: 'var(--typography-h2-letter-spacing)',
        color: 'var(--text-primary)',
        margin: 0
      }}>
        Heading Level 2
      </h2>
    </TypographyExample>

    <TypographyExample name="Heading 3" cssVars="20px / 28px / 600">
      <h3 style={{
        fontSize: 'var(--typography-h3-size)',
        lineHeight: 'var(--typography-h3-line-height)',
        fontWeight: 'var(--typography-h3-weight)',
        color: 'var(--text-primary)',
        margin: 0
      }}>
        Heading Level 3
      </h3>
    </TypographyExample>

    <TypographyExample name="Heading 4" cssVars="18px / 26px / 600">
      <h4 style={{
        fontSize: 'var(--typography-h4-size)',
        lineHeight: 'var(--typography-h4-line-height)',
        fontWeight: 'var(--typography-h4-weight)',
        color: 'var(--text-primary)',
        margin: 0
      }}>
        Heading Level 4
      </h4>
    </TypographyExample>

    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '48px 0 24px', color: 'var(--text-primary)' }}>
      Body Text
    </h2>

    <TypographyExample name="Body Default" cssVars="16px / 26px / 400">
      <p style={{
        fontSize: 'var(--typography-body-size)',
        lineHeight: 'var(--typography-body-line-height)',
        fontWeight: 'var(--typography-body-weight)',
        color: 'var(--text-primary)',
        margin: 0
      }}>
        This is the default body text style used for paragraphs and general content.
        It provides comfortable reading with proper line height for extended text blocks.
      </p>
    </TypographyExample>

    <TypographyExample name="Body Bold" cssVars="16px / 26px / 600">
      <p style={{
        fontSize: 'var(--typography-body-size)',
        lineHeight: 'var(--typography-body-line-height)',
        fontWeight: 'var(--typography-body-bold-weight)',
        color: 'var(--text-primary)',
        margin: 0
      }}>
        This is bold body text for emphasis within paragraphs.
      </p>
    </TypographyExample>

    <TypographyExample name="Body Small" cssVars="14px / 22px / 400">
      <p style={{
        fontSize: 'var(--typography-body-small-size)',
        lineHeight: 'var(--typography-body-small-line-height)',
        fontWeight: 'var(--typography-body-small-weight)',
        color: 'var(--text-primary)',
        margin: 0
      }}>
        Smaller body text for secondary information and compact layouts.
      </p>
    </TypographyExample>

    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '48px 0 24px', color: 'var(--text-primary)' }}>
      UI Text
    </h2>

    <TypographyExample name="Button Large" cssVars="16px / 24px / 500">
      <span style={{
        fontSize: 'var(--typography-button-large-size)',
        lineHeight: 'var(--typography-button-large-line-height)',
        fontWeight: 'var(--typography-button-large-weight)',
        color: 'var(--text-primary)'
      }}>
        Large Button Text
      </span>
    </TypographyExample>

    <TypographyExample name="Button Default" cssVars="14px / 20px / 500">
      <span style={{
        fontSize: 'var(--typography-button-default-size)',
        lineHeight: 'var(--typography-button-default-line-height)',
        fontWeight: 'var(--typography-button-default-weight)',
        color: 'var(--text-primary)'
      }}>
        Default Button Text
      </span>
    </TypographyExample>

    <TypographyExample name="Button Small" cssVars="13px / 18px / 500">
      <span style={{
        fontSize: 'var(--typography-button-small-size)',
        lineHeight: 'var(--typography-button-small-line-height)',
        fontWeight: 'var(--typography-button-small-weight)',
        color: 'var(--text-primary)'
      }}>
        Small Button Text
      </span>
    </TypographyExample>

    <TypographyExample name="Label" cssVars="13px / 18px / 500">
      <span style={{
        fontSize: 'var(--typography-label-size)',
        lineHeight: 'var(--typography-label-line-height)',
        fontWeight: 'var(--typography-label-weight)',
        color: 'var(--text-secondary)'
      }}>
        Form Label
      </span>
    </TypographyExample>

    <TypographyExample name="Input" cssVars="14px / 20px / 400">
      <span style={{
        fontSize: 'var(--typography-input-size)',
        lineHeight: 'var(--typography-input-line-height)',
        fontWeight: 'var(--typography-input-weight)',
        color: 'var(--text-primary)'
      }}>
        Input field text
      </span>
    </TypographyExample>

    <TypographyExample name="Caption" cssVars="13px / 18px / 400">
      <span style={{
        fontSize: 'var(--typography-caption-size)',
        lineHeight: 'var(--typography-caption-line-height)',
        fontWeight: 'var(--typography-caption-weight)',
        color: 'var(--text-secondary)'
      }}>
        Caption text for additional context
      </span>
    </TypographyExample>

    <TypographyExample name="Caption Small" cssVars="12px / 16px / 400">
      <span style={{
        fontSize: 'var(--typography-caption-small-size)',
        lineHeight: 'var(--typography-caption-small-line-height)',
        fontWeight: 'var(--typography-caption-small-weight)',
        color: 'var(--text-tertiary)'
      }}>
        Small caption for metadata
      </span>
    </TypographyExample>

    <TypographyExample name="Badge" cssVars="12px / 16px / 500">
      <span style={{
        fontSize: 'var(--typography-badge-size)',
        lineHeight: 'var(--typography-badge-line-height)',
        fontWeight: 'var(--typography-badge-weight)',
        color: 'var(--text-inverse)',
        backgroundColor: 'var(--accent-primary)',
        padding: '2px 8px',
        borderRadius: '4px'
      }}>
        Badge
      </span>
    </TypographyExample>

    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '48px 0 24px', color: 'var(--text-primary)' }}>
      Code
    </h2>

    <TypographyExample name="Inline Code" cssVars="14px / 20px / 400 (mono)">
      <p style={{ fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>
        Use <code style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: 'var(--typography-code-inline-size)',
          backgroundColor: 'var(--code-inline-background)',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>console.log()</code> to debug your code.
      </p>
    </TypographyExample>

    <TypographyExample name="Code Block" cssVars="14px / 22px / 400 (mono)">
      <pre style={{
        fontFamily: 'var(--font-family-mono)',
        fontSize: 'var(--typography-code-block-size)',
        lineHeight: 'var(--typography-code-block-line-height)',
        backgroundColor: 'var(--code-background)',
        padding: '16px',
        borderRadius: '8px',
        margin: 0,
        overflow: 'auto'
      }}>
        <code>{`function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));`}</code>
      </pre>
    </TypographyExample>

    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '48px 0 24px', color: 'var(--text-primary)' }}>
      Links
    </h2>

    <TypographyExample name="Link Default" cssVars="16px / 26px / 400">
      <a href="#" style={{
        fontSize: 'var(--typography-link-size)',
        lineHeight: 'var(--typography-link-line-height)',
        fontWeight: 'var(--typography-link-weight)',
        color: 'var(--text-link)',
        textDecoration: 'none'
      }}>
        Default link style
      </a>
    </TypographyExample>

    <TypographyExample name="Link Small" cssVars="14px / 22px / 400">
      <a href="#" style={{
        fontSize: 'var(--typography-link-small-size)',
        lineHeight: 'var(--typography-link-small-line-height)',
        fontWeight: 'var(--typography-link-small-weight)',
        color: 'var(--text-link)',
        textDecoration: 'none'
      }}>
        Small link style
      </a>
    </TypographyExample>
  </div>
);

export const AllTypography = {
  render: () => <TypographyPage />,
  parameters: {
    docs: {
      description: {
        story: 'Complete typography scale with all text styles.',
      },
    },
  },
};
