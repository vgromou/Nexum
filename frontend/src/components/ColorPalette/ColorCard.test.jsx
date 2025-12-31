import { render, screen } from '@testing-library/react';
import ColorCard from './ColorCard';

describe('ColorCard', () => {
    it('renders color name and css variable', () => {
        const props = {
            name: 'Primary Color',
            cssVar: '--primary-color',
        };

        render(<ColorCard {...props} />);

        expect(screen.getByText('Primary Color')).toBeInTheDocument();
        expect(screen.getByText('--primary-color')).toBeInTheDocument();
    });

    it('applies the correct background color style', () => {
        const props = {
            name: 'Secondary Color',
            cssVar: '--secondary-color',
        };

        const { container } = render(<ColorCard {...props} />);
        const previewElement = container.querySelector('.color-card__preview');
        expect(previewElement).toHaveStyle({ backgroundColor: 'var(--secondary-color)' });
    });
});
