import React from 'react';
import { render } from '@testing-library/react';
import Page from './page';

jest.mock('next/navigation', () => ({
  usePathname: () => '/attendance/reports',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() })
}));

jest.mock('@/lib/services/attendanceService', () => ({
  getMonthlyAttendance: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/services/employeeService', () => ({
  getEmployees: jest.fn().mockResolvedValue([]),
}));

describe('Attendance Reports Page', () => {
  it('renders monthly attendance report without crashing', () => {
    const { container } = render(<Page />);
    expect(container).toBeTruthy();
  });
});
