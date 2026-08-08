import { render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Sidebar Component', () => {
  it('renders logo text', () => {
    render(<Sidebar />);
    expect(screen.getByText('SanDune ERP')).toBeInTheDocument();
  });

  it('renders groups', () => {
    render(<Sidebar />);
    expect(screen.getByText('Core HR')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });
});
