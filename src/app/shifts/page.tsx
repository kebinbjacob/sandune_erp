'use client';

import { useState, useEffect } from 'react';
import { getShifts, createShift, getEmployeeShifts, assignShift, Shift, EmployeeShift } from '@/lib/services/shiftService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import styles from '../expenses/expenses.module.css';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<EmployeeShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [shiftForm, setShiftForm] = useState({ name: '', start_time: '08:00', end_time: '17:00' });
  const [assignForm, setAssignForm] = useState({ employee_id: '', shift_id: '', effective_from: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [s, a, e] = await Promise.all([getShifts(), getEmployeeShifts(), getEmployees()]);
      setShifts(s);
      setAssignments(a);
      setEmployees(e);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createShift(shiftForm);
      setShowShiftModal(false);
      setShiftForm({ name: '', start_time: '08:00', end_time: '17:00' });
      await load();
    } catch (err) { alert('Failed to create shift'); }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignShift(assignForm);
      setShowAssignModal(false);
      setAssignForm({ employee_id: '', shift_id: '', effective_from: '' });
      await load();
    } catch (err) { alert('Failed to assign shift'); }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Shifts & Schedules</h1>
          <p className={styles.subtitle}>Manage worker shifts and assign them to schedules.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowShiftModal(true)} className={styles.cancelBtn} style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>+ Define Shift</button>
          <button onClick={() => setShowAssignModal(true)} className={styles.newBtn}>+ Assign Employee</button>
        </div>
      </header>

      <div className={styles.summaryGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {shifts.map(s => (
          <div key={s.id} className={styles.sumCard}>
            <span className={styles.sumVal} style={{ fontSize: '1.2rem', color: '#6366f1' }}>{s.name}</span>
            <span className={styles.sumLabel}>{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</span>
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading schedules...</div> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Assigned Shift</th>
                <th>Effective From</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => {
                const isPast = new Date(a.effective_from) <= new Date();
                return (
                  <tr key={a.id}>
                    <td>
                      <div className={styles.boldCell}>{a.employees?.name}</div>
                      <div className={styles.subCell}>{a.employees?.role}</div>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>{a.shifts?.name}</span>
                      <div className={styles.subCell}>{a.shifts?.start_time.slice(0,5)} to {a.shifts?.end_time.slice(0,5)}</div>
                    </td>
                    <td>{new Date(a.effective_from).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <span className={styles.statusBadge} style={{ background: isPast ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: isPast ? '#10b981' : '#f59e0b' }}>
                        {isPast ? 'Active' : 'Upcoming'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {assignments.length === 0 && <tr><td colSpan={4} className={styles.loading}>No employees assigned to shifts.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showShiftModal && (
        <div className={styles.overlay} onClick={() => setShowShiftModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Define Shift</h2>
              <button className={styles.closeBtn} onClick={() => setShowShiftModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateShift} className={styles.modalForm}>
              <div className={styles.fg}><label className={styles.fl}>Shift Name</label><input required value={shiftForm.name} onChange={e => setShiftForm(f => ({...f, name: e.target.value}))} className={styles.fi} placeholder="e.g. Night Shift" /></div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Start Time</label><input required type="time" value={shiftForm.start_time} onChange={e => setShiftForm(f => ({...f, start_time: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>End Time</label><input required type="time" value={shiftForm.end_time} onChange={e => setShiftForm(f => ({...f, end_time: e.target.value}))} className={styles.fi} /></div>
              </div>
              <div className={styles.modalFooter}>
                <button type="submit" className={styles.submitBtn}>Save Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className={styles.overlay} onClick={() => setShowAssignModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Assign Shift</h2>
              <button className={styles.closeBtn} onClick={() => setShowAssignModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAssignShift} className={styles.modalForm}>
              <div className={styles.fg}><label className={styles.fl}>Employee</label>
                <select required value={assignForm.employee_id} onChange={e => setAssignForm(f => ({...f, employee_id: e.target.value}))} className={styles.fi}>
                  <option value="">Select Employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} - {e.role}</option>)}
                </select>
              </div>
              <div className={styles.fg}><label className={styles.fl}>Shift</label>
                <select required value={assignForm.shift_id} onChange={e => setAssignForm(f => ({...f, shift_id: e.target.value}))} className={styles.fi}>
                  <option value="">Select Shift...</option>
                  {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0,5)} - {s.end_time.slice(0,5)})</option>)}
                </select>
              </div>
              <div className={styles.fg}><label className={styles.fl}>Effective From</label><input required type="date" value={assignForm.effective_from} onChange={e => setAssignForm(f => ({...f, effective_from: e.target.value}))} className={styles.fi} /></div>
              <div className={styles.modalFooter}>
                <button type="submit" className={styles.submitBtn}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
