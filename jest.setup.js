import '@testing-library/jest-dom';

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekgerzqnndvlvncpeyub.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-key';

// Global Supabase client mock for Jest test environment
jest.mock('@/lib/supabase/client', () => {
  const mockEmployee = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    employee_id: 'EMP-001',
    name: 'John Doe',
    email: 'john.doe@sandune.com',
    phone: '+1-555-0101',
    role: 'Site Engineer',
    department: 'Engineering',
    project: 'Skyline Tower',
    status: 'Active',
    joining_date: '2026-01-01',
    salary: 85000,
  };

  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null }),
    then: function (resolve) {
      return Promise.resolve({ data: [mockEmployee], error: null }).then(resolve);
    },
  };

  return {
    supabase: {
      from: jest.fn().mockReturnValue(queryBuilder),
    },
  };
});
