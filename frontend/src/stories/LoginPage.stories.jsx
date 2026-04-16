import React from 'react';
import LoginPage from '../pages/LoginPage';

export default {
  title: 'Pages/LoginPage',
  component: LoginPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Full-page login screen with AuthModal centered on secondary background.',
      },
    },
  },
};

// Default
export const Default = {
  render: () => (
    <LoginPage
      onLogin={async ({ username, password }) => {
        console.log('Login:', username, password);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (username !== 'admin') {
          throw { field: 'username', message: 'There is no user with such Username' };
        }
        if (password !== 'password') {
          throw { field: 'password', message: 'Password is wrong' };
        }

        alert('Login successful!');
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use "admin" / "password" to login successfully.',
      },
    },
  },
};
