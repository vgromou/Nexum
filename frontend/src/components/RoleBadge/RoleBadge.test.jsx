import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RoleBadge from './RoleBadge';

describe('RoleBadge', () => {
    describe('Basic rendering', () => {
        it('renders role name', () => {
            render(<RoleBadge role="Admin" />);
            expect(screen.getByText('Admin')).toBeInTheDocument();
        });

        it('renders with correct class', () => {
            const { container } = render(<RoleBadge role="Member" />);
            expect(container.querySelector('.role-badge')).toBeInTheDocument();
        });

        it('applies custom className', () => {
            const { container } = render(<RoleBadge role="Admin" className="custom-class" />);
            const badge = container.querySelector('.role-badge');
            expect(badge).toHaveClass('custom-class');
        });
    });

    describe('Without label', () => {
        it('renders just the badge without container', () => {
            const { container } = render(<RoleBadge role="Admin" />);
            expect(container.querySelector('.role-badge-container')).not.toBeInTheDocument();
            expect(container.querySelector('.role-badge')).toBeInTheDocument();
        });

        it('does not render scope label', () => {
            render(<RoleBadge role="Admin" />);
            expect(screen.queryByText('Organization')).not.toBeInTheDocument();
            expect(screen.queryByText('Space')).not.toBeInTheDocument();
        });
    });

    describe('With label', () => {
        it('renders with container when showLabel is true', () => {
            const { container } = render(<RoleBadge role="Admin" showLabel />);
            expect(container.querySelector('.role-badge-container')).toBeInTheDocument();
        });

        it('renders Organization label for organization scope', () => {
            render(<RoleBadge role="Member" scope="organization" showLabel />);
            expect(screen.getByText('Organization')).toBeInTheDocument();
            expect(screen.getByText('Member')).toBeInTheDocument();
        });

        it('renders Space label for space scope', () => {
            render(<RoleBadge role="Admin" scope="space" showLabel />);
            expect(screen.getByText('Space')).toBeInTheDocument();
            expect(screen.getByText('Admin')).toBeInTheDocument();
        });

        it('defaults to Organization when scope is not specified', () => {
            render(<RoleBadge role="Member" showLabel />);
            expect(screen.getByText('Organization')).toBeInTheDocument();
        });

        it('has correct label class', () => {
            const { container } = render(<RoleBadge role="Admin" showLabel />);
            expect(container.querySelector('.role-badge__label')).toBeInTheDocument();
        });
    });

    describe('Scopes', () => {
        it('renders organization scope badge with primary colors', () => {
            const { container } = render(<RoleBadge role="Member" scope="organization" />);
            const badge = container.querySelector('.role-badge');
            expect(badge).toBeInTheDocument();
            expect(badge).not.toHaveClass('role-badge--space');
        });

        it('renders space scope badge with secondary colors', () => {
            const { container } = render(<RoleBadge role="Admin" scope="space" />);
            const badge = container.querySelector('.role-badge');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('role-badge--space');
        });
    });
});
