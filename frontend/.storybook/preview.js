// Import global styles
import '../src/styles/variables.css';
import '../src/styles/button-utilities.css';
import '../src/index.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#FFFFFF' },
        { name: 'dark', value: '#1F2937' },
        { name: 'sidebar', value: '#FAFBFC' },
      ],
    },
    layout: 'padded',
  },
};

export default preview;
