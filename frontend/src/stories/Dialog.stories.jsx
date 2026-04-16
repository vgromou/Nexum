import React, { useState } from 'react';
import { Bell, Lock, User, Settings, CreditCard } from 'lucide-react';
import Dialog from '../components/Dialog';
import Button from '../components/Button';

export default {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `A settings-style dialog component with blur overlay and optional tab navigation.

**Features:**
- Always uses blur overlay (unlike Modal which defaults to dim)
- Optional vertical tabs on the left side
- Header with title and close button
- Optional footer for action buttons
- Full keyboard navigation including arrow keys for tabs

**Use Cases:**
- Profile settings
- Workspace settings
- Preferences dialogs
- Multi-section configuration panels

**Accessibility:**
- Uses dialog role with aria-modal
- Tab list with proper ARIA attributes
- Focus management and trap
- Escape key and arrow key support`,
      },
    },
  },
  argTypes: {
    closeOnOverlayClick: {
      control: 'boolean',
      description: 'Close dialog when clicking overlay',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Close dialog when pressing Escape',
    },
  },
};

// Background content for demos
const BackgroundContent = () => (
  <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif' }}>
    <h1 style={{ marginBottom: '16px', color: '#1F2937' }}>Page Title</h1>
    <p style={{ marginBottom: '12px', color: '#6B7280' }}>
      This is the page content behind the dialog. Click the button below to open the dialog.
    </p>
    <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
      The dialog uses a blur overlay instead of dim, making it ideal for settings screens.
    </p>
  </div>
);

// Sample settings content
const ProfileContent = () => (
  <div style={{ padding: '24px' }}>
    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
      Profile Settings
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>
          Display Name
        </label>
        <input
          type="text"
          defaultValue="John Doe"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>
          Email
        </label>
        <input
          type="email"
          defaultValue="john@example.com"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  </div>
);

const NotificationsContent = () => (
  <div style={{ padding: '24px' }}>
    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
      Notification Preferences
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {['Email notifications', 'Push notifications', 'Weekly digest'].map((item) => (
        <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
          <span style={{ fontSize: '14px', color: '#1F2937' }}>{item}</span>
        </label>
      ))}
    </div>
  </div>
);

const SecurityContent = () => (
  <div style={{ padding: '24px' }}>
    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
      Security Settings
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>
          Current Password
        </label>
        <input
          type="password"
          placeholder="Enter current password"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>
          New Password
        </label>
        <input
          type="password"
          placeholder="Enter new password"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  </div>
);

const BillingContent = () => (
  <div style={{ padding: '24px' }}>
    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
      Billing & Plans
    </h3>
    <div style={{ padding: '16px', background: '#F3F4F6', borderRadius: '8px', marginBottom: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937', marginBottom: '4px' }}>
        Current Plan: Pro
      </div>
      <div style={{ fontSize: '13px', color: '#6B7280' }}>
        $12/month • Renews on Feb 1, 2026
      </div>
    </div>
    <Button variant="outline" size="sm">
      Manage Subscription
    </Button>
  </div>
);

// Interactive demo with tabs
const DialogWithTabsDemo = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', icon: <User size={24} />, label: 'Profile' },
    { id: 'notifications', icon: <Bell size={24} />, label: 'Notifications' },
    { id: 'security', icon: <Lock size={24} />, label: 'Security' },
    { id: 'billing', icon: <CreditCard size={24} />, label: 'Billing' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileContent />;
      case 'notifications':
        return <NotificationsContent />;
      case 'security':
        return <SecurityContent />;
      case 'billing':
        return <BillingContent />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    const tab = tabs.find((t) => t.id === activeTab);
    return tab?.label || 'Settings';
  };

  return (
    <div style={{ minHeight: '500px' }}>
      <BackgroundContent />
      <div style={{ padding: '0 40px' }}>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Settings Dialog
        </Button>
      </div>
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={getTitle()}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
              Save Changes
            </Button>
          </div>
        }
        {...props}
      >
        {renderContent()}
      </Dialog>
    </div>
  );
};

// Simple dialog without tabs
const SimpleDialogDemo = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ minHeight: '400px' }}>
      <BackgroundContent />
      <div style={{ padding: '0 40px' }}>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Simple Dialog
        </Button>
      </div>
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Preferences"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
              Save
            </Button>
          </div>
        }
        {...props}
      >
        <div style={{ padding: '24px' }}>
          <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '22px', margin: 0 }}>
            This is a simple dialog without tabs. Use this for single-purpose settings
            or configuration screens that don't need multiple sections.
          </p>
        </div>
      </Dialog>
    </div>
  );
};

// Dialog without footer
const DialogWithoutFooterDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', icon: <User size={24} />, label: 'Profile' },
    { id: 'notifications', icon: <Bell size={24} />, label: 'Notifications' },
  ];

  return (
    <div style={{ minHeight: '400px' }}>
      <BackgroundContent />
      <div style={{ padding: '0 40px' }}>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Dialog (No Footer)
        </Button>
      </div>
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={activeTab === 'profile' ? 'Profile' : 'Notifications'}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'profile' ? <ProfileContent /> : <NotificationsContent />}
      </Dialog>
    </div>
  );
};

// Dialog with disabled tab
const DialogWithDisabledTabDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', icon: <User size={24} />, label: 'Profile' },
    { id: 'notifications', icon: <Bell size={24} />, label: 'Notifications' },
    { id: 'billing', icon: <CreditCard size={24} />, label: 'Billing', disabled: true },
  ];

  return (
    <div style={{ minHeight: '400px' }}>
      <BackgroundContent />
      <div style={{ padding: '0 40px' }}>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Dialog (Disabled Tab)
        </Button>
      </div>
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={activeTab === 'profile' ? 'Profile' : 'Notifications'}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
            Done
          </Button>
        }
      >
        {activeTab === 'profile' ? <ProfileContent /> : <NotificationsContent />}
      </Dialog>
    </div>
  );
};

// Playground
export const Playground = {
  args: {
    closeOnOverlayClick: true,
    closeOnEscape: true,
  },
  render: (args) => <DialogWithTabsDemo {...args} />,
};

// With Tabs (default usage)
export const WithTabs = {
  render: () => <DialogWithTabsDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Dialog with vertical tab navigation on the left side. Tabs allow users to switch between different settings sections.',
      },
    },
  },
};

// Without Tabs (simple panel)
export const WithoutTabs = {
  render: () => <SimpleDialogDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Dialog without tab navigation. Use this for single-purpose settings that don\'t need multiple sections.',
      },
    },
  },
};

// Without Footer
export const WithoutFooter = {
  render: () => <DialogWithoutFooterDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Dialog without footer section. Useful when settings are auto-saved or don\'t require explicit confirmation.',
      },
    },
  },
};

// With Disabled Tab
export const WithDisabledTab = {
  render: () => <DialogWithDisabledTabDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Dialog with a disabled tab. Disabled tabs cannot be clicked or focused.',
      },
    },
  },
};

// Tab States Showcase
export const TabStates = {
  render: () => (
    <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ marginBottom: '24px', color: '#1F2937' }}>Dialog Tab States</h2>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="dialog-tab"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'white',
              border: '1px solid #F3F4F6',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              color: '#9CA3AF',
            }}
          >
            <Bell size={24} />
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>Default</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: '#F3F4F6',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              color: '#6B7280',
            }}
          >
            <Bell size={24} />
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>Hover</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: '#ECEEFF',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              color: '#5E6AD2',
            }}
          >
            <Bell size={24} />
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>Active</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              color: '#E5E7EB',
              cursor: 'not-allowed',
            }}
          >
            <Bell size={24} />
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>Disabled</div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual showcase of all tab states: Default, Hover, Active, and Disabled.',
      },
    },
  },
};
