import React, { useState } from 'react';
import EmojiPicker from '../components/EmojiPicker/EmojiPicker';
import ColorPicker from '../components/Editor/ColorPicker';
import '../components/EmojiPicker/EmojiPicker.css';
import '../components/Editor/ColorPicker.css';

export default {
  title: 'Components/Pickers',
  parameters: {
    layout: 'padded',
  },
};

export const EmojiPickerStory = {
  name: 'Emoji Picker',
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [currentValue, setCurrentValue] = useState({ type: 'emoji', value: '🚀' });

    return (
      <div style={{ padding: '24px', minHeight: '500px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Emoji Picker</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Pick emojis or icons for page decoration.
        </p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Current:</span>
          <span style={{ fontSize: '32px' }}>{currentValue?.value || '—'}</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--background-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {isOpen ? 'Close' : 'Open'} Picker
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <EmojiPicker
            isOpen={isOpen}
            position={{ top: 0, left: 0 }}
            onSelect={(selection) => {
              setCurrentValue(selection);
              setIsOpen(false);
            }}
            onRemove={() => {
              setCurrentValue(null);
              setIsOpen(false);
            }}
            onClose={() => setIsOpen(false)}
            currentValue={currentValue}
            showRemove={true}
          />
        </div>
      </div>
    );
  },
};

export const ColorPickerStory = {
  name: 'Color Picker',
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [textColor, setTextColor] = useState('default');
    const [bgColor, setBgColor] = useState('default');

    return (
      <div style={{ padding: '24px', minHeight: '400px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Color Picker</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Pick text and background colors for text formatting.
        </p>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Text Color:
            </span>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                color: textColor === 'default' ? 'var(--text-primary)' : `var(--color-highlight-${textColor}-text)`,
              }}
            >
              {textColor}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Background Color:
            </span>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: bgColor === 'default' ? 'transparent' : `var(--color-highlight-${bgColor}-bg)`,
                border: '1px solid var(--border-default)',
              }}
            >
              {bgColor}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--background-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {isOpen ? 'Close' : 'Open'} Picker
          </button>
        </div>

        {isOpen && (
          <div style={{ position: 'relative' }}>
            <ColorPicker
              position={{ top: 0, left: 0 }}
              activeTextColor={textColor}
              activeBgColor={bgColor}
              onTextColorChange={(color) => setTextColor(color)}
              onBgColorChange={(color) => setBgColor(color)}
              onClose={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>
    );
  },
};

export const ColorPalette = {
  name: 'Color Palette',
  render: () => {
    const colors = ['default', 'gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'magenta', 'red'];

    return (
      <div style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Available Colors</h3>

        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Background Colors</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {colors.map((color) => (
              <div
                key={color}
                style={{
                  width: '80px',
                  padding: '16px 8px',
                  borderRadius: '8px',
                  backgroundColor: color === 'default' ? 'transparent' : `var(--color-highlight-${color}-bg)`,
                  border: '1px solid var(--border-default)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{color}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Text Colors</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {colors.map((color) => (
              <div
                key={color}
                style={{
                  width: '80px',
                  padding: '16px 8px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--background-secondary)',
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: color === 'default' ? 'var(--text-primary)' : `var(--color-highlight-${color}-text)`,
                  }}
                >
                  Aa
                </span>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{color}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
