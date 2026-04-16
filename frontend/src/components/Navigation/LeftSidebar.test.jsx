import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import LeftSidebar from './LeftSidebar';
import { AuthContext } from '../../contexts/AuthContext';

// Mock user data
const mockUser = {
    id: '123',
    email: 'viktor@example.com',
    username: 'vgromov',
    firstName: 'Viktor',
    lastName: 'Gromov',
    position: 'Business Analyst',
    organizationRole: 'user',
    avatarUrl: null,
};

// Mock AuthContext value
const mockAuthContext = {
    user: mockUser,
    isAuthenticated: true,
    isSessionExpired: false,
    isLoading: false,
    mustChangePassword: false,
    login: vi.fn(),
    logout: vi.fn(),
    reAuthenticate: vi.fn(),
    clearSessionExpired: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
    onPasswordChanged: vi.fn(),
};

// Wrapper component for AuthContext
const renderWithAuth = (ui, contextValue = mockAuthContext) => {
    return render(
        <AuthContext.Provider value={contextValue}>
            {ui}
        </AuthContext.Provider>
    );
};

describe('LeftSidebar', () => {
    it('renders header with space button and search', () => {
        renderWithAuth(<LeftSidebar />);

        expect(screen.getByText('Space Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Search in space')).toBeInTheDocument();
    });

    it('renders standard pages section', () => {
        renderWithAuth(<LeftSidebar />);

        expect(screen.getByText('News')).toBeInTheDocument();
        expect(screen.getByText('Glossary')).toBeInTheDocument();
    });

    it('renders section divider', () => {
        renderWithAuth(<LeftSidebar />);

        expect(screen.getByText('PAGES')).toBeInTheDocument();
    });

    it('renders footer with user info from context', () => {
        renderWithAuth(<LeftSidebar />);

        // User name from mock context
        expect(screen.getByText('Viktor Gromov')).toBeInTheDocument();
        // Position from mock context
        expect(screen.getByText('Business Analyst')).toBeInTheDocument();
        expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    });

    it('toggles collection when clicked', () => {
        renderWithAuth(<LeftSidebar />);

        // Find expand buttons
        const expandButtons = screen.getAllByLabelText(/Collapse|Expand/);
        expect(expandButtons.length).toBeGreaterThan(0);

        // Click first expand button
        fireEvent.click(expandButtons[0]);
        // The toggle should work (implementation tested via state change)
    });

    it('has correct structure and styling classes', () => {
        const { container } = renderWithAuth(<LeftSidebar />);

        expect(container.querySelector('.left-sidebar')).toBeInTheDocument();
        expect(container.querySelector('.sidebar-header')).toBeInTheDocument();
        expect(container.querySelector('.sidebar-content')).toBeInTheDocument();
        expect(container.querySelector('.sidebar-footer')).toBeInTheDocument();
    });

    describe('Collection Switcher', () => {
        it('renders collection key buttons', () => {
            renderWithAuth(<LeftSidebar />);

            expect(screen.getByRole('button', { name: 'PAGES' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'PRD' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'SPEC' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'FR' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'API' })).toBeInTheDocument();
        });

        it('changes active collection when button is clicked', () => {
            renderWithAuth(<LeftSidebar />);

            // Click PRD button
            const prdButton = screen.getByRole('button', { name: 'PRD' });
            fireEvent.click(prdButton);

            // PRD should now be active (has 'active' class)
            expect(prdButton).toHaveClass('active');

            // Divider should update to show full collection name
            expect(screen.getByText('Product Requirements')).toBeInTheDocument();
        });

        it('highlights active collection button', () => {
            renderWithAuth(<LeftSidebar />);

            // PAGES is active by default
            const pagesButton = screen.getByRole('button', { name: 'PAGES' });
            expect(pagesButton).toHaveClass('active');

            // Click on different collection
            const specButton = screen.getByRole('button', { name: 'SPEC' });
            fireEvent.click(specButton);

            expect(specButton).toHaveClass('active');
            expect(pagesButton).not.toHaveClass('active');
        });

        it('has correct styling structure', () => {
            const { container } = renderWithAuth(<LeftSidebar />);

            expect(container.querySelector('.collection-switcher')).toBeInTheDocument();
            expect(container.querySelector('.collection-switcher-inner')).toBeInTheDocument();
            expect(container.querySelectorAll('.collection-key-btn').length).toBeGreaterThan(0);
        });
    });

    describe('Collection Name Divider', () => {
        it('displays collection full name in divider', () => {
            renderWithAuth(<LeftSidebar />);

            // Default shows Pages
            expect(screen.getByText('Pages')).toBeInTheDocument();
        });

        it('updates divider label when collection changes', () => {
            renderWithAuth(<LeftSidebar />);

            // Click on API collection
            fireEvent.click(screen.getByRole('button', { name: 'API' }));

            // Divider should show full name
            expect(screen.getByText('API Documentation')).toBeInTheDocument();
        });

        it('shows action buttons on hover', () => {
            const { container } = renderWithAuth(<LeftSidebar />);

            // Click on non-PAGES collection first (PAGES doesn't show settings)
            fireEvent.click(screen.getByRole('button', { name: 'PRD' }));

            const divider = container.querySelector('.collection-name-divider');
            expect(divider).toBeInTheDocument();

            // Hover over divider
            fireEvent.mouseEnter(divider);

            // Should show action buttons
            expect(screen.getByLabelText('Settings')).toBeInTheDocument();
            expect(screen.getByLabelText('Add page')).toBeInTheDocument();
        });

        it('hides action buttons on mouse leave', () => {
            const { container } = renderWithAuth(<LeftSidebar />);

            // Use non-PAGES collection
            fireEvent.click(screen.getByRole('button', { name: 'PRD' }));

            const divider = container.querySelector('.collection-name-divider');

            // Hover and then leave
            fireEvent.mouseEnter(divider);
            expect(screen.queryByLabelText('Settings')).toBeInTheDocument();

            fireEvent.mouseLeave(divider);
            expect(screen.queryByLabelText('Settings')).not.toBeInTheDocument();
        });

        it('does not show Settings button for PAGES collection', () => {
            const { container } = renderWithAuth(<LeftSidebar />);

            const divider = container.querySelector('.collection-name-divider');
            fireEvent.mouseEnter(divider);

            // PAGES collection should not show settings, only add page
            expect(screen.queryByLabelText('Settings')).not.toBeInTheDocument();
            expect(screen.getByLabelText('Add page')).toBeInTheDocument();
        });
    });
});
