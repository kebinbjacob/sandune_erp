import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Page from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/employees',
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() })
}));

// Mock Recharts to avoid DOM/SVG issues in JSDOM
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: () => <div>AreaChart</div>,
    BarChart: () => <div>BarChart</div>,
    PieChart: () => <div>PieChart</div>,
    Area: () => <div>Area</div>,
    XAxis: () => <div>XAxis</div>,
    YAxis: () => <div>YAxis</div>,
    CartesianGrid: () => <div>CartesianGrid</div>,
    Tooltip: () => <div>Tooltip</div>,
    Pie: () => <div>Pie</div>,
    Cell: () => <div>Cell</div>,
    Bar: () => <div>Bar</div>,
    Legend: () => <div>Legend</div>,
  };
});

describe('Employees Page', () => {
  it('renders without crashing and displays header', () => {
    const { container } = render(<Page />);
    expect(container).toBeTruthy();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('+ Add Employee')).toBeInTheDocument();
  });

  it('renders employees table with proper column headers and actual records in DOM', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Employee ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Sarah Smith')).toBeInTheDocument();
      expect(screen.getByText('EMP-001')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Error Loading Data/i)).not.toBeInTheDocument();
  });
});
