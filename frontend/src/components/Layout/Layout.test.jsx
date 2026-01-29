import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Layout from './Layout';

// Mock sub-components to isolate Layout test
vi.mock('../Navigation/LeftSidebar', () => ({
    default: () => <div data-testid="left-sidebar">LeftSidebar</div>
}));
vi.mock('../Page/PageContent', () => ({
    default: () => <div data-testid="page-content">PageContent</div>
}));
vi.mock('../Page/RightSidebar', () => ({
    default: () => <div data-testid="right-sidebar">RightSidebar</div>
}));

describe('Layout', () => {
    it('renders all main layout sections', () => {
        render(<Layout />);

        expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('page-content')).toBeInTheDocument();
        expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
    });

    it('has correct layout structure', () => {
        const { container } = render(<Layout />);

        const layoutContainer = container.querySelector('.layout-container');
        expect(layoutContainer).toBeInTheDocument();

        const contentBlock = container.querySelector('.content-block');
        expect(contentBlock).toBeInTheDocument();
    });
});
