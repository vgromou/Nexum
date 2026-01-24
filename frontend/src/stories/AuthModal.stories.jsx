import React, { useState } from 'react';
import AuthModal from '../components/AuthModal';
import Button from '../components/Button';

export default {
  title: 'Components/AuthModal',
  component: AuthModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `A login modal component with username/email and password fields.

**Features:**
- Logo and brand name header
- Username/email field
- Password field with visibility toggle
- Error state for both fields
- Loading state with spinner
- Blur overlay

**States:**
- Default: Empty form ready for input
- Error: Shows validation errors under fields
- Loading: Shows spinner, disables inputs`,
      },
    },
  },
  argTypes: {
    isLoading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    usernameError: {
      control: 'text',
      description: 'Error message for username field',
    },
    passwordError: {
      control: 'text',
      description: 'Error message for password field',
    },
  },
};

// Background content
const BackgroundContent = () => (
  <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#F6F8FA' }}>
    <h1 style={{ marginBottom: '16px', color: '#1F2937' }}>Nexum Application</h1>
    <p style={{ marginBottom: '12px', color: '#6B7280' }}>
      This is the main application content. The login modal will appear on top.
    </p>
  </div>
);

// Interactive demo
const AuthModalDemo = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = ({ username, password }) => {
    console.log('Login attempt:', { username, password });
    alert(`Login: ${username} / ${password}`);
  };

  return (
    <div style={{ minHeight: '500px' }}>
      <BackgroundContent />
      <div style={{ position: 'fixed', top: '20px', right: '20px' }}>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Sign In
        </Button>
      </div>
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        {...props}
      />
    </div>
  );
};

// Playground
export const Playground = {
  args: {
    isLoading: false,
    usernameError: '',
    passwordError: '',
  },
  render: (args) => <AuthModalDemo {...args} />,
};

// Default state
export const Default = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div style={{ minHeight: '500px' }}>
        <BackgroundContent />
        <AuthModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSubmit={({ username, password }) => {
            console.log('Login:', username, password);
          }}
        />
      </div>
    );
  },
};

// Error state
export const WithErrors = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div style={{ minHeight: '500px' }}>
        <BackgroundContent />
        <AuthModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          usernameError="There is no user with such Username"
          passwordError="Password is wrong"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows validation errors under the input fields.',
      },
    },
  },
};

// Loading state
export const Loading = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div style={{ minHeight: '500px' }}>
        <BackgroundContent />
        <AuthModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          isLoading={true}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows loading state with spinner and disabled inputs.',
      },
    },
  },
};

// Interactive login flow
export const InteractiveFlow = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({ username: '', password: '' });

    const handleSubmit = ({ username, password }) => {
      setErrors({ username: '', password: '' });
      setIsLoading(true);

      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);

        if (username !== 'admin') {
          setErrors(prev => ({ ...prev, username: 'There is no user with such Username' }));
          return;
        }

        if (password !== 'password') {
          setErrors(prev => ({ ...prev, password: 'Password is wrong' }));
          return;
        }

        // Success
        setIsOpen(false);
        alert('Login successful!');
      }, 1500);
    };

    return (
      <div style={{ minHeight: '500px' }}>
        <BackgroundContent />
        <div style={{ position: 'fixed', top: '20px', right: '20px' }}>
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            Sign In
          </Button>
        </div>
        <p style={{ position: 'fixed', bottom: '20px', left: '20px', fontSize: '12px', color: '#6B7280' }}>
          Hint: Use admin / password to login successfully
        </p>
        <AuthModal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setErrors({ username: '', password: '' });
          }}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          usernameError={errors.username}
          passwordError={errors.password}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing the full login flow with validation. Use "admin" / "password" to login successfully.',
      },
    },
  },
};
