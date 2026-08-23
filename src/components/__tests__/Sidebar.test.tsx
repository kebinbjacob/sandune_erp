import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Sidebar } from '../Sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@sandune.com', name: 'Test User', role: 'Admin' },
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
