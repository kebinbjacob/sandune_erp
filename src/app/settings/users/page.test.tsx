import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserManagementPage from './page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/settings/users',
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() })
}));

describe('User Management Page (/settings/users)', () => {
  beforeEach(() => {
    localStorage.setItem(
      'sandune_auth_user',
      JSON.stringify({
        id: 'user-admin',
        email: 'admin@sandune.com',
        role: 'SUPER_ADMIN',
        status: 'Active',
        employees: { name: 'Super Admin', role: 'System Administrator' }
      })
    );
  });

  it('renders without crashing and displays header', async () => {
    const { container } = render(<UserManagementPage />);
    expect(container).toBeTruthy();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('+ Add User')).toBeInTheDocument();
  });

  it('loads and renders users table with actual user and linked employee details in DOM', async () => {
    render(<UserManagementPage />);

    // Table header should be rendered
    await waitFor(() => {
      expect(screen.getByText('Employee')).toBeInTheDocument();
      expect(screen.getByText('Email / Login')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });

    // Actual user records must populate the table rows
    await waitFor(() => {
      expect(
        screen.queryByText('sarah.smith@sandune.com') ||
        screen.queryByText('john.doe@sandune.com') ||
        screen.queryByText('admin@sandune.com')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Sarah Smith') ||
        screen.queryByText('John Doe') ||
        screen.queryByText('Kebin B Jacob')
      ).toBeInTheDocument();
    });

    // Confirm no error UI boxes exist
    expect(screen.queryByText(/Error Loading Data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Access Denied/i)).not.toBeInTheDocument();
  });
});
