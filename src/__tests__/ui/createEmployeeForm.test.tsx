import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreatePage from '@/app/create/page';

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: vi.fn(),
    prefetch: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams('?type=Add+Employee'),
  usePathname: () => '/employees/new',
}));

// Mock employeeService
const mockCreateEmployee = vi.fn();

vi.mock('@/lib/services/employeeService', () => ({
  createEmployee: (...args: any[]) => mockCreateEmployee(...args),
}));

describe('CreateEmployeeForm UI Component & Interaction Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Employee creation form headers, input fields, and action buttons', async () => {
    render(<CreatePage />);

    expect(await screen.findByText('Add Employee')).toBeInTheDocument();
    expect(screen.getByText('Fill in the details below to add a new employee to the organization.')).toBeInTheDocument();

    expect(screen.getByPlaceholderText('Enter full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter role (e.g. Site Engineer)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter department')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter project name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter phone number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. EMP-005')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /save employee/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('updates form state when user interacts with inputs and dropdown', async () => {
    const user = userEvent.setup();
    render(<CreatePage />);

    const nameInput = (await screen.findByPlaceholderText('Enter full name')) as HTMLInputElement;
    const roleInput = screen.getByPlaceholderText('Enter role (e.g. Site Engineer)') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('Enter email address') as HTMLInputElement;
    const empIdInput = screen.getByPlaceholderText('e.g. EMP-005') as HTMLInputElement;
    const statusSelect = screen.getByRole('combobox') as HTMLSelectElement;

    await user.clear(nameInput);
    await user.type(nameInput, 'Michael Scott');

    await user.clear(roleInput);
    await user.type(roleInput, 'Regional Manager');

    await user.type(emailInput, 'm.scott@sandune.com');
    await user.type(empIdInput, 'EMP-100');

    await user.selectOptions(statusSelect, 'On Leave');

    expect(nameInput.value).toBe('Michael Scott');
    expect(roleInput.value).toBe('Regional Manager');
    expect(emailInput.value).toBe('m.scott@sandune.com');
    expect(empIdInput.value).toBe('EMP-100');
    expect(statusSelect.value).toBe('On Leave');
  });

  it('submits form data via createEmployee service and redirects to /employees on success', async () => {
    mockCreateEmployee.mockResolvedValueOnce({
      id: 'emp-new-1',
      employee_id: 'EMP-100',
      name: 'Michael Scott',
      role: 'Regional Manager',
      department: 'Engineering',
      project: 'Skyline Tower',
      email: 'm.scott@sandune.com',
      status: 'Active',
    });

    render(<CreatePage />);

    const nameInput = await screen.findByPlaceholderText('Enter full name');
    const emailInput = screen.getByPlaceholderText('Enter email address');
    const empIdInput = screen.getByPlaceholderText('e.g. EMP-005');
    const submitBtn = screen.getByRole('button', { name: /save employee/i });

    fireEvent.change(nameInput, { target: { value: 'Michael Scott' } });
    fireEvent.change(emailInput, { target: { value: 'm.scott@sandune.com' } });
    fireEvent.change(empIdInput, { target: { value: 'EMP-100' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateEmployee).toHaveBeenCalledWith({
        employee_id: 'EMP-100',
        name: 'Michael Scott',
        role: 'Site Engineer',
        department: 'Engineering',
        project: 'Skyline Tower',
        email: 'm.scott@sandune.com',
        phone: undefined,
        status: 'Active',
      });
      expect(mockPush).toHaveBeenCalledWith('/employees');
    });
  });

  it('displays user-friendly error box on duplicate key constraint violation (23505)', async () => {
    mockCreateEmployee.mockRejectedValueOnce({
      code: '23505',
      message: 'duplicate key value violates unique constraint',
    });

    render(<CreatePage />);

    const nameInput = await screen.findByPlaceholderText('Enter full name');
    const submitBtn = screen.getByRole('button', { name: /save employee/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('A record with this Employee ID or Email already exists. Please use a unique value.')).toBeInTheDocument();
    });
  });

  it('invokes router.back() when Cancel button is clicked', async () => {
    render(<CreatePage />);

    const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockBack).toHaveBeenCalled();
  });
});
