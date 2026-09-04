'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import { getMonthlyAttendance, AttendanceRecord } from '@/lib/services/attendanceService';
import { exportToCSV } from '@/lib/utils/csvExport';
import styles from '../../expenses/expenses.module.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface EmployeeMonthlySummary {
  employee: Employee;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  leaveCount: number;
  wfhCount: number;
  onDutyCount: number;
  totalLogged: number;
  attendanceRate: number; // percentage
}

export default function AttendanceReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [emps, records] = await Promise.all([
        getEmployees(),
        getMonthlyAttendance(selectedYear, selectedMonth),
      ]);
      setEmployees(emps);
      setAttendanceRecords(records);
    } catch (err) {
      console.error('Failed to load attendance report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  // Compute monthly summaries
  const summaries: EmployeeMonthlySummary[] = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    return employees.map(emp => {
      const empRecords = attendanceRecords.filter(r => r.employee_id === emp.id);

      let presentCount = 0;
      let absentCount = 0;
      let halfDayCount = 0;
      let leaveCount = 0;
      let wfhCount = 0;
      let onDutyCount = 0;

      for (const rec of empRecords) {
        switch (rec.status) {
          case 'Present':
            presentCount++;
            break;
          case 'Absent':
            absentCount++;
            break;
          case 'Half Day':
            halfDayCount++;
            break;
          case 'Leave':
            leaveCount++;
            break;
          case 'Work From Home':
            wfhCount++;
            break;
          case 'On Duty':
            onDutyCount++;
            break;
        }
      }

      const totalEffectivePresent = presentCount + wfhCount + onDutyCount + halfDayCount * 0.5;
      const totalLogged = empRecords.filter(r => r.status !== null).length;
      // Calculate rate based on logged days or working days
      const divisor = totalLogged > 0 ? totalLogged : Math.min(daysInMonth, 26);
      const attendanceRate = divisor > 0 ? Math.min(100, Math.round((totalEffectivePresent / divisor) * 100)) : 0;

      return {
        employee: emp,
        presentCount,
        absentCount,
        halfDayCount,
        leaveCount,
        wfhCount,
        onDutyCount,
        totalLogged,
        attendanceRate,
      };
    });
  }, [employees, attendanceRecords, selectedMonth, selectedYear]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return summaries.filter(s => {
      const matchesDept = !departmentFilter || s.employee.department === departmentFilter;
      const matchesSearch = !searchQuery ||
        s.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employee.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [summaries, departmentFilter, searchQuery]);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Overall KPI
  const avgAttendance = useMemo(() => {
    if (filteredSummaries.length === 0) return 0;
    const sum = filteredSummaries.reduce((acc, s) => acc + s.attendanceRate, 0);
    return Math.round(sum / filteredSummaries.length);
  }, [filteredSummaries]);

  const totalPresentCount = useMemo(() => {
    return filteredSummaries.reduce((acc, s) => acc + s.presentCount + s.wfhCount + s.onDutyCount, 0);
  }, [filteredSummaries]);

  const totalAbsentCount = useMemo(() => {
    return filteredSummaries.reduce((acc, s) => acc + s.absentCount, 0);
  }, [filteredSummaries]);

  const handleExportCSV = () => {
    const headers = [
      'Employee Name',
      'Role',
      'Department',
      'Month',
      'Year',
      'Present Days',
      'WFH Days',
      'On Duty Days',
      'Half Days',
      'Absent Days',
      'Leaves Taken',
      'Total Logged Days',
      'Attendance Rate (%)'
    ];

    const rows = filteredSummaries.map(s => [
      s.employee.name,
      s.employee.role,
      s.employee.department || '',
      MONTH_NAMES[selectedMonth - 1],
      selectedYear,
      s.presentCount,
      s.wfhCount,
      s.onDutyCount,
      s.halfDayCount,
      s.absentCount,
      s.leaveCount,
      s.totalLogged,
      `${s.attendanceRate}%`
    ]);

    exportToCSV(`Attendance_Report_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}`, headers, rows);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Monthly Attendance Reports</h1>
          <p className={styles.subtitle}>Aggregate monthly performance, attendance percentage, and absenteeism metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className={styles.newBtn} style={{ background: '#059669', borderColor: '#10b981' }}>
            📥 Export CSV
          </button>
          <Link href="/attendance" className={styles.actionSelect} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            ← Back to Daily Attendance
          </Link>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Month</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className={styles.fi}
              style={{ width: 'auto' }}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Year</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className={styles.fi}
              style={{ width: 'auto' }}
            >
              {[2024, 2025, 2026, 2027].map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Department</label>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className={styles.fi}
              style={{ width: 'auto', minWidth: '160px' }}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Search Staff</label>
            <input
              type="text"
              placeholder="Search name or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.fi}
              style={{ width: 'auto', minWidth: '180px' }}
            />
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Period: <strong style={{ color: '#fff' }}>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className={styles.summaryGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className={styles.sumCard}>
          <span className={styles.sumVal} style={{ color: '#6366f1' }}>{filteredSummaries.length}</span>
          <span className={styles.sumLabel}>Total Employees</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumVal} style={{ color: avgAttendance >= 80 ? '#10b981' : avgAttendance >= 60 ? '#f59e0b' : '#ef4444' }}>
            {avgAttendance}%
          </span>
          <span className={styles.sumLabel}>Avg Attendance Rate</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumVal} style={{ color: '#10b981' }}>{totalPresentCount}</span>
          <span className={styles.sumLabel}>Total Present Records</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumVal} style={{ color: '#ef4444' }}>{totalAbsentCount}</span>
          <span className={styles.sumLabel}>Total Absent Records</span>
        </div>
      </div>

      {/* Attendance Summary Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loading}>Generating attendance report...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th style={{ textAlign: 'center' }}>Present / WFH</th>
                <th style={{ textAlign: 'center' }}>Half Days</th>
                <th style={{ textAlign: 'center' }}>Absent</th>
                <th style={{ textAlign: 'center' }}>Leaves</th>
                <th style={{ textAlign: 'center' }}>Total Logged</th>
                <th style={{ minWidth: '160px' }}>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.map(s => {
                const totalPresent = s.presentCount + s.wfhCount + s.onDutyCount;
                const barColor = s.attendanceRate >= 85 ? '#10b981' : s.attendanceRate >= 65 ? '#f59e0b' : '#ef4444';

                return (
                  <tr key={s.employee.id}>
                    <td>
                      <div className={styles.boldCell}>{s.employee.name}</div>
                      <div className={styles.subCell}>{s.employee.role} {s.employee.department ? `• ${s.employee.department}` : ''}</div>
                    </td>
                    <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 600 }}>
                      {totalPresent}
                    </td>
                    <td style={{ textAlign: 'center', color: '#f59e0b' }}>
                      {s.halfDayCount}
                    </td>
                    <td style={{ textAlign: 'center', color: s.absentCount > 0 ? '#ef4444' : '#64748b' }}>
                      {s.absentCount}
                    </td>
                    <td style={{ textAlign: 'center', color: s.leaveCount > 0 ? '#818cf8' : '#64748b' }}>
                      {s.leaveCount}
                    </td>
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                      {s.totalLogged}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${s.attendanceRate}%`, height: '100%', background: barColor, borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: barColor, minWidth: '40px', textAlign: 'right' }}>
                          {s.attendanceRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSummaries.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.loading}>
                    No employee attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
