const fs = require('fs');
const path = require('path');

const srcAppDir = 'c:/Users/kelvin babu/Downloads/sandune-main/sandune-main/src/app';

function createTest(dirPath, routeName) {
  const testPath = path.join(dirPath, 'page.test.tsx');
  let componentName = routeName === '' ? 'Dashboard' : routeName.split(/[/\\]/).pop();
  componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
  
  const testContent = `
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

describe('${componentName} Page', () => {
  it('renders without crashing', () => {
    const { container } = render(<Page />);
    expect(container).toBeTruthy();
  });
});
`;
  fs.writeFileSync(testPath, testContent);
}

function traverse(currentDir, routePath) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  let hasPage = false;
  for (const entry of entries) {
    if (entry.isDirectory()) {
      traverse(path.join(currentDir, entry.name), path.join(routePath, entry.name));
    } else if (entry.name === 'page.tsx') {
      hasPage = true;
    }
  }
  
  if (hasPage && !routePath.includes('api')) {
    createTest(currentDir, routePath.replace(/\\/g, '/'));
  }
}

traverse(srcAppDir, '');
console.log('Tests generated!');
