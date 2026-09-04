'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getShifts, getEmployeeShifts, Shift, EmployeeShift } from '@/lib/services/shiftService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import styles from '../../expenses/expenses.module.css';

export default function ShiftSchedulesPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<EmployeeShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Current selected week start (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sun, 1 is Mon...
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, a, e] = await Promise.all([
        getShifts(),
        getEmployeeShifts(),
        getEmployees()
      ]);
      setShifts(s);
      setAssignments(a);
      setEmployees(e);
    } catch (err) {
      console.error('Error loading shift schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const changeWeek = (offsetWeeks: number) => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offsetWeeks * 7);
      return next;
    });
  };

  const resetToCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // Generate 7 days of the week [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(currentWeekStart);
    dayDate.setDate(dayDate.getDate() + i);
    return dayDate;
  });

  const formatDateYMD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Find active shift for an employee on a given date
  const getShiftForEmployeeOnDate = (employeeId: string, targetDate: Date): Shift | null => {
    const targetDateStr = formatDateYMD(targetDate);
    // Find all assignments for this employee with effective_from <= targetDate
    const validAssignments = assignments
      .filter(a => a.employee_id === employeeId && a.effective_from <= targetDateStr)
      .sort((a, b) => (a.effective_from > b.effective_from ? -1 : 1));

    if (validAssignments.length === 0) return null;
    const latest = validAssignments[0];
    if (latest.shifts) return latest.shifts;
    return shifts.find(s => s.id === latest.shift_id) || null;
  };

  const weekRangeLabel = `${weekDays[0].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Weekly Shift Schedules</h1>
          <p className={styles.subtitle}>Weekly calendar matrix of employee shift assignments (Mon–Sun).</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/shifts" className={styles.newBtn} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            ⚙️ Manage Shifts & Assignments
          </Link>
        </div>
      </header>

      {/* Week Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => changeWeek(-1)} className={styles.actionSelect} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            ◀ Prev Week
          </button>
          <button onClick={resetToCurrentWeek} className={styles.actionSelect} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            Current Week
          </button>
          <button onClick={() => changeWeek(1)} className={styles.actionSelect} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            Next Week ▶
          </button>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
          📅 {weekRangeLabel}
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
          <span>Total Staff: <strong style={{ color: '#fff' }}>{employees.length}</strong></span>
          <span>Defined Shifts: <strong style={{ color: '#fff' }}>{shifts.length}</strong></span>
        </div>
      </div>

      {/* Schedule Table */}
      <div className={styles.tableCard} style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className={styles.loading}>Loading shift schedules...</div>
        ) : (
          <table className={styles.table} style={{ minWidth: '950px' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Employee</th>
                {weekDays.map((d, index) => {
                  const isToday = formatDateYMD(d) === formatDateYMD(new Date());
                  const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
                  const dayNum = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  return (
                    <th key={index} style={{ textAlign: 'center', background: isToday ? 'rgba(99, 102, 241, 0.15)' : undefined, minWidth: '110px' }}>
                      <div style={{ color: isToday ? '#818cf8' : '#f8fafc', fontWeight: 600 }}>{dayName}</div>
                      <div style={{ fontSize: '0.75rem', color: isToday ? '#a5b4fc' : '#94a3b8', fontWeight: 400 }}>{dayNum}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className={styles.boldCell}>{emp.name}</div>
                    <div className={styles.subCell}>{emp.role} {emp.department ? `• ${emp.department}` : ''}</div>
                  </td>
                  {weekDays.map((dayDate, dayIdx) => {
                    const shift = getShiftForEmployeeOnDate(emp.id!, dayDate);
                    const isToday = formatDateYMD(dayDate) === formatDateYMD(new Date());
                    return (
                      <td key={dayIdx} style={{ textAlign: 'center', verticalAlign: 'middle', background: isToday ? 'rgba(99, 102, 241, 0.04)' : undefined, padding: '10px 8px' }}>
                        {shift ? (
                          <div style={{
                            background: 'rgba(99, 102, 241, 0.18)',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            borderRadius: '8px',
                            padding: '6px 8px',
                            display: 'inline-block',
                            width: '100%'
                          }}>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#a5b4fc' }}>{shift.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
                              {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>
                            Off / Unassigned
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.loading}>No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
