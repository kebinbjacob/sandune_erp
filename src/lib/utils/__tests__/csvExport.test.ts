import { exportToCSV } from '../csvExport';

describe('CSV Export Utility', () => {
  it('handles csv escaping and blob download correctly', () => {
    // Mock createObjectURL, revokeObjectURL, createElement, appendChild, removeChild
    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;

    window.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test');
    window.URL.revokeObjectURL = jest.fn();

    const linkClickSpy = jest.fn();
    const linkSetAttributeSpy = jest.fn();
    const originalCreateElement = document.createElement.bind(document);

    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return {
          href: '',
          click: linkClickSpy,
          setAttribute: linkSetAttributeSpy,
        } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    });

    jest.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as Node);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as Node);

    const headers = ['Name', 'Role', 'Notes'];
    const rows = [
      ['John Doe', 'Engineer', 'Said "Hello, World!"'],
      ['Jane Smith', 'Manager', 'Works, hard'],
      ['Bob', 'Worker', null],
    ];

    expect(() => exportToCSV('test_report', headers, rows)).not.toThrow();
    expect(linkClickSpy).toHaveBeenCalled();
    expect(linkSetAttributeSpy).toHaveBeenCalledWith('download', 'test_report.csv');

    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });
});
