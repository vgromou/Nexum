import { render, screen } from '@testing-library/react';
import PropertiesBar from './PropertiesBar';

describe('PropertiesBar', () => {
    it('renders property labels and values', () => {
        render(<PropertiesBar />);

        expect(screen.getByText('Property')).toBeInTheDocument();

        expect(screen.getByText('Created by')).toBeInTheDocument();
        expect(screen.getByText('User Name')).toBeInTheDocument();

        expect(screen.getByText('Last edited')).toBeInTheDocument();
        expect(screen.getByText('Tags')).toBeInTheDocument();
        expect(screen.getByText('Design')).toBeInTheDocument();
    });
});
