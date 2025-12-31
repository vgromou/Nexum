import { render, screen } from '@testing-library/react';
import IconShowcase from './IconShowcase';

describe('IconShowcase', () => {
    const MockIcon = ({ size, color, ...props }) => (
        <svg data-testid="mock-icon" width={size} height={size} fill={color} {...props} />
    );

    it('renders icon and name', () => {
        const props = {
            icon: MockIcon,
            name: 'Test Icon',
            color: 'red',
        };

        render(<IconShowcase {...props} />);

        expect(screen.getByText('Test Icon')).toBeInTheDocument();
        const icon = screen.getByTestId('mock-icon');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('fill', 'red');
        expect(icon).toHaveAttribute('width', '32');
        expect(icon).toHaveAttribute('height', '32');
    });
});
