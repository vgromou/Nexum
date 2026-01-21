#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const TOKENS_DIR = '/Volumes/T9/Variables';
const OUTPUT_FILE = path.join(__dirname, '../src/styles/generated-tokens.css');

// Helper: Convert sRGB components to HEX
function componentsToHex(components, alpha = 1) {
  const r = Math.round(components[0] * 255);
  const g = Math.round(components[1] * 255);
  const b = Math.round(components[2] * 255);

  const toHex = (n) => n.toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return hex;
}

// Helper: Convert token name to CSS variable name
function tokenNameToVarName(path) {
  // Split by dots and process each segment
  return path
    .split('.')
    .map(segment => {
      // Convert camelCase/PascalCase to kebab-case
      return segment
        .replace(/([A-Z])/g, (m, match, offset) => {
          return offset === 0 ? match : '-' + match;
        })
        .toLowerCase();
    })
    .join('-');
}

// Helper: Process color token
function processColorToken(value) {
  if (typeof value === 'string') {
    // It's an alias like "{Text.Primary}"
    if (value.startsWith('{') && value.endsWith('}')) {
      const aliasPath = value.slice(1, -1);
      return `var(--${tokenNameToVarName(aliasPath)})`;
    }
    return value;
  }

  if (value.colorSpace === 'srgb') {
    return componentsToHex(value.components, value.alpha);
  }

  return value.hex || '#000000';
}

// Helper: Process number token
function processNumberToken(value) {
  return `${value}px`;
}

// Helper: Recursively extract tokens
function extractTokens(obj, path = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    // Skip special keys
    if (key.startsWith('$') || key === 'com') {
      continue;
    }

    const currentPath = path ? `${path}.${key}` : key;

    // Check if this is a token (has $value)
    if (value && typeof value === 'object' && '$value' in value) {
      const type = value.$type;

      if (type === 'color') {
        result[currentPath] = {
          type: 'color',
          value: processColorToken(value.$value)
        };
      } else if (type === 'number') {
        result[currentPath] = {
          type: 'number',
          value: processNumberToken(value.$value)
        };
      }
    } else if (value && typeof value === 'object') {
      // Recurse into nested objects
      extractTokens(value, currentPath, result);
    }
  }

  return result;
}

// Helper: Process shadow tokens
function processShadowTokens(tokens, prefix) {
  const sizes = ['sm', 'md', 'lg'];
  const shadows = {};

  sizes.forEach(size => {
    const xKey = `${prefix}.${size}.X`;
    const yKey = `${prefix}.${size}.Y`;
    const blurKey = `${prefix}.${size}.Blur`;
    const colorKey = `${prefix}.${size}.Color`;

    if (tokens[xKey] && tokens[yKey] && tokens[blurKey] && tokens[colorKey]) {
      const x = tokens[xKey].value;
      const y = tokens[yKey].value;
      const blur = tokens[blurKey].value;
      const color = tokens[colorKey].value;

      shadows[`${prefix.toLowerCase()}-${size}`] = `${x} ${y} ${blur} ${color}`;

      // Remove individual components
      delete tokens[xKey];
      delete tokens[yKey];
      delete tokens[blurKey];
      delete tokens[colorKey];
    }
  });

  return shadows;
}

// Helper: Process button tokens
function processButtonTokens(tokens, buttonName) {
  const states = ['default', 'hover', 'active', 'disabled'];
  const properties = ['bg', 'text', 'border'];
  const buttonVars = {};

  states.forEach(state => {
    properties.forEach(prop => {
      const key = `${prop}.${state}`;
      if (tokens[key]) {
        const varName = `button-${buttonName}-${prop}-${state}`;
        buttonVars[varName] = tokens[key].value;
        delete tokens[key];
      }
    });
  });

  return buttonVars;
}

// Main conversion function
function convertTokens() {
  console.log('🔄 Converting Figma tokens to CSS variables...\n');

  const allTokens = {};
  const buttonTokens = {};
  const shadowTokens = {};

  // Read main token files
  const mainFiles = [
    'Mode 1.tokens.json',
    'Mode 1.tokens 2.json',
    'Mode 1.tokens 3.json'
  ];

  mainFiles.forEach(file => {
    const filePath = path.join(TOKENS_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`📄 Reading ${file}...`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const tokens = extractTokens(data);
      Object.assign(allTokens, tokens);
    }
  });

  // Read button style files
  const buttonDir = path.join(TOKENS_DIR, 'Button Styles');
  if (fs.existsSync(buttonDir)) {
    console.log('\n📁 Reading button styles...');
    const buttonFiles = fs.readdirSync(buttonDir);

    buttonFiles.forEach(file => {
      if (file.endsWith('.tokens.json')) {
        const buttonName = file.replace('.tokens.json', '').toLowerCase().replace(/\s+/g, '-');
        console.log(`  - ${file}`);
        const filePath = path.join(buttonDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const tokens = extractTokens(data);
        const processed = processButtonTokens(tokens, buttonName);
        Object.assign(buttonTokens, processed);
      }
    });
  }

  // Read shadow files
  const shadowDir = path.join(TOKENS_DIR, 'Shadows');
  if (fs.existsSync(shadowDir)) {
    console.log('\n🌑 Reading shadow tokens...');
    const shadowFiles = fs.readdirSync(shadowDir);

    shadowFiles.forEach(file => {
      if (file.endsWith('.tokens.json')) {
        console.log(`  - ${file}`);
        const filePath = path.join(shadowDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const tokens = extractTokens(data);

        // Process shadows
        if (file.includes('Accent')) {
          const processed = processShadowTokens(tokens, 'shadow');
          Object.entries(processed).forEach(([key, value]) => {
            shadowTokens[`${key}-accent`] = value;
          });
        } else {
          const processed = processShadowTokens(tokens, 'shadow');
          Object.assign(shadowTokens, processed);
        }
      }
    });
  }

  // Generate CSS
  console.log('\n✍️  Generating CSS...');

  let css = `/*
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from Figma design tokens
 * Last updated: ${new Date().toISOString()}
 */

:root {
`;

  // Add spacing tokens
  css += `  /* ===== SPACING ===== */\n`;
  Object.entries(allTokens)
    .filter(([key]) => key.startsWith('Spacing.'))
    .sort()
    .forEach(([key, token]) => {
      const varName = `--space-${key.split('.')[1].toLowerCase()}`;
      css += `  ${varName}: ${token.value};\n`;
    });

  // Add border radius tokens
  css += `\n  /* ===== BORDER RADIUS ===== */\n`;
  Object.entries(allTokens)
    .filter(([key]) => key.startsWith('radius.'))
    .sort()
    .forEach(([key, token]) => {
      const varName = `--${tokenNameToVarName(key)}`;
      css += `  ${varName}: ${token.value};\n`;
    });

  // Add color tokens by category
  const colorCategories = [
    'Background',
    'Text',
    'Border',
    'Accent',
    'Semantic',
    'Interactive',
    'Surface',
    'Icons',
    'Comments',
    'Code',
    'Property',
    'Collection'
  ];

  colorCategories.forEach(category => {
    const categoryTokens = Object.entries(allTokens)
      .filter(([key]) => key.startsWith(`${category}.`))
      .sort();

    if (categoryTokens.length > 0) {
      css += `\n  /* ===== ${category.toUpperCase()} ===== */\n`;
      categoryTokens.forEach(([key, token]) => {
        const varName = `--${tokenNameToVarName(key)}`;
        css += `  ${varName}: ${token.value};\n`;
      });
    }
  });

  // Add shadow tokens
  if (Object.keys(shadowTokens).length > 0) {
    css += `\n  /* ===== SHADOWS ===== */\n`;
    css += `  /* Default shadows (black) */\n`;
    Object.entries(shadowTokens)
      .filter(([key]) => !key.includes('accent'))
      .sort()
      .forEach(([key, value]) => {
        css += `  --${key}: ${value};\n`;
      });

    css += `\n  /* Accent shadows (purple) */\n`;
    Object.entries(shadowTokens)
      .filter(([key]) => key.includes('accent'))
      .sort()
      .forEach(([key, value]) => {
        css += `  --${key}: ${value};\n`;
      });
  }

  // Add button tokens
  if (Object.keys(buttonTokens).length > 0) {
    css += `\n  /* ===== BUTTON STYLES ===== */\n`;

    // Group by button variant
    const buttonVariants = [...new Set(
      Object.keys(buttonTokens).map(key => {
        const parts = key.split('-');
        // button-primary-bg-default -> primary
        // button-destructive-ghost-bg-default -> destructive-ghost
        return parts.slice(1, -2).join('-');
      })
    )];

    buttonVariants.forEach(variant => {
      css += `\n  /* ${variant.charAt(0).toUpperCase() + variant.slice(1)} */\n`;
      Object.entries(buttonTokens)
        .filter(([key]) => {
          const parts = key.split('-');
          const keyVariant = parts.slice(1, -2).join('-');
          return keyVariant === variant;
        })
        .sort()
        .forEach(([key, value]) => {
          css += `  --${key}: ${value};\n`;
        });
    });
  }

  css += `}\n`;

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, css, 'utf8');

  console.log(`\n✅ Successfully generated CSS tokens!`);
  console.log(`📝 Output: ${OUTPUT_FILE}`);
  console.log(`\n📊 Summary:`);
  console.log(`   - ${Object.keys(allTokens).length} design tokens`);
  console.log(`   - ${Object.keys(buttonTokens).length} button style tokens`);
  console.log(`   - ${Object.keys(shadowTokens).length} shadow tokens`);
  console.log(`   - Total: ${Object.keys(allTokens).length + Object.keys(buttonTokens).length + Object.keys(shadowTokens).length} CSS variables\n`);
}

// Run conversion
try {
  convertTokens();
} catch (error) {
  console.error('❌ Error converting tokens:', error);
  process.exit(1);
}
