import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default {
  title: 'Components/Inputs',
  parameters: {
    layout: 'padded',
  },
};

const baseInputStyle = {
  fontFamily: 'var(--font-family-sans)',
  fontSize: 'var(--typography-input-size)',
  lineHeight: 'var(--typography-input-line-height)',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--background-primary)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  transition: 'var(--transition-fast)',
};

const TextInput = ({ placeholder, value, onChange, disabled, error, ...props }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    style={{
      ...baseInputStyle,
      padding: '8px 12px',
      width: '100%',
      maxWidth: '320px',
      borderColor: error ? 'var(--semantic-error)' : 'var(--border-default)',
      opacity: disabled ? 0.5 : 1,
    }}
    onFocus={(e) => {
      e.target.style.borderColor = error ? 'var(--semantic-error)' : 'var(--border-focus)';
      e.target.style.boxShadow = `0 0 0 2px ${error ? 'var(--semantic-error-light)' : 'var(--accent-primary-light)'}`;
    }}
    onBlur={(e) => {
      e.target.style.borderColor = error ? 'var(--semantic-error)' : 'var(--border-default)';
      e.target.style.boxShadow = 'none';
    }}
    {...props}
  />
);

const SearchInput = ({ placeholder = 'Search...', value, onChange }) => (
  <div style={{
    position: 'relative',
    width: '100%',
    maxWidth: '280px',
  }}>
    <Search
      size={16}
      style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--icons-default)',
      }}
    />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        ...baseInputStyle,
        padding: '8px 12px 8px 36px',
        width: '100%',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--border-focus)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--border-default)';
      }}
    />
  </div>
);

const LinkInput = ({ placeholder = 'Paste or type a link', value, onChange }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    style={{
      ...baseInputStyle,
      padding: '8px 12px',
      width: '100%',
      maxWidth: '280px',
      backgroundColor: 'var(--background-secondary)',
    }}
    onFocus={(e) => {
      e.target.style.borderColor = 'var(--border-focus)';
      e.target.style.backgroundColor = 'var(--background-primary)';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = 'var(--border-default)';
      e.target.style.backgroundColor = 'var(--background-secondary)';
    }}
  />
);

const EditableText = ({ value, onChange, placeholder }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <input
        type="text"
        value={value}
        onChange={onChange}
        onBlur={() => setIsEditing(false)}
        autoFocus
        style={{
          ...baseInputStyle,
          padding: '4px 8px',
          fontSize: '13px',
          backgroundColor: 'var(--background-primary)',
        }}
      />
    );
  }

  return (
    <span
      onDoubleClick={() => setIsEditing(true)}
      style={{
        padding: '4px 8px',
        fontSize: '13px',
        color: value ? 'var(--text-primary)' : 'var(--text-placeholder)',
        cursor: 'text',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      {value || placeholder}
    </span>
  );
};

const TextArea = ({ placeholder, value, onChange, rows = 4 }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    style={{
      ...baseInputStyle,
      padding: '12px',
      width: '100%',
      maxWidth: '400px',
      resize: 'vertical',
      minHeight: '80px',
    }}
    onFocus={(e) => {
      e.target.style.borderColor = 'var(--border-focus)';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = 'var(--border-default)';
    }}
  />
);

export const AllInputs = {
  render: () => {
    const [textValue, setTextValue] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [linkValue, setLinkValue] = useState('');
    const [editableValue, setEditableValue] = useState('Collection Name');
    const [textareaValue, setTextareaValue] = useState('');

    return (
      <div style={{ padding: '24px', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '32px' }}>Input Fields</h2>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Text Input</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Default
              </label>
              <TextInput
                placeholder="Enter text..."
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Disabled
              </label>
              <TextInput
                placeholder="Disabled input"
                disabled
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Error State
              </label>
              <TextInput
                placeholder="Invalid input"
                value="Invalid value"
                error
              />
              <span style={{ fontSize: '12px', color: 'var(--semantic-error)', marginTop: '4px', display: 'block' }}>
                This field is required
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Search Input</h3>
          <SearchInput
            placeholder="Filter..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Link Input</h3>
          <LinkInput
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Editable Text</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Double-click to edit:
          </p>
          <div style={{ padding: '8px', backgroundColor: 'var(--background-secondary)', borderRadius: '6px', width: 'fit-content' }}>
            <EditableText
              value={editableValue}
              onChange={(e) => setEditableValue(e.target.value)}
              placeholder="Enter name..."
            />
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Text Area</h3>
          <TextArea
            placeholder="Enter description..."
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
          />
        </div>
      </div>
    );
  },
};

export const InputStates = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Input States</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '320px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Default
          </label>
          <TextInput placeholder="Default state" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Filled
          </label>
          <TextInput value="Filled value" readOnly />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Disabled
          </label>
          <TextInput placeholder="Disabled" disabled />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Error
          </label>
          <TextInput value="Invalid" error />
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '24px' }}>
        Click on inputs to see focus state
      </p>
    </div>
  ),
};
