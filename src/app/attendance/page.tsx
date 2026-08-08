'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDailyAttendance,
  markAttendance,
  bulkMarkAttendance,
  getAuditLog,
  STATUS_CONFIG,
  ALL_STATUSES,
  AttendanceRecord,
  AttendanceStatus,
  AuditLogEntry,
} from '@/lib/services/attendanceService';
import styles from './daily.module.css';

const today = new Date().toISOString().split('T')[0];

export default function DailyAttendancePage() {
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filtered, setFiltered] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Mark modal state
  const [markModal, setMarkModal] = useState<{ record: AttendanceRecord } | null>(null);
  const [markStatus, setMarkStatus] = useState<AttendanceStatus>('Present');
  const [markReason, setMarkReason] = useState('');
  const [markRemarks, setMarkRemarks] = useState('');
  const [markSaving, setMarkSaving] = useState(false);

  // Audit log modal
  const [auditModal, setAuditModal] = useState<{ record: AttendanceRecord; logs: AuditLogEntry[] } | null>(null);

  // Bulk modal
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>('Present');
  const [bulkSaving, setBulkSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDailyAttendance(date);
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter logic
  useEffect(() => {
    let result = records;
    if (search) result = result.filter(r => r.employees?.name.toLowerCase().includes(search.toLowerCase()) || r.employees?.role.toLowerCase().includes(search.toLowerCase()));
    if (deptFilter !== 'All') result = result.filter(r => r.employees?.department === deptFilter);
    if (projectFilter !== 'All') result = result.filter(r => r.employees?.project === projectFilter);
    setFiltered(result);
  }, [records, search, deptFilter, projectFilter]);

  const departments = ['All', ...Array.from(new Set(records.map(r => r.employees?.department).filter(Boolean) as string[]))];
  const projects = ['All', ...Array.from(new Set(records.map(r => r.employees?.project).filter(Boolean) as string[]))];

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const openMarkModal = (record: AttendanceRecord) => {
    setMarkModal({ record });
    setMarkStatus(record.status ?? 'Present');
    setMarkReason('');
    setMarkRemarks('');
  };

  const handleMark = async () => {
    if (!markModal) return;
    setMarkSaving(true);
    try {
      await markAttendance(markModal.record.employee_id, date, markStatus, markReason, markRemarks, markModal.record);
      setMarkModal(null);
      await fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to save attendance.');
    } finally {
      setMarkSaving(false);
    }
  };

  const openAuditLog = async (record: AttendanceRecord) => {
    const logs = await getAuditLog(record.employee_id, date);
    setAuditModal({ record, logs });
  };

  const handleBulkMark = async () => {
    setBulkSaving(true);
    try {
      await bulkMarkAttendance(Array.from(selected), date, bulkStatus);
      setBulkModal(false);
      setSelected(new Set());
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setBulkSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.employee_id)));
  };

  // Summary counts
  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = records.filter(r => r.status === s).length;
    return acc;
  }, {} as Record<string, number>);
  const notMarked = records.filter(r => !r.status).length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Daily Attendance</h1>
          <p className={styles.subtitle}>Admin panel — mark and manage daily employee presence</p>
        </div>
        <div className={styles.headerActions}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>
      </header>

      {/* Summary strip */}
      <div className={styles.summaryStrip}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryCount}>{records.length}</span>
          <span className={styles.summaryLabel}>Total</span>
        </div>
        {(['Present', 'Absent', 'Half Day', 'Leave', 'On Duty'] as AttendanceStatus[]).map(s => (
          <div key={s} className={styles.summaryItem} style={{ borderLeftColor: STATUS_CONFIG[s].color }}>
            <span className={styles.summaryCount} style={{ color: STATUS_CONFIG[s].color }}>{counts[s] || 0}</span>
            <span className={styles.summaryLabel}>{STATUS_CONFIG[s].dot} {s}</span>
          </div>
        ))}
        <div className={styles.summaryItem} style={{ borderLeftColor: '#64748b' }}>
          <span className={styles.summaryCount} style={{ color: '#94a3b8' }}>{notMarked}</span>
          <span className={styles.summaryLabel}>⚪ Not Marked</span>
        </div>
      </div>

      {/* Filters + Bulk */}
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="🔍  Search employee or role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className={styles.selectInput}>
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className={styles.selectInput}>
          {projects.map(p => <option key={p}>{p}</option>)}
        </select>
        {selected.size > 0 && (
          <button className={styles.bulkBtn} onClick={() => setBulkModal(true)}>
            ⚡ Bulk Mark ({selected.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>Loading attendance for {formatDate(date)}...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className={styles.checkbox} />
                </th>
                <th>Employee</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Project / Site</th>
                <th>Status</th>
                <th>Marked By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => {
                const cfg = record.status ? STATUS_CONFIG[record.status] : null;
                return (
                  <tr key={record.employee_id} className={selected.has(record.employee_id) ? styles.selectedRow : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(record.employee_id)}
                        onChange={() => toggleSelect(record.employee_id)}
                        className={styles.checkbox}
                      />
                    </td>
                    <td>
                      <div className={styles.employeeName}>{record.employees?.name}</div>
                    </td>
                    <td className={styles.roleCell}>{record.employees?.role}</td>
                    <td className={styles.deptCell}>{record.employees?.department || '—'}</td>
                    <td className={styles.deptCell}>{record.employees?.project || '—'}</td>
                    <td>
                      {cfg ? (
                        <span className={styles.statusBadge} style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.dot} {cfg.label}
                        </span>
                      ) : (
                        <span className={styles.notMarked}>⚪ Not Marked</span>
                      )}
                    </td>
                    <td className={styles.markedBy}>{record.marked_by || '—'}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button
                          className={styles.markBtn}
                          onClick={() => openMarkModal(record)}
                        >
                          {record.status ? '✏️ Change' : '✔ Mark'}
                        </button>
                        <button
                          className={styles.auditBtn}
                          onClick={() => openAuditLog(record)}
                          title="View audit trail"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== Mark / Change Modal ===== */}
      {markModal && (
        <div className={styles.overlay} onClick={() => setMarkModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Mark Attendance</h2>
                <p className={styles.modalSub}>
                  <strong>{markModal.record.employees?.name}</strong> — {formatDate(date)}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setMarkModal(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {/* Status grid */}
              <label className={styles.fieldLabel}>Status</label>
              <div className={styles.statusGrid}>
                {ALL_STATUSES.map(s => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      className={`${styles.statusOption} ${markStatus === s ? styles.statusSelected : ''}`}
                      style={markStatus === s ? { borderColor: cfg.color, background: cfg.bg, color: cfg.color } : {}}
                      onClick={() => setMarkStatus(s)}
                    >
                      {cfg.dot} {cfg.label}
                    </button>
                  );
                })}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Reason</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="e.g. Employee reported late, medical leave..."
                  value={markReason}
                  onChange={e => setMarkReason(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Remarks (optional)</label>
                <textarea
                  className={styles.fieldTextarea}
                  placeholder="Additional notes..."
                  rows={3}
                  value={markRemarks}
                  onChange={e => setMarkRemarks(e.target.value)}
                />
              </div>

              {markModal.record.status && (
                <div className={styles.auditPreview}>
                  <span className={styles.auditLabel}>Previous Status:</span>
                  <span className={styles.auditValue}>
                    {STATUS_CONFIG[markModal.record.status]?.dot} {markModal.record.status}
                  </span>
                  <span className={styles.auditArrow}>→</span>
                  <span className={styles.auditValue} style={{ color: STATUS_CONFIG[markStatus].color }}>
                    {STATUS_CONFIG[markStatus].dot} {markStatus}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setMarkModal(null)}>Cancel</button>
              <button className={styles.saveBtn} disabled={markSaving} onClick={handleMark}>
                {markSaving ? 'Saving...' : '✔ Save Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Audit Log Modal ===== */}
      {auditModal && (
        <div className={styles.overlay} onClick={() => setAuditModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Audit Trail</h2>
                <p className={styles.modalSub}><strong>{auditModal.record.employees?.name}</strong> — {formatDate(date)}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setAuditModal(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {auditModal.logs.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>No changes recorded yet.</p>
              ) : (
                <div className={styles.auditLog}>
                  {auditModal.logs.map(log => (
                    <div key={log.id} className={styles.auditEntry}>
                      <div className={styles.auditEntryHeader}>
                        <span className={styles.auditEntryTime}>
                          {new Date(log.changed_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={styles.auditEntryBy}>by {log.changed_by}</span>
                      </div>
                      <div className={styles.auditEntryChange}>
                        {log.previous_status ? (
                          <><span style={{ color: '#ef4444' }}>{log.previous_status}</span> → </>
                        ) : <><span style={{ color: '#64748b' }}>Not Marked</span> → </>}
                        <span style={{ color: STATUS_CONFIG[log.new_status as AttendanceStatus]?.color ?? '#f8fafc', fontWeight: 600 }}>
                          {log.new_status}
                        </span>
                      </div>
                      {log.reason && <div className={styles.auditEntryReason}>Reason: {log.reason}</div>}
                      {log.remarks && <div className={styles.auditEntryReason}>Remarks: {log.remarks}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Bulk Mark Modal ===== */}
      {bulkModal && (
        <div className={styles.overlay} onClick={() => setBulkModal(false)}>
          <div className={styles.modal} style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Bulk Mark Attendance</h2>
                <p className={styles.modalSub}>{selected.size} employees selected — {formatDate(date)}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setBulkModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.fieldLabel}>Mark all as</label>
              <div className={styles.statusGrid}>
                {ALL_STATUSES.map(s => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      className={`${styles.statusOption} ${bulkStatus === s ? styles.statusSelected : ''}`}
                      style={bulkStatus === s ? { borderColor: cfg.color, background: cfg.bg, color: cfg.color } : {}}
                      onClick={() => setBulkStatus(s)}
                    >
                      {cfg.dot} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setBulkModal(false)}>Cancel</button>
              <button className={styles.saveBtn} disabled={bulkSaving} onClick={handleBulkMark}>
                {bulkSaving ? 'Saving...' : `⚡ Mark ${selected.size} Employees`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
