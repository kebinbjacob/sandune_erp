import { getEmployees, createEmployee } from '../employeeService';
import { supabase } from '@/lib/supabase/client';

describe('employeeService - Standard Operations', () => {
  it('fetches employees successfully', async () => {
    const employees = await getEmployees();
    expect(employees).toBeDefined();
    expect(Array.isArray(employees)).toBe(true);
    expect(employees.length).toBeGreaterThan(0);
    expect(employees[0].name).toBe('John Doe');
  });

  it('creates employee successfully with valid data', async () => {
    const newEmp = {
      name: 'New Employee',
      role: 'Site Engineer',
      department: 'Engineering',
      project: 'Skyline Tower',
      email: 'new@example.com',
      phone: '+1-555-9999',
      status: 'Active',
    };
    const result = await createEmployee(newEmp);
    expect(result).toBeDefined();
    expect(result.name).toBe('John Doe'); // from mock
  });
});

describe('employeeService - Adversarial & Edge Cases', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handles empty string fields without client validation', async () => {
    const emptyEmp = {
      name: '',
      role: '',
      status: '',
    };
    const result = await createEmployee(emptyEmp);
    expect(supabase.from).toHaveBeenCalledWith('employees');
    expect(result).toBeDefined();
  });

  it('handles special characters, HTML/XSS payloads, and SQL injection strings', async () => {
    const maliciousEmp = {
      name: "<script>alert('xss')</script>",
      role: "'; DROP TABLE employees; --",
      department: "System & '\"\\/`",
      status: "Active",
    };
    const result = await createEmployee(maliciousEmp);
    expect(result).toBeDefined();
  });

  it('handles missing optional fields cleanly', async () => {
    const minimalEmp = {
      name: 'Jane Doe',
      role: 'Architect',
      status: 'Active',
    };
    const result = await createEmployee(minimalEmp);
    expect(result).toBeDefined();
  });

  it('re-throws error when Supabase getEmployees query fails', async () => {
    const mockError = { message: 'Supabase network error', details: '', hint: '', code: '500' };
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: mockError }),
    };
    (supabase.from as jest.Mock).mockReturnValueOnce(mockQueryBuilder);

    await expect(getEmployees()).rejects.toEqual(mockError);
  });

  it('re-throws error when Supabase createEmployee query fails (e.g. NOT NULL violation)', async () => {
    const mockError = { message: 'null value in column "name" violates not-null constraint', code: '23502' };
    const mockQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
    };
    (supabase.from as jest.Mock).mockReturnValueOnce(mockQueryBuilder);

    await expect(createEmployee({})).rejects.toEqual(mockError);
  });
});

