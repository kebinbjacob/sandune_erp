import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Sidebar } from '@/components/Sidebar';
import { AuthProvider } from '@/lib/context/AuthContext';

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

describe('Sidebar Component UI Test', () => {
  beforeEach(() => {
    localStorage.setItem(
      'sandune_auth_user',
      JSON.stringify({ id: '1', email: 'test@sandune.com', name: 'Test User', role: 'Admin' })
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders logo text and navigation groups with AuthProvider wrapper', () => {
    render(
      <AuthProvider>
        <Sidebar />
      </AuthProvider>
    );
    expect(screen.getByText('SanDune ERP')).toBeInTheDocument();
    expect(screen.getByText('Core HR')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });
});
