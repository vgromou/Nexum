import { render, screen } from '@testing-library/react';
import ActivityBar from './ActivityBar';

describe('ActivityBar', () => {
    it('renders workspace buttons and actions', () => {
        render(<ActivityBar />);

        // Add workspace button
        expect(screen.getByLabelText('Add workspace')).toBeInTheDocument();

        // Workspace items
        expect(screen.getByLabelText('Red workspace')).toBeInTheDocument();
        expect(screen.getByLabelText('Orange workspace')).toBeInTheDocument();
        expect(screen.getByLabelText('Purple workspace')).toBeInTheDocument();

        // Bottom actions
        expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
        expect(screen.getByLabelText('User profile')).toBeInTheDocument();
    });
});
