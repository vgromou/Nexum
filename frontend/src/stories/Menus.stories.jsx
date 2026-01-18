import React, { useState } from 'react';
import SlashCommandMenu from '../components/Editor/SlashCommandMenu';
import TurnIntoMenu from '../components/Editor/TurnIntoMenu';
import LinkPopover from '../components/Editor/LinkPopover';
import '../components/Editor/TurnIntoMenu.css';
import '../components/Editor/LinkPopover.css';
import '../components/Editor/BlockEditor.css';

export default {
  title: 'Components/Menus',
  parameters: {
    layout: 'padded',
  },
};

export const SlashMenu = {
  name: 'Slash Command Menu',
  render: () => {
    const [filter, setFilter] = useState('');
    const [selectedType, setSelectedType] = useState('paragraph');

    return (
      <div style={{ padding: '24px', minHeight: '500px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Slash Command Menu</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Type "/" in the editor to open this menu and select block types.
        </p>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Filter (simulates typing after "/"):
          </label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Type to filter..."
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
              fontSize: '14px',
              width: '200px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Selected: </span>
          <span style={{ fontWeight: 500 }}>{selectedType}</span>
        </div>

        <div style={{ position: 'relative' }}>
          <SlashCommandMenu
            position={{ top: 0, left: 0 }}
            filter={filter}
            currentBlockType={selectedType}
            onSelect={(type) => setSelectedType(type)}
            onClose={() => {}}
          />
        </div>
      </div>
    );
  },
};

export const TurnInto = {
  name: 'Turn Into Menu',
  render: () => {
    const [selectedType, setSelectedType] = useState('paragraph');

    return (
      <div style={{ padding: '24px', minHeight: '400px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Turn Into Menu</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Convert block to different type. Accessible from formatting menu.
        </p>

        <div style={{ marginBottom: '24px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Current block type: </span>
          <span style={{ fontWeight: 500 }}>{selectedType}</span>
        </div>

        <div style={{ position: 'relative' }}>
          <TurnIntoMenu
            position={{ top: 0, left: 0 }}
            currentBlockType={selectedType}
            onSelect={(type) => setSelectedType(type)}
            onClose={() => {}}
          />
        </div>
      </div>
    );
  },
};

export const LinkPopoverStory = {
  name: 'Link Popover',
  render: () => {
    const [url, setUrl] = useState('');
    const [appliedUrl, setAppliedUrl] = useState('');

    return (
      <div style={{ padding: '24px', minHeight: '200px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Link Popover</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Insert or edit links in text content.
        </p>

        {appliedUrl && (
          <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: 'var(--background-secondary)', borderRadius: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Applied link: </span>
            <a href={appliedUrl} style={{ color: 'var(--text-link)', fontSize: '13px' }}>{appliedUrl}</a>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <LinkPopover
            isOpen={true}
            position={{ top: 0, left: 0 }}
            currentUrl={url}
            isEditing={!!appliedUrl}
            onApply={(newUrl) => {
              setAppliedUrl(newUrl);
              setUrl(newUrl);
            }}
            onUnlink={() => {
              setAppliedUrl('');
              setUrl('');
            }}
            onClose={() => {}}
          />
        </div>
      </div>
    );
  },
};

export const BlockTypes = {
  name: 'Block Types Reference',
  render: () => {
    const blockTypes = [
      { type: 'paragraph', label: 'Paragraph', shortcut: '', description: 'Plain text' },
      { type: 'h1', label: 'Heading 1', shortcut: '#', description: 'Large heading' },
      { type: 'h2', label: 'Heading 2', shortcut: '##', description: 'Medium heading' },
      { type: 'h3', label: 'Heading 3', shortcut: '###', description: 'Small heading' },
      { type: 'h4', label: 'Heading 4', shortcut: '####', description: 'Smallest heading' },
      { type: 'bulleted-list', label: 'Bulleted list', shortcut: '-', description: 'Unordered list' },
      { type: 'numbered-list', label: 'Numbered list', shortcut: '1.', description: 'Ordered list' },
      { type: 'quote', label: 'Quote', shortcut: '"', description: 'Block quote' },
    ];

    return (
      <div style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Block Types</h3>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Type</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Label</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Shortcut</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {blockTypes.map((block) => (
              <tr key={block.type} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <code style={{
                    fontSize: '12px',
                    backgroundColor: 'var(--code-background)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}>
                    {block.type}
                  </code>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{block.label}</td>
                <td style={{ padding: '12px 16px' }}>
                  {block.shortcut ? (
                    <code style={{
                      fontSize: '12px',
                      backgroundColor: 'var(--background-tertiary)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: 'var(--text-secondary)',
                    }}>
                      {block.shortcut}
                    </code>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{block.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};
