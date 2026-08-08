
import React from 'react';
import { render } from '@testing-library/react';
import Page from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams('?type=Test'),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() })
}));

// Mock Recharts to avoid DOM/SVG issues in JSDOM
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
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

describe('Attendance Page', () => {
  it('renders without crashing', () => {
    const { container } = render(<Page />);
    expect(container).toBeTruthy();
  });
});
