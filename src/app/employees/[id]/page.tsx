'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import { getDailyAttendance, STATUS_CONFIG, AttendanceStatus } from '@/lib/services/attendanceService';
import { supabase } from '@/lib/supabase/client';
import styles from './profile.module.css';

interface AttendanceRow {
  date: string;
  status: AttendanceStatus | null;
  remarks?: string;
  marked_by?: string;
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRow[]>([]);
  const [monthStats, setMonthStats] = useState({ present: 0, absent: 0, leave: 0, half: 0, notMarked: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      // Fetch employee
      const { data: emp } = await supabase.from('employees').select('*').eq('id', id).single();
      setEmployee(emp);

      // Last 30 days attendance
      const today = new Date();
      const rows: AttendanceRow[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        rows.push({ date: d.toISOString().split('T')[0], status: null });
      }

      const { data: att } = await supabase
        .from('attendance')
        .select('date, status, remarks, marked_by')
        .eq('employee_id', id)
        .gte('date', rows[0].date)
        .lte('date', rows[rows.length - 1].date);

      const attMap = new Map((att || []).map(a => [a.date, a]));
      const filled = rows.map(r => ({ ...r, ...attMap.get(r.date) }));

      setRecentAttendance(filled);

      // Compute stats
      const stats = { present: 0, absent: 0, leave: 0, half: 0, notMarked: 0 };
      filled.forEach(r => {
        if (!r.status) stats.notMarked++;
        else if (['Present', 'Work From Home', 'On Duty'].includes(r.status)) stats.present++;
        else if (r.status === 'Absent') stats.absent++;
        else if (r.status === 'Leave') stats.leave++;
        else if (r.status === 'Half Day') stats.half++;
      });
      setMonthStats(stats);
      setLoading(false);
    };
    load();
  }, [id]);

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const fmtFull = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  if (loading) return <div className={styles.loading}>Loading employee profile...</div>;
  if (!employee) return <div className={styles.loading}>Employee not found.</div>;

  const initials = employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const statusColors: Record<string, string> = { Active: '#10b981', 'On Leave': '#f59e0b', Inactive: '#ef4444' };

  return (
    <div className={styles.container}>
      {/* Back */}
      <button className={styles.backBtn} onClick={() => router.push('/employees')}>← Back to Employees</button>

      {/* Hero card */}
      <div className={styles.heroCard}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.heroInfo}>
          <h1 className={styles.empName}>{employee.name}</h1>
          <p className={styles.empRole}>{employee.role} {employee.department ? `· ${employee.department}` : ''}</p>
          <div className={styles.heroBadges}>
            <span className={styles.badge} style={{ color: statusColors[employee.status] || '#94a3b8', background: `${statusColors[employee.status]}22` }}>
              ● {employee.status}
            </span>
            {employee.employee_id && <span className={styles.badge}>{employee.employee_id}</span>}
            {employee.project && <span className={styles.badge}>📍 {employee.project}</span>}
          </div>
        </div>
        <div className={styles.heroActions}>
          <Link href={`/payroll?emp=${id}`} className={styles.actionBtn}>💰 Payroll</Link>
          <Link href={`/attendance?emp=${id}`} className={styles.actionBtn}>⏰ Attendance</Link>
        </div>
      </div>

      {/* Details + Stats grid */}
      <div className={styles.infoGrid}>
        {/* Contact Info */}
        <div className={styles.infoCard}>
          <h3 className={styles.cardTitle}>📋 Contact Details</h3>
          <div className={styles.infoRows}>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Email</span><span className={styles.infoValue}>{employee.email || '—'}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Phone</span><span className={styles.infoValue}>{employee.phone || '—'}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Department</span><span className={styles.infoValue}>{employee.department || '—'}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Project</span><span className={styles.infoValue}>{employee.project || '—'}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Joined</span><span className={styles.infoValue}>{employee.joining_date ? fmtFull(employee.joining_date) : '—'}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Monthly Salary</span><span className={styles.infoValue} style={{ color: '#10b981', fontWeight: 700 }}>{employee.salary ? `₹${Number(employee.salary).toLocaleString('en-IN')}` : '—'}</span></div>
          </div>
        </div>

        {/* 30-day attendance stats */}
        <div className={styles.infoCard}>
          <h3 className={styles.cardTitle}>📊 Last 30 Days Summary</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem} style={{ borderColor: '#10b981' }}>
              <span className={styles.statValue} style={{ color: '#10b981' }}>{monthStats.present}</span>
              <span className={styles.statLabel}>Present</span>
            </div>
            <div className={styles.statItem} style={{ borderColor: '#ef4444' }}>
              <span className={styles.statValue} style={{ color: '#ef4444' }}>{monthStats.absent}</span>
              <span className={styles.statLabel}>Absent</span>
            </div>
            <div className={styles.statItem} style={{ borderColor: '#6366f1' }}>
              <span className={styles.statValue} style={{ color: '#6366f1' }}>{monthStats.leave}</span>
              <span className={styles.statLabel}>Leave</span>
            </div>
            <div className={styles.statItem} style={{ borderColor: '#f59e0b' }}>
              <span className={styles.statValue} style={{ color: '#f59e0b' }}>{monthStats.half}</span>
              <span className={styles.statLabel}>Half Day</span>
            </div>
            <div className={styles.statItem} style={{ borderColor: '#64748b' }}>
              <span className={styles.statValue} style={{ color: '#94a3b8' }}>{monthStats.notMarked}</span>
              <span className={styles.statLabel}>Not Marked</span>
            </div>
          </div>
          {/* Attendance rate bar */}
          {(() => {
            const marked = 30 - monthStats.notMarked;
            const rate = marked > 0 ? Math.round((monthStats.present / marked) * 100) : 0;
            return (
              <div className={styles.rateBar}>
                <div className={styles.rateLabel}>Attendance Rate: <strong style={{ color: rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444' }}>{rate}%</strong></div>
                <div className={styles.rateTrack}><div className={styles.rateFill} style={{ width: `${rate}%`, background: rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444' }} /></div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Calendar heatmap */}
      <div className={styles.sectionCard}>
        <h3 className={styles.cardTitle}>📅 Attendance Calendar — Last 30 Days</h3>
        <div className={styles.calendarGrid}>
          {recentAttendance.map(row => {
            const cfg = row.status ? STATUS_CONFIG[row.status] : null;
            return (
              <div
                key={row.date}
                className={styles.calDay}
                style={{ background: cfg ? cfg.bg : 'rgba(255,255,255,0.03)', borderColor: cfg ? cfg.color + '44' : 'rgba(255,255,255,0.06)' }}
                title={`${row.date}: ${row.status || 'Not Marked'}${row.remarks ? ` — ${row.remarks}` : ''}`}
              >
                <span className={styles.calDate}>{fmt(row.date)}</span>
                <span className={styles.calStatus} style={{ color: cfg?.color || '#64748b' }}>
                  {cfg ? cfg.dot : '⚪'}
                </span>
                <span className={styles.calLabel} style={{ color: cfg?.color || '#64748b' }}>
                  {row.status ? row.status.split(' ')[0] : 'N/A'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
