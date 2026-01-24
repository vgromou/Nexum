import React, { useState, useEffect } from 'react';
import Overlay from '../components/Overlay';

export default {
  title: 'Components/Overlay',
  component: Overlay,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `A full-screen overlay component with two variants.

**Variants:**
- **dim**: Semi-transparent dark overlay (rgba(0, 0, 0, 0.5))
- **blur**: Blurred white overlay with backdrop-filter

**Usage:**
Typically used as a backdrop for modals, dialogs, or drawers.
Click handler can be attached to close the modal when clicking outside.`,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['dim', 'blur'],
      description: 'Overlay variant',
    },
    isActive: {
      control: 'boolean',
      description: 'Controls animation state',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
};

// Sample content to show behind overlay
const BackgroundContent = () => (
  <div
    style={{
      padding: '40px',
      fontFamily: 'Inter, sans-serif',
    }}
  >
    <h1 style={{ marginBottom: '16px', color: '#1F2937' }}>Page Title</h1>
    <p style={{ marginBottom: '12px', color: '#6B7280' }}>
      This is some sample content behind the overlay. The overlay should appear on top of this
      content.
    </p>
    <p style={{ marginBottom: '12px', color: '#6B7280' }}>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
      labore et dolore magna aliqua.
    </p>
    <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
      <div
        style={{
          width: '200px',
          height: '150px',
          backgroundColor: '#5E6AD2',
          borderRadius: '8px',
        }}
      />
      <div
        style={{
          width: '200px',
          height: '150px',
          backgroundColor: '#10B981',
          borderRadius: '8px',
        }}
      />
      <div
        style={{
          width: '200px',
          height: '150px',
          backgroundColor: '#F59E0B',
          borderRadius: '8px',
        }}
      />
    </div>
  </div>
);

// Interactive playground
export const Playground = {
  args: {
    variant: 'dim',
  },
  render: (args) => (
    <div style={{ position: 'relative', minHeight: '400px' }}>
      <BackgroundContent />
      <Overlay {...args} />
    </div>
  ),
};

// Dim variant
export const Dim = {
  render: () => (
    <div style={{ position: 'relative', minHeight: '400px' }}>
      <BackgroundContent />
      <Overlay variant="dim" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Semi-transparent dark overlay using `--surface-overlay` (rgba(0, 0, 0, 0.5)).',
      },
    },
  },
};

// Blur variant
export const Blur = {
  render: () => (
    <div style={{ position: 'relative', minHeight: '400px' }}>
      <BackgroundContent />
      <Overlay variant="blur" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'White overlay with backdrop blur effect (rgba(255, 255, 255, 0.7) + backdrop-filter: blur(16px)).',
      },
    },
  },
};

// Both variants side by side
export const Comparison = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', padding: '24px' }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>Dim</h3>
        <div
          style={{
            position: 'relative',
            height: '300px',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Background content</p>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#5E6AD2',
                  borderRadius: '4px',
                }}
              />
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#10B981',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
          <Overlay variant="dim" style={{ position: 'absolute' }} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>Blur</h3>
        <div
          style={{
            position: 'relative',
            height: '300px',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Background content</p>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#5E6AD2',
                  borderRadius: '4px',
                }}
              />
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#10B981',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
          <Overlay variant="blur" style={{ position: 'absolute' }} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of both overlay variants side by side.',
      },
    },
  },
};

// With modal content
export const WithModalContent = {
  render: () => (
    <div style={{ position: 'relative', minHeight: '400px' }}>
      <BackgroundContent />
      <Overlay variant="dim">
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
          }}
        >
          <h2 style={{ marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>Modal Title</h2>
          <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.5' }}>
            This is an example of how the overlay can be used with modal content placed inside it.
          </p>
        </div>
      </Overlay>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example showing overlay with modal content rendered as children.',
      },
    },
  },
};

// Animation demo
const AnimationDemo = ({ variant }) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div style={{ position: 'relative', minHeight: '400px' }}>
      <BackgroundContent />
      <button
        onClick={() => setIsActive(true)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          backgroundColor: '#5E6AD2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1,
        }}
      >
        Show Overlay
      </button>
      {isActive && (
        <AnimatedOverlay variant={variant} onClose={() => setIsActive(false)} />
      )}
    </div>
  );
};

const AnimatedOverlay = ({ variant, onClose }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => setIsActive(true));
  }, []);

  const handleClose = () => {
    setIsActive(false);
    setTimeout(onClose, variant === 'blur' ? 300 : 200);
  };

  return (
    <Overlay variant={variant} isActive={isActive} onClick={handleClose}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          opacity: isActive ? 1 : 0,
          transition: 'opacity 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>
          {variant === 'dim' ? 'Dim Overlay' : 'Blur Overlay'}
        </h2>
        <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
          Click outside or the button below to close with animation.
        </p>
        <button
          onClick={handleClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#E5E7EB',
            color: '#1F2937',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </Overlay>
  );
};

export const AnimationDim = {
  render: () => <AnimationDemo variant="dim" />,
  parameters: {
    docs: {
      description: {
        story: 'Dim overlay with fade animation (0.2s ease-out).',
      },
    },
  },
};

export const AnimationBlur = {
  render: () => <AnimationDemo variant="blur" />,
  parameters: {
    docs: {
      description: {
        story: 'Blur overlay with blur + fade animation (0.3s ease-out, blur from 0 to 16px).',
      },
    },
  },
};
