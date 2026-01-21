import React from 'react';
import StyleGuide from '../pages/StyleGuide';

export default {
  title: 'Design System/Overview',
  parameters: {
    layout: 'fullscreen',
  },
};

export const StyleGuideFullPage = {
  render: () => <StyleGuide />,
  parameters: {
    docs: {
      description: {
        story: 'Complete design system overview with all Figma tokens, colors, buttons, shadows, spacing, and typography.',
      },
    },
  },
};
