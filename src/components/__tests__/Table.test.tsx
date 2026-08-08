import { render, screen } from '@testing-library/react';
import { Table } from '../Table';

describe('Table Component', () => {
  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Age', accessor: 'age' },
  ];
  const data = [
    { name: 'John', age: 30 },
    { name: 'Jane', age: 25 },
  ];

  it('renders table headers', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('renders table data rows', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders empty state when data is empty', () => {
    render(<Table columns={columns} data={[]} />);
    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });
});
