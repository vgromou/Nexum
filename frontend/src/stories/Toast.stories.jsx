import React, { useState } from 'react';
import Toast, { ToastProvider, useToast } from '../components/Toast';

export default {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A notification toast component with animated progress border.

**Features:**
- 4 variants (success, error, warning, info)
- Animated progress border that transitions from colored to gray clockwise
- Auto-dismiss after configurable duration (default 10 seconds)
- Pause on hover
- 2 icon sizes (sm, md)

**Progress Border Animation:**
The border starts fully colored and transitions to gray clockwise from the top-right corner,
providing a visual countdown of the remaining time.`,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
      description: 'Toast variant determining color scheme',
    },
    message: {
      control: 'text',
      description: 'Message text to display',
    },
    duration: {
      control: 'number',
      description: 'Auto-dismiss duration in milliseconds',
    },
    showProgress: {
      control: 'boolean',
      description: 'Show animated progress border',
    },
    iconSize: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Icon size',
    },
    paused: {
      control: 'boolean',
      description: 'Pause the progress animation',
    },
  },
};

// Interactive playground
export const Playground = {
  args: {
    variant: 'success',
    message: 'Page moved to Space "Engineering"',
    duration: 10000,
    showProgress: true,
    iconSize: 'md',
    paused: false,
  },
  render: (args) => (
    <div style={{ position: 'relative', minHeight: '100px' }}>
      <Toast {...args} onClose={() => console.log('Toast closed')} />
    </div>
  ),
};

// All variants
export const Variants = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Toast variant="success" message="Changes saved successfully" paused />
      <Toast variant="error" message="Failed to save changes. Please try again." paused />
      <Toast variant="warning" message="Your session will expire in 5 minutes" paused />
      <Toast variant="info" message="New updates are available" paused />
    </div>
  ),
};

// Icon sizes
export const IconSizes = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Toast variant="success" message="Medium icon size (default)" iconSize="md" paused />
      <Toast variant="success" message="Small icon size" iconSize="sm" paused />
    </div>
  ),
};

// Progress animation states
export const ProgressStates = {
  args: {
    message: 'Progress states demo',
    variant: 'success',
    duration: 10000,
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Toast
        variant="success"
        message="With progress animation (running)"
        showProgress
        duration={10000}
      />
      <Toast variant="info" message="Progress paused (hover effect)" showProgress paused />
      <Toast
        variant="warning"
        message="Without progress (manual close only)"
        showProgress={false}
      />
    </div>
  ),
};

// Different durations
export const Durations = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Toast variant="error" message="Fast toast - 3 seconds" duration={3000} />
      <Toast variant="warning" message="Medium toast - 5 seconds" duration={5000} />
      <Toast variant="success" message="Default toast - 10 seconds" duration={10000} />
    </div>
  ),
};

// Toast Provider demo
const ToastDemo = () => {
  const { showToast, hideAllToasts } = useToast();

  const handleShowSuccess = () => {
    showToast({
      variant: 'success',
      message: 'Operation completed successfully!',
    });
  };

  const handleShowError = () => {
    showToast({
      variant: 'error',
      message: 'Something went wrong. Please try again.',
    });
  };

  const handleShowWarning = () => {
    showToast({
      variant: 'warning',
      message: 'This action cannot be undone.',
    });
  };

  const handleShowInfo = () => {
    showToast({
      variant: 'info',
      message: 'New features are available!',
    });
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button onClick={handleShowSuccess} style={buttonStyle('#10B981')}>
        Show Success
      </button>
      <button onClick={handleShowError} style={buttonStyle('#EF4444')}>
        Show Error
      </button>
      <button onClick={handleShowWarning} style={buttonStyle('#F59E0B')}>
        Show Warning
      </button>
      <button onClick={handleShowInfo} style={buttonStyle('#3B82F6')}>
        Show Info
      </button>
      <button onClick={hideAllToasts} style={buttonStyle('#6B7280')}>
        Clear All
      </button>
    </div>
  );
};

const buttonStyle = (color) => ({
  padding: '8px 16px',
  backgroundColor: color,
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
});

export const WithProvider = {
  render: () => (
    <ToastProvider position="top-right">
      <div style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '16px' }}>Click buttons to show toasts</h3>
        <ToastDemo />
      </div>
    </ToastProvider>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

// All positions
const PositionDemo = ({ position }) => {
  const { showToast } = useToast();

  return (
    <button
      onClick={() =>
        showToast({
          variant: 'success',
          message: `Toast at ${position}`,
        })
      }
      style={buttonStyle('#5E6AD2')}
    >
      Show Toast
    </button>
  );
};

export const Positions = {
  render: () => {
    const positions = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ];
    const [position, setPosition] = useState('top-right');

    return (
      <ToastProvider position={position} key={position}>
        <div style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Select position:</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {positions.map((pos) => (
              <button
                key={pos}
                onClick={() => setPosition(pos)}
                style={{
                  ...buttonStyle(pos === position ? '#5E6AD2' : '#E5E7EB'),
                  color: pos === position ? 'white' : '#1F2937',
                }}
              >
                {pos}
              </button>
            ))}
          </div>
          <PositionDemo position={position} />
        </div>
      </ToastProvider>
    );
  },
  parameters: {
    layout: 'fullscreen',
  },
};

// Long message
export const LongMessage = {
  render: () => (
    <Toast
      variant="info"
      message="This is a much longer toast message that demonstrates how the component handles text that might wrap to multiple lines. The layout should remain clean and readable."
      paused
    />
  ),
};
