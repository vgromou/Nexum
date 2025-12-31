import { render, screen } from '@testing-library/react';
import Layout from './Layout';

// Mock sub-components to isolate Layout test
vi.mock('../Navigation/ActivityBar', () => ({
    default: () => <div data-testid="activity-bar">ActivityBar</div>
}));
vi.mock('../Navigation/SpaceHierarchy', () => ({
    default: () => <div data-testid="space-hierarchy">SpaceHierarchy</div>
}));
vi.mock('../Page/PageContent', () => ({
    default: () => <div data-testid="page-content">PageContent</div>
}));
vi.mock('../Page/PropertiesBar', () => ({
    default: () => <div data-testid="properties-bar">PropertiesBar</div>
}));

describe('Layout', () => {
    it('renders all main layout sections', () => {
        render(<Layout />);

        expect(screen.getByTestId('activity-bar')).toBeInTheDocument();
        expect(screen.getByTestId('space-hierarchy')).toBeInTheDocument();
        expect(screen.getByTestId('page-content')).toBeInTheDocument();
        expect(screen.getByTestId('properties-bar')).toBeInTheDocument();
    });
});
