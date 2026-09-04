import React from 'react';
import { render } from '@testing-library/react';
import Page from './page';

jest.mock('next/navigation', () => ({
  usePathname: () => '/shifts/schedules',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() })
}));

jest.mock('@/lib/services/shiftService', () => ({
  getShifts: jest.fn().mockResolvedValue([]),
  getEmployeeShifts: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/services/employeeService', () => ({
  getEmployees: jest.fn().mockResolvedValue([]),
}));

describe('Shift Schedules Page', () => {
  it('renders weekly shift schedules calendar view without crashing', () => {
    const { container } = render(<Page />);
    expect(container).toBeTruthy();
  });
});
