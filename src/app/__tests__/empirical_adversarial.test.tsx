import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EmployeesPage from '../employees/page';
import CreatePage from '../create/page';
import { getEmployees, createEmployee } from '@/lib/services/employeeService';
import fs from 'fs';
import path from 'path';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
let mockSearchParams = new URLSearchParams('?type=Add%20Employee');
let mockPathname = '/create';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock employeeService
jest.mock('@/lib/services/employeeService', () => ({
  getEmployees: jest.fn(),
  createEmployee: jest.fn(),
}));

const mockGetEmployees = getEmployees as jest.Mock;
const mockCreateEmployee = createEmployee as jest.Mock;

describe('Empirical Adversarial Test Suite - Frontend & Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams('?type=Add%20Employee');
    mockPathname = '/create';
  });

  describe('1. Employees Page & Supabase Service Integration', () => {
    it('fetches live data from Supabase and renders table records', async () => {
      const liveMockEmployees = [
        {
          id: 'EMP-100',
          employee_id: 'EMP-100',
          name: 'Alice Live',
          role: 'Lead Architect',
          project: 'Solar Tower',
          status: 'Active',
        },
        {
          id: 'EMP-101',
          employee_id: 'EMP-101',
          name: 'Bob Live',
          role: 'Safety Inspector',
          project: 'Metro Line',
          status: 'On Leave',
        },
      ];

      mockGetEmployees.mockResolvedValueOnce(liveMockEmployees);

      await act(async () => {
        render(<EmployeesPage />);
      });

      expect(mockGetEmployees).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Alice Live')).toBeInTheDocument();
      expect(screen.getByText('Lead Architect')).toBeInTheDocument();
      expect(screen.getByText('Solar Tower')).toBeInTheDocument();
      expect(screen.getByText('Bob Live')).toBeInTheDocument();
    });

    it('handles getEmployees failure gracefully without crashing', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetEmployees.mockRejectedValueOnce(new Error('Supabase network error'));

      await act(async () => {
        render(<EmployeesPage />);
      });

      // Default mock fallback should remain visible on network failure
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it('EDGE CASE OBSERVATION: empty array returned from Supabase preserves default mock employees', async () => {
      // Testing the empirical observation: if Supabase returns [], if (data && data.length > 0) prevents replacing defaultMockEmployees
      mockGetEmployees.mockResolvedValueOnce([]);

      await act(async () => {
        render(<EmployeesPage />);
      });

      // Confirm that default mock employees remain displayed when Supabase returns []
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('filters employees by search term and role filter correctly', async () => {
      const mockData = [
        { id: '1', employee_id: 'EMP-001', name: 'John Smith', role: 'Site Engineer', project: 'Skyline', status: 'Active' },
        { id: '2', employee_id: 'EMP-002', name: 'Sarah Connor', role: 'Architect', project: 'Ocean View', status: 'Active' },
      ];
      mockGetEmployees.mockResolvedValueOnce(mockData);

      await act(async () => {
        render(<EmployeesPage />);
      });

      // Search input filtering
      const searchInput = screen.getByPlaceholderText('Search employees...');
      fireEvent.change(searchInput, { target: { value: 'Sarah' } });

      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();

      // Role dropdown filtering
      fireEvent.change(searchInput, { target: { value: '' } });
      const roleSelect = screen.getByRole('combobox');
      fireEvent.change(roleSelect, { target: { value: 'Site Engineer' } });

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.queryByText('Sarah Connor')).not.toBeInTheDocument();
    });
  });

  describe('2. Add Employee Form Submission & Validation (/create)', () => {
    it('renders Add Employee form when ?type=Add Employee', async () => {
      render(<CreatePage />);
      expect(screen.getByText('Add Employee')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter full name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter role (e.g. Site Engineer)')).toBeInTheDocument();
    });

    it('validates required fields (Name and Role)', () => {
      render(<CreatePage />);
      const nameInput = screen.getByPlaceholderText('Enter full name');
      const roleInput = screen.getByPlaceholderText('Enter role (e.g. Site Engineer)');

      expect(nameInput).toHaveAttribute('required');
      expect(roleInput).toHaveAttribute('required');
    });

    it('submits form data, auto-generates EMP-ID if blank, calls createEmployee and redirects to /employees', async () => {
      mockCreateEmployee.mockResolvedValueOnce({
        id: 'new-id',
        employee_id: 'EMP-999',
        name: 'Carlos Mendez',
        role: 'Site Supervisor',
        department: 'Operations',
        project: 'Metro Hub',
        status: 'Active',
      });

      render(<CreatePage />);

      const nameInput = screen.getByPlaceholderText('Enter full name');
      const roleInput = screen.getByPlaceholderText('Enter role (e.g. Site Engineer)');
      const submitBtn = screen.getByRole('button', { name: /Save Employee/i });

      fireEvent.change(nameInput, { target: { value: 'Carlos Mendez' } });
      fireEvent.change(roleInput, { target: { value: 'Site Supervisor' } });

      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(mockCreateEmployee).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Carlos Mendez',
          role: 'Site Supervisor',
          status: 'Active',
        })
      );
      // Auto-generated employee_id starts with EMP-
      expect(mockCreateEmployee.mock.calls[0][0].employee_id).toMatch(/^EMP-\d+$/);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/employees');
      });
    });

    it('uses provided custom Employee ID when explicitly entered', async () => {
      mockCreateEmployee.mockResolvedValueOnce({
        id: 'cust-id',
        employee_id: 'EMP-777',
        name: 'Jane Custom',
        role: 'Safety Lead',
        status: 'Active',
      });

      render(<CreatePage />);

      fireEvent.change(screen.getByPlaceholderText('Enter full name'), { target: { value: 'Jane Custom' } });
      fireEvent.change(screen.getByPlaceholderText('Enter role (e.g. Site Engineer)'), { target: { value: 'Safety Lead' } });
      fireEvent.change(screen.getByPlaceholderText('e.g. EMP-005'), { target: { value: 'EMP-777' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Save Employee/i }));
      });

      expect(mockCreateEmployee).toHaveBeenCalledWith(
        expect.objectContaining({
          employee_id: 'EMP-777',
          name: 'Jane Custom',
        })
      );
    });

    it('displays error message when createEmployee service fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateEmployee.mockRejectedValueOnce(new Error('Database RLS Policy Violation'));

      render(<CreatePage />);

      fireEvent.change(screen.getByPlaceholderText('Enter full name'), { target: { value: 'Blocked User' } });
      fireEvent.change(screen.getByPlaceholderText('Enter role (e.g. Site Engineer)'), { target: { value: 'Tester' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Save Employee/i }));
      });

      expect(await screen.findByText('Database RLS Policy Violation')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('3. Glassmorphic Design System & CSS Rules Integrity', () => {
    it('verifies glassmorphic CSS rules defined in globals.css', () => {
      const globalsCssPath = path.join(process.cwd(), 'src/app/globals.css');
      const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

      expect(globalsCss).toContain('--bg-primary: #0f172a');
      expect(globalsCss).toContain('--bg-secondary: #1e293b');
      expect(globalsCss).toContain('--bg-tertiary: rgba(30, 41, 59, 0.7)');
      expect(globalsCss).toContain('--border-light: rgba(255, 255, 255, 0.1)');
      expect(globalsCss).toContain('.glass');
      expect(globalsCss).toContain('backdrop-filter: blur(12px)');
      expect(globalsCss).toContain('-webkit-backdrop-filter: blur(12px)');
    });

    it('verifies Card component applies glass and hover-lift classes', () => {
      const cardPath = path.join(process.cwd(), 'src/components/Card.tsx');
      const cardCode = fs.readFileSync(cardPath, 'utf8');

      expect(cardCode).toContain("glass ? 'glass' : ''");
      expect(cardCode).toContain("hover-lift");
    });
  });
});
