import React from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link, Highlighter,
  ChevronDown, ChevronRight, Plus, Settings, MoreVertical, Search,
  Bell, Check, X, ExternalLink, Unlink, Type, Heading1
} from 'lucide-react';

export default {
  title: 'Components/Buttons',
  parameters: {
    layout: 'padded',
  },
};

// Base Button Styles
const baseButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-family-sans)',
  transition: 'var(--transition-fast)',
};

// Icon Button (32x32)
const IconButton = ({ icon: Icon, active = false, disabled = false, size = 18, ...props }) => (
  <button
    style={{
      ...baseButtonStyle,
      width: '32px',
      height: '32px',
      borderRadius: 'var(--radius-md)',
      backgroundColor: active ? 'var(--accent-primary-light)' : 'transparent',
      color: active ? 'var(--accent-primary)' : 'var(--icons-default)',
      opacity: disabled ? 0.5 : 1,
    }}
    disabled={disabled}
    {...props}
  >
    <Icon size={size} />
  </button>
);

// Text Button
const TextButton = ({ children, variant = 'default', size = 'default', ...props }) => {
  const sizes = {
    small: { fontSize: '13px', padding: '6px 12px' },
    default: { fontSize: '14px', padding: '8px 16px' },
    large: { fontSize: '16px', padding: '10px 20px' },
  };

  const variants = {
    default: {
      backgroundColor: 'var(--background-hover)',
      color: 'var(--text-primary)',
    },
    primary: {
      backgroundColor: 'var(--accent-primary)',
      color: 'var(--text-inverse)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
    },
    danger: {
      backgroundColor: 'var(--semantic-error-light)',
      color: 'var(--semantic-error)',
    },
  };

  return (
    <button
      style={{
        ...baseButtonStyle,
        ...sizes[size],
        ...variants[variant],
        borderRadius: 'var(--radius-md)',
        fontWeight: 500,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// Menu Item Button
const MenuItemButton = ({ icon: Icon, label, shortcut, highlighted = false, selected = false }) => (
  <button
    style={{
      ...baseButtonStyle,
      width: '100%',
      padding: '8px 12px',
      gap: '12px',
      justifyContent: 'flex-start',
      borderRadius: 'var(--radius-md)',
      backgroundColor: highlighted ? 'var(--background-hover)' : 'transparent',
      color: 'var(--text-primary)',
    }}
  >
    <Icon size={18} color="var(--icons-default)" />
    <span style={{ flex: 1, textAlign: 'left', fontSize: '14px' }}>{label}</span>
    {shortcut && (
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{shortcut}</span>
    )}
    {selected && <Check size={16} color="var(--accent-primary)" />}
  </button>
);

// Color Swatch Button
const ColorSwatchButton = ({ color, active = false, type = 'bg' }) => (
  <button
    style={{
      ...baseButtonStyle,
      width: '24px',
      height: '24px',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: color,
      border: active ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
      position: 'relative',
    }}
  >
    {type === 'text' && (
      <span style={{
        fontSize: '12px',
        fontWeight: 600,
        color: color === 'transparent' ? 'var(--text-primary)' : color,
      }}>
        A
      </span>
    )}
  </button>
);

// Collection Key Button
const CollectionKeyButton = ({ label, active = false }) => (
  <button
    style={{
      ...baseButtonStyle,
      padding: '4px 8px',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: active ? 'var(--background-active)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      fontSize: '12px',
      fontWeight: 500,
    }}
  >
    {label}
  </button>
);

export const FormattingButtons = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 600 }}>Formatting Menu Buttons</h3>

      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Text Formatting</h4>
        <div style={{ display: 'flex', gap: '4px', padding: '8px', backgroundColor: 'var(--background-secondary)', borderRadius: '8px', width: 'fit-content' }}>
          <IconButton icon={Bold} />
          <IconButton icon={Italic} />
          <IconButton icon={Underline} />
          <IconButton icon={Strikethrough} />
          <IconButton icon={Code} />
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Active States</h4>
        <div style={{ display: 'flex', gap: '4px', padding: '8px', backgroundColor: 'var(--background-secondary)', borderRadius: '8px', width: 'fit-content' }}>
          <IconButton icon={Bold} active />
          <IconButton icon={Italic} active />
          <IconButton icon={Underline} />
          <IconButton icon={Strikethrough} />
          <IconButton icon={Code} />
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Link & Color</h4>
        <div style={{ display: 'flex', gap: '4px', padding: '8px', backgroundColor: 'var(--background-secondary)', borderRadius: '8px', width: 'fit-content' }}>
          <IconButton icon={Link} />
          <IconButton icon={Highlighter} />
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Turn Into Button</h4>
        <button style={{
          ...baseButtonStyle,
          padding: '6px 12px',
          gap: '6px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          fontSize: '14px',
        }}>
          <Type size={16} />
          <span>Paragraph</span>
          <ChevronDown size={12} color="var(--text-tertiary)" />
        </button>
      </div>
    </div>
  ),
};

export const TextButtons = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 600 }}>Text Buttons</h3>

      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Variants</h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <TextButton variant="default">Default</TextButton>
          <TextButton variant="primary">Primary</TextButton>
          <TextButton variant="ghost">Ghost</TextButton>
          <TextButton variant="danger">Danger</TextButton>
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Sizes</h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <TextButton size="small" variant="primary">Small</TextButton>
          <TextButton size="default" variant="primary">Default</TextButton>
          <TextButton size="large" variant="primary">Large</TextButton>
        </div>
      </div>
    </div>
  ),
};

export const MenuItems = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 600 }}>Menu Item Buttons</h3>

      <div style={{
        width: '280px',
        padding: '8px',
        backgroundColor: 'var(--background-primary)',
        borderRadius: '8px',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <MenuItemButton icon={Type} label="Paragraph" shortcut="" selected />
        <MenuItemButton icon={Heading1} label="Heading 1" shortcut="#" highlighted />
        <MenuItemButton icon={Bold} label="Bold" shortcut="⌘B" />
        <MenuItemButton icon={Italic} label="Italic" shortcut="⌘I" />
      </div>
    </div>
  ),
};

export const ColorSwatches = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 600 }}>Color Swatch Buttons</h3>

      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Background Colors</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ColorSwatchButton color="transparent" />
          <ColorSwatchButton color="var(--color-highlight-gray-bg)" />
          <ColorSwatchButton color="var(--color-highlight-yellow-bg)" active />
          <ColorSwatchButton color="var(--color-highlight-green-bg)" />
          <ColorSwatchButton color="var(--color-highlight-blue-bg)" />
          <ColorSwatchButton color="var(--color-highlight-purple-bg)" />
          <ColorSwatchButton color="var(--color-highlight-red-bg)" />
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Text Colors</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ColorSwatchButton color="var(--text-primary)" type="text" />
          <ColorSwatchButton color="var(--color-highlight-gray-text)" type="text" />
          <ColorSwatchButton color="var(--color-highlight-green-text)" type="text" active />
          <ColorSwatchButton color="var(--color-highlight-blue-text)" type="text" />
          <ColorSwatchButton color="var(--color-highlight-purple-text)" type="text" />
          <ColorSwatchButton color="var(--color-highlight-red-text)" type="text" />
        </div>
      </div>
    </div>
  ),
};

export const NavigationButtons = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 600 }}>Navigation Buttons</h3>

      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Sidebar Actions</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <IconButton icon={Search} />
          <IconButton icon={Bell} />
          <IconButton icon={Settings} />
          <IconButton icon={Plus} />
          <IconButton icon={MoreVertical} />
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Expand/Collapse</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <IconButton icon={ChevronRight} size={16} />
          <IconButton icon={ChevronDown} size={16} />
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Collection Keys</h4>
        <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: 'var(--background-secondary)', borderRadius: '6px', width: 'fit-content' }}>
          <CollectionKeyButton label="PAGES" active />
          <CollectionKeyButton label="PRD" />
          <CollectionKeyButton label="SPEC" />
          <CollectionKeyButton label="FR" />
          <CollectionKeyButton label="API" />
        </div>
      </div>
    </div>
  ),
};

export const LinkPopoverButtons = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 600 }}>Link Popover Buttons</h3>

      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '8px',
        backgroundColor: 'var(--background-secondary)',
        borderRadius: '8px',
        width: 'fit-content',
      }}>
        <IconButton icon={Check} />
        <IconButton icon={Unlink} />
        <IconButton icon={ExternalLink} />
      </div>

      <div style={{ marginTop: '16px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Enabled State</h4>
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '8px',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '8px',
          width: 'fit-content',
        }}>
          <IconButton icon={Check} active />
          <IconButton icon={Unlink} active />
          <IconButton icon={ExternalLink} active />
        </div>
      </div>
    </div>
  ),
};
