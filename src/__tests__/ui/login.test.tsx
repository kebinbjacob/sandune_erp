import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LoginPage from '@/app/login/page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/login',
}));

// Mock AuthContext hook
const mockUseAuth = vi.fn();
vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: (...args: any[]) => mockUseAuth(...args),
}));

describe('LoginPage UI Component & Interaction Unit Tests', () => {
  let mockLogin: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin = vi.fn();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin,
      logout: vi.fn(),
    });
  });

  it('renders login card, header, input fields, and submit button', () => {
    render(<LoginPage />);

    expect(screen.getByText('SanDune ERP')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. john.doe@sandune.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('updates email and password input values when user types', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('e.g. john.doe@sandune.com') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

    await user.type(emailInput, 'john.doe@sandune.com');
    await user.type(passwordInput, 'secret123');

    expect(emailInput.value).toBe('john.doe@sandune.com');
    expect(passwordInput.value).toBe('secret123');
  });

  it('triggers login context function with entered credentials on form submission', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('e.g. john.doe@sandune.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'sarah.smith@sandune.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('sarah.smith@sandune.com', 'password123');
    });
  });

  it('renders error alert message when login attempt fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('User not found. Please check your email.'));
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('e.g. john.doe@sandune.com');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid@sandune.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('User not found. Please check your email.')).toBeInTheDocument();
    });
  });

  it('handles loading state during form submission and disables inputs', async () => {
    let resolveLogin: () => void;
    const pendingPromise = new Promise<void>((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockImplementationOnce(() => pendingPromise);

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('e.g. john.doe@sandune.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'john.doe@sandune.com' } });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: /signing in.../i })).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    // Clean up pending promise
    resolveLogin!();
  });
});
