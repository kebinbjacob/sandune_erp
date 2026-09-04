import React from 'react';
import { render } from '@testing-library/react';
import Page from './page';

jest.mock('next/navigation', () => ({
  usePathname: () => '/attendance/corrections',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() })
}));

jest.mock('@/lib/services/attendanceService', () => ({
  getAllAuditLogs: jest.fn().mockResolvedValue([]),
  STATUS_CONFIG: {
    Present: { label: 'Present', color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '🟢' },
    Absent: { label: 'Absent', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', dot: '🔴' },
    'Half Day': { label: 'Half Day', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '🟡' },
  },
}));

jest.mock('@/lib/services/employeeService', () => ({
  getEmployees: jest.fn().mockResolvedValue([]),
}));

describe('Attendance Corrections Page', () => {
  it('renders attendance audit log and corrections view without crashing', () => {
    const { container } = render(<Page />);
    expect(container).toBeTruthy();
  });
});
