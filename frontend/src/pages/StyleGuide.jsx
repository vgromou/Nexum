import React from 'react';
import '../styles/StyleGuide.css';

const StyleGuide = () => {
  return (
    <div className="style-guide">
      <header className="style-guide-header">
        <h1>Nexum Design System</h1>
        <p className="subtitle">Style Guide & Component Showcase</p>
        <p className="description">
          Updated with Figma design tokens - {new Date().toLocaleDateString()}
        </p>
      </header>

      <main className="style-guide-content">
        {/* Colors Section */}
        <section className="style-guide-section">
          <h2>Colors</h2>

          <h3>Background Colors</h3>
          <div className="color-grid">
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--background-primary)' }}></div>
              <span>Primary</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--background-secondary)' }}></div>
              <span>Secondary</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--background-tertiary)' }}></div>
              <span>Tertiary</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--background-hover)' }}></div>
              <span>Hover</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--background-active)' }}></div>
              <span>Active</span>
            </div>
          </div>

          <h3>Text Colors</h3>
          <div className="color-grid">
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--text-primary)' }}></div>
              <span>Primary</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--text-secondary)' }}></div>
              <span>Secondary</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--text-tertiary)' }}></div>
              <span>Tertiary</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--text-link)' }}></div>
              <span>Link</span>
            </div>
          </div>

          <h3>Accent Colors</h3>
          <div className="color-grid">
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
              <span>Primary</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--accent-primary-hover)' }}></div>
              <span>Primary Hover</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--accent-primary-active)' }}></div>
              <span>Primary Active</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--accent-primary-light)' }}></div>
              <span>Primary Light</span>
            </div>
          </div>

          <h3>Semantic Colors</h3>
          <div className="color-grid">
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--semantic-success)' }}></div>
              <span>Success</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--semantic-error)' }}></div>
              <span>Error</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--semantic-warning)' }}></div>
              <span>Warning</span>
            </div>
            <div className="color-swatch">
              <div className="color-box" style={{ backgroundColor: 'var(--semantic-info)' }}></div>
              <span>Info</span>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="style-guide-section">
          <h2>Buttons</h2>

          <h3>Primary Buttons</h3>
          <div className="button-row">
            <button className="btn btn-primary">Primary</button>
            <button className="btn btn-primary" disabled>Primary Disabled</button>
            <button className="btn btn-primary btn-sm">Small</button>
            <button className="btn btn-primary btn-lg">Large</button>
          </div>

          <h3>Ghost Buttons</h3>
          <div className="button-row">
            <button className="btn btn-ghost">Ghost</button>
            <button className="btn btn-ghost" disabled>Ghost Disabled</button>
            <button className="btn btn-ghost btn-sm">Small</button>
            <button className="btn btn-ghost btn-lg">Large</button>
          </div>

          <h3>Outline Buttons</h3>
          <div className="button-row">
            <button className="btn btn-outline">Outline</button>
            <button className="btn btn-outline" disabled>Outline Disabled</button>
            <button className="btn btn-outline btn-sm">Small</button>
            <button className="btn btn-outline btn-lg">Large</button>
          </div>

          <h3>Destructive Buttons</h3>
          <div className="button-row">
            <button className="btn btn-destructive">Destructive</button>
            <button className="btn btn-destructive" disabled>Destructive Disabled</button>
            <button className="btn btn-destructive-ghost">Destructive Ghost</button>
            <button className="btn btn-destructive-outline">Destructive Outline</button>
          </div>

          <h3>Success Buttons</h3>
          <div className="button-row">
            <button className="btn btn-success">Success</button>
            <button className="btn btn-success" disabled>Success Disabled</button>
            <button className="btn btn-success-ghost">Success Ghost</button>
            <button className="btn btn-success-outline">Success Outline</button>
          </div>
        </section>

        {/* Shadows Section */}
        <section className="style-guide-section">
          <h2>Shadows</h2>

          <h3>Default Shadows</h3>
          <div className="shadow-grid">
            <div className="shadow-box" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <span>Small</span>
            </div>
            <div className="shadow-box" style={{ boxShadow: 'var(--shadow-md)' }}>
              <span>Medium</span>
            </div>
            <div className="shadow-box" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <span>Large</span>
            </div>
          </div>

          <h3>Accent Shadows</h3>
          <div className="shadow-grid">
            <div className="shadow-box" style={{ boxShadow: 'var(--shadow-sm-accent)' }}>
              <span>Small Accent</span>
            </div>
            <div className="shadow-box" style={{ boxShadow: 'var(--shadow-md-accent)' }}>
              <span>Medium Accent</span>
            </div>
            <div className="shadow-box" style={{ boxShadow: 'var(--shadow-lg-accent)' }}>
              <span>Large Accent</span>
            </div>
          </div>
        </section>

        {/* Spacing Section */}
        <section className="style-guide-section">
          <h2>Spacing Scale</h2>
          <div className="spacing-grid">
            {['xxs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'].map((size) => (
              <div key={size} className="spacing-item">
                <div
                  className="spacing-box"
                  style={{ width: `var(--space-${size})`, height: `var(--space-${size})` }}
                ></div>
                <span>{size}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Border Radius Section */}
        <section className="style-guide-section">
          <h2>Border Radius</h2>
          <div className="radius-grid">
            {['sm', 'md', 'lg', 'xl'].map((size) => (
              <div key={size} className="radius-item">
                <div
                  className="radius-box"
                  style={{ borderRadius: `var(--radius-${size})` }}
                ></div>
                <span>{size}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Typography Section */}
        <section className="style-guide-section">
          <h2>Typography</h2>
          <div className="typography-section">
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <h4>Heading 4</h4>
            <p>Body text with <a href="#"> a link</a> and <code>inline code</code></p>
            <p style={{ fontSize: 'var(--typography-body-small-size)' }}>Small body text</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StyleGuide;
