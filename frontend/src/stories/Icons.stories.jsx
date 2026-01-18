import React from 'react';
import * as LucideIcons from 'lucide-react';

export default {
  title: 'Design System/Icons',
  parameters: {
    layout: 'fullscreen',
  },
};

// Common icons used in the app
const APP_ICONS = [
  // Navigation
  'Search', 'Bell', 'Settings', 'Plus', 'MoreVertical', 'MoreHorizontal',
  'ChevronRight', 'ChevronDown', 'ChevronLeft', 'ChevronUp',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'X', 'Check', 'Minus',

  // Files & Documents
  'FileText', 'File', 'Folder', 'FolderOpen', 'Newspaper', 'BookOpen',

  // Text Formatting
  'Bold', 'Italic', 'Underline', 'Strikethrough', 'Code',
  'Type', 'Heading1', 'Heading2', 'Heading3', 'Heading4',
  'List', 'ListOrdered', 'Quote', 'Link', 'Unlink',
  'Highlighter', 'Palette',

  // Actions
  'Edit', 'Trash2', 'Copy', 'Clipboard', 'Download', 'Upload',
  'ExternalLink', 'Share', 'Send', 'Save',

  // Media
  'Image', 'Video', 'Music', 'Camera',

  // User
  'User', 'Users', 'UserPlus', 'UserMinus',

  // Misc
  'Star', 'Heart', 'Bookmark', 'Flag', 'Tag', 'Hash',
  'Calendar', 'Clock', 'Globe', 'Home', 'Mail',
  'MessageSquare', 'MessageCircle', 'AlertCircle', 'Info', 'HelpCircle',
  'Dices', 'GripVertical', 'Move', 'Maximize2', 'Minimize2',
];

const IconGrid = ({ icons, size = 24, color = 'currentColor' }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '16px',
  }}>
    {icons.map((iconName) => {
      const Icon = LucideIcons[iconName];
      if (!Icon) return null;
      return (
        <div
          key={iconName}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'var(--background-secondary)',
            border: '1px solid var(--border-light)',
            transition: 'var(--transition-fast)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--background-hover)';
            e.currentTarget.style.borderColor = 'var(--border-default)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-light)';
          }}
        >
          <Icon size={size} color={color} />
          <span style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            wordBreak: 'break-word'
          }}>
            {iconName}
          </span>
        </div>
      );
    })}
  </div>
);

const IconsPage = () => (
  <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
      Icons
    </h1>
    <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
      Icons from Lucide React used throughout the application.
    </p>

    <div style={{ marginBottom: '48px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
        Icon Sizes
      </h2>
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', marginBottom: '24px' }}>
        {[14, 16, 18, 20, 24, 32].map((size) => (
          <div key={size} style={{ textAlign: 'center' }}>
            <LucideIcons.FileText size={size} color="var(--text-primary)" />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>{size}px</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ marginBottom: '48px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
        Icon Colors
      </h2>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {[
          { name: 'Default', color: 'var(--icons-default)' },
          { name: 'Hover', color: 'var(--icons-hover)' },
          { name: 'Active', color: 'var(--icons-active)' },
          { name: 'Disabled', color: 'var(--icons-disabled)' },
          { name: 'Success', color: 'var(--semantic-success)' },
          { name: 'Error', color: 'var(--semantic-error)' },
          { name: 'Warning', color: 'var(--semantic-warning)' },
        ].map(({ name, color }) => (
          <div key={name} style={{ textAlign: 'center' }}>
            <LucideIcons.Star size={24} color={color} fill={name === 'Active' ? color : 'none'} />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>{name}</div>
          </div>
        ))}
      </div>
    </div>

    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
      All Application Icons
    </h2>
    <IconGrid icons={APP_ICONS} size={20} color="var(--text-primary)" />
  </div>
);

export const AllIcons = {
  render: () => <IconsPage />,
  parameters: {
    docs: {
      description: {
        story: 'All Lucide icons used in the application.',
      },
    },
  },
};

export const IconSizes = {
  render: () => (
    <div style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Icon Sizes</h2>
      <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
        {[12, 14, 16, 18, 20, 24, 32, 48].map((size) => (
          <div key={size} style={{ textAlign: 'center' }}>
            <LucideIcons.Bell size={size} />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>{size}px</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const StrokeWidths = {
  render: () => (
    <div style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Stroke Widths</h2>
      <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
        {[1, 1.5, 2, 2.5, 3].map((strokeWidth) => (
          <div key={strokeWidth} style={{ textAlign: 'center' }}>
            <LucideIcons.Settings size={32} strokeWidth={strokeWidth} />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>{strokeWidth}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};
