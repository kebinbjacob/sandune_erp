'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import { getEmployeeAttendanceRange, AttendanceRecord, STATUS_CONFIG } from '@/lib/services/attendanceService';
import styles from '../../expenses/expenses.module.css';

export default function TimesheetsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected week start (Monday)
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Load employees list on initial render
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const emps = await getEmployees();
        setEmployees(emps);
        if (emps.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(emps[0].id!);
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  const formatDateYMD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate 7 days of selected week (Mon - Sun)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekStartDateStr = formatDateYMD(weekDays[0]);
  const weekEndDateStr = formatDateYMD(weekDays[6]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setLoading(false);
      return;
    }

    const loadTimesheet = async () => {
      setLoading(true);
      try {
        const data = await getEmployeeAttendanceRange(selectedEmployeeId, weekStartDateStr, weekEndDateStr);
        setRecords(data);
      } catch (err) {
        console.error('Failed to load timesheet records:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTimesheet();
  }, [selectedEmployeeId, weekStartDateStr, weekEndDateStr]);

  const changeWeek = (offset: number) => {
    setWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset * 7);
      return next;
    });
  };

  const resetToCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setWeekStart(monday);
  };

  // Calculate hours worked for a specific attendance record
  const computeDailyHours = (record?: AttendanceRecord): number => {
    if (!record || !record.status) return 0;

    if (record.check_in && record.check_out) {
      const [inH, inM] = record.check_in.split(':').map(Number);
      const [outH, outM] = record.check_out.split(':').map(Number);
      if (!isNaN(inH) && !isNaN(inM) && !isNaN(outH) && !isNaN(outM)) {
        const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
        if (totalMinutes > 0) {
          return Math.round((totalMinutes / 60) * 10) / 10;
        }
      }
    }

    switch (record.status) {
      case 'Present':
      case 'Work From Home':
      case 'On Duty':
        return 8;
      case 'Half Day':
        return 4;
      default:
        return 0;
    }
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  // Compute weekly aggregates
  const dailyEntries = weekDays.map(d => {
    const dateStr = formatDateYMD(d);
    const record = records.find(r => r.date === dateStr);
    const hours = computeDailyHours(record);
    return {
      date: d,
      dateStr,
      record,
      hours,
    };
  });

  const totalWeeklyHours = dailyEntries.reduce((sum, item) => sum + item.hours, 0);
  const overtimeHours = Math.max(0, Math.round((totalWeeklyHours - 40) * 10) / 10);
  const presentDaysCount = dailyEntries.filter(i => i.record && (i.record.status === 'Present' || i.record.status === 'Work From Home' || i.record.status === 'On Duty')).length;
  const halfDaysCount = dailyEntries.filter(i => i.record?.status === 'Half Day').length;

  const weekRangeLabel = `${weekDays[0].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Weekly Timesheets</h1>
          <p className={styles.subtitle}>Review logged working hours, check-ins/outs, and overtime calculations.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/attendance" className={styles.actionSelect} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            ← Back to Daily Attendance
          </Link>
        </div>
      </header>

      {/* Filter / Selector Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Select Employee:</label>
          <select
            value={selectedEmployeeId}
            onChange={e => setSelectedEmployeeId(e.target.value)}
            className={styles.fi}
            style={{ width: 'auto', minWidth: '240px' }}
          >
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.role} • {emp.department})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => changeWeek(-1)} className={styles.actionSelect} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
            ◀ Prev Week
          </button>
          <button onClick={resetToCurrentWeek} className={styles.actionSelect} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
            Current Week
          </button>
          <button onClick={() => changeWeek(1)} className={styles.actionSelect} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
            Next Week ▶
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className={styles.summaryGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className={styles.sumCard}>
          <span className={styles.sumVal} style={{ color: '#6366f1' }}>{totalWeeklyHours} hrs</span>
          <span className={styles.sumLabel}>Total Weekly Hours</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumVal} style={{ color: overtimeHours > 0 ? '#10b981' : '#64748b' }}>
            {overtimeHours} hrs
          </span>
          <span className={styles.sumLabel}>Overtime Hours (&gt;40h)</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumVal} style={{ color: '#10b981' }}>{presentDaysCount} days</span>
          <span className={styles.sumLabel}>Full Days Present</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumVal} style={{ color: '#f59e0b' }}>{halfDaysCount} days</span>
          <span className={styles.sumLabel}>Half Days</span>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className={styles.tableCard}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#f8fafc' }}>
            Timesheet for {selectedEmployee?.name || 'Employee'} ({weekRangeLabel})
          </span>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading timesheet entries...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Notes / Remarks</th>
                <th style={{ textAlign: 'right' }}>Hours Worked</th>
              </tr>
            </thead>
            <tbody>
              {dailyEntries.map((entry, index) => {
                const dayName = entry.date.toLocaleDateString('en-IN', { weekday: 'long' });
                const dateFormatted = entry.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
                const isToday = formatDateYMD(entry.date) === formatDateYMD(new Date());
                const status = entry.record?.status;
                const statusCfg = status ? STATUS_CONFIG[status] : null;

                return (
                  <tr key={index} style={{ background: isToday ? 'rgba(99, 102, 241, 0.04)' : undefined }}>
                    <td>
                      <div className={styles.boldCell} style={{ color: isToday ? '#818cf8' : undefined }}>
                        {dayName} {isToday && <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>(Today)</span>}
                      </div>
                    </td>
                    <td>{dateFormatted}</td>
                    <td>
                      {statusCfg ? (
                        <span
                          className={styles.statusBadge}
                          style={{ background: statusCfg.bg, color: statusCfg.color }}
                        >
                          {statusCfg.dot} {statusCfg.label}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          Not Marked
                        </span>
                      )}
                    </td>
                    <td>{entry.record?.check_in || '—'}</td>
                    <td>{entry.record?.check_out || '—'}</td>
                    <td>
                      <span className={styles.subCell} style={{ maxWidth: '240px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.record?.remarks || entry.record?.notes || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: entry.hours > 0 ? '#f8fafc' : '#64748b' }}>
                      {entry.hours > 0 ? `${entry.hours} hrs` : '0 hrs'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 600 }}>
                <td colSpan={6} style={{ textAlign: 'right', padding: '14px 20px', color: '#cbd5e1' }}>
                  Total Weekly Logged Hours:
                </td>
                <td style={{ textAlign: 'right', padding: '14px 20px', color: '#6366f1', fontSize: '1.1rem' }}>
                  {totalWeeklyHours} hrs
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}