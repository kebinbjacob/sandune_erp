import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders title if provided', () => {
    render(<Card title="My Title">Test Content</Card>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });
});
