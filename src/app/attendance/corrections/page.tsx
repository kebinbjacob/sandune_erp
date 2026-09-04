'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import { getAllAuditLogs, AuditLogEntry, STATUS_CONFIG, AttendanceStatus } from '@/lib/services/attendanceService';
import styles from '../../expenses/expenses.module.css';

export default function AttendanceCorrectionsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, empsData] = await Promise.all([
        getAllAuditLogs({
          employeeId: employeeFilter || undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
        }),
        getEmployees(),
      ]);
      setLogs(logsData);
      setEmployees(empsData);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [employeeFilter, startDateFilter, endDateFilter]);

  const handleResetFilters = () => {
    setEmployeeFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const renderStatusBadge = (statusStr: string | null) => {
    if (!statusStr) {
      return <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.8rem' }}>None</span>;
    }
    const cfg = STATUS_CONFIG[statusStr as AttendanceStatus];
    if (cfg) {
      return (
        <span className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color, fontSize: '0.75rem', padding: '3px 8px' }}>
          {cfg.dot} {cfg.label}
        </span>
      );
    }
    return <span className={styles.categoryBadge}>{statusStr}</span>;
  };

  const uniqueEmployeesAffected = new Set(logs.map(l => l.employee_id)).size;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Attendance Corrections & Audit Log</h1>
          <p className={styles.subtitle}>Audit history of all manual status modifications, corrections, and punch overrides.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/attendance" className={styles.actionSelect} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            ← Back to Daily Attendance
          </Link>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Filter by Employee</label>
            <select
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
              className={styles.fi}
              style={{ width: 'auto', minWidth: '200px' }}
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Start Date</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={e => setStartDateFilter(e.target.value)}
              className={styles.fi}
              style={{ width: 'auto' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>End Date</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={e => setEndDateFilter(e.target.value)}
              className={styles.fi}
              style={{ width: 'auto' }}
            />
          </div>

          {(employeeFilter || startDateFilter || endDateFilter) && (
            <button
              onClick={handleResetFilters}
              className={styles.cancelBtn}
              style={{ alignSelf: 'flex-end', padding: '8px 12px', fontSize: '0.8rem', height: '38px' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Showing <strong style={{ color: '#fff' }}>{logs.length}</strong> log entries
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.summaryGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className={styles.sumCard}>
          <span className={styles.sumVal} style={{ color: '#6366f1' }}>{logs.length}</span>
          <span className={styles.sumLabel}>Total Audit Entries</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumVal} style={{ color: '#38bdf8' }}>{uniqueEmployeesAffected}</span>
          <span className={styles.sumLabel}>Employees Affected</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumVal} style={{ color: '#f59e0b' }}>
            {logs.filter(l => l.reason?.toLowerCase().includes('correction') || l.reason?.toLowerCase().includes('override') || l.reason?.toLowerCase().includes('bulk')).length}
          </span>
          <span className={styles.sumLabel}>Bulk & Correction Actions</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loading}>Loading audit log entries...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Employee</th>
                <th>Attendance Date</th>
                <th>Status Transition</th>
                <th>Reason</th>
                <th>Remarks</th>
                <th>Changed By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const changedDate = new Date(log.changed_at);
                const timeStr = changedDate.toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {timeStr}
                    </td>
                    <td>
                      <div className={styles.boldCell}>{log.employees?.name || 'Unknown Employee'}</div>
                      <div className={styles.subCell}>{log.employees?.role || ''} {log.employees?.department ? `• ${log.employees.department}` : ''}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {renderStatusBadge(log.previous_status)}
                        <span style={{ color: '#94a3b8' }}>→</span>
                        {renderStatusBadge(log.new_status)}
                      </div>
                    </td>
                    <td>
                      <span className={styles.subCell} style={{ color: '#e2e8f0' }}>
                        {log.reason || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.subCell} style={{ maxWidth: '200px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.remarks || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.categoryBadge} style={{ background: 'rgba(255,255,255,0.06)' }}>
                        👤 {log.changed_by}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.loading}>
                    No audit records match the selected filters.
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
