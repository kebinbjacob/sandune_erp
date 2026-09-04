'use client';

import { useState, useEffect } from 'react';
import { getShifts, createShift, updateShift, deleteShift, getEmployeeShifts, assignShift, updateEmployeeShift, deleteEmployeeShift, Shift, EmployeeShift } from '@/lib/services/shiftService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import styles from '../expenses/expenses.module.css';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<EmployeeShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editingAssignId, setEditingAssignId] = useState<string | null>(null);
  
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

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shift assignment?')) return;
    try {
      await deleteEmployeeShift(id);
      await load();
    } catch (err) {
      alert('Failed to delete shift assignment');
    }
  };

  const handleDeleteShift = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete shift "${name}"?`)) return;
    try {
      await deleteShift(id);
      setShowShiftModal(false);
      await load();
    } catch (err) {
      alert('Failed to delete shift');
    }
  };

  const openShiftModal = (shift?: Shift) => {
    if (shift) {
      setEditingShiftId(shift.id || null);
      setShiftForm({
        name: shift.name,
        start_time: shift.start_time,
        end_time: shift.end_time
      });
    } else {
      setEditingShiftId(null);
      setShiftForm({ name: '', start_time: '08:00', end_time: '17:00' });
    }
    setShowShiftModal(true);
  };

  const openAssignModal = (assignment?: EmployeeShift) => {
    if (assignment) {
      setEditingAssignId(assignment.id || null);
      setAssignForm({
        employee_id: assignment.employee_id,
        shift_id: assignment.shift_id,
        effective_from: assignment.effective_from
      });
    } else {
      setEditingAssignId(null);
      setAssignForm({ employee_id: '', shift_id: '', effective_from: '' });
    }
    setShowAssignModal(true);
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShiftId) {
        await updateShift(editingShiftId, shiftForm);
      } else {
        await createShift(shiftForm);
      }
      setShowShiftModal(false);
      await load();
    } catch (err) { alert('Failed to save shift'); }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAssignId) {
        await updateEmployeeShift(editingAssignId, assignForm);
      } else {
        await assignShift(assignForm);
      }
      setShowAssignModal(false);
      await load();
    } catch (err) { alert('Failed to save assignment'); }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Shifts & Schedules</h1>
          <p className={styles.subtitle}>Manage worker shifts and assign them to schedules.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => openShiftModal()} className={styles.cancelBtn} style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>+ Define Shift</button>
          <button onClick={() => openAssignModal()} className={styles.newBtn}>+ Assign Employee</button>
        </div>
      </header>

      <div className={styles.summaryGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {shifts.map(s => (
          <div key={s.id} className={styles.sumCard} style={{ cursor: 'pointer', position: 'relative' }} onClick={() => openShiftModal(s)}>
            <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.8rem', color: '#818cf8' }}>Edit</div>
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
                <th>Actions</th>
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
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button className={styles.actionSelect} onClick={() => openAssignModal(a)}>Edit</button>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteAssignment(a.id!)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {assignments.length === 0 && <tr><td colSpan={5} className={styles.loading}>No employees assigned to shifts.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showShiftModal && (
        <div className={styles.overlay} onClick={() => setShowShiftModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingShiftId ? 'Edit Shift' : 'Define Shift'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowShiftModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateShift} className={styles.modalForm}>
              <div className={styles.fg}><label className={styles.fl}>Shift Name</label><input required value={shiftForm.name} onChange={e => setShiftForm(f => ({...f, name: e.target.value}))} className={styles.fi} placeholder="e.g. Night Shift" /></div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Start Time</label><input required type="time" value={shiftForm.start_time} onChange={e => setShiftForm(f => ({...f, start_time: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>End Time</label><input required type="time" value={shiftForm.end_time} onChange={e => setShiftForm(f => ({...f, end_time: e.target.value}))} className={styles.fi} /></div>
              </div>
              <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: editingShiftId ? 'space-between' : 'flex-end', alignItems: 'center' }}>
                {editingShiftId && (
                  <button type="button" className={styles.deleteBtn} onClick={() => handleDeleteShift(editingShiftId, shiftForm.name)}>Delete Shift</button>
                )}
                <button type="submit" className={styles.submitBtn}>{editingShiftId ? 'Save Changes' : 'Save Shift'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className={styles.overlay} onClick={() => setShowAssignModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingAssignId ? 'Edit Assignment' : 'Assign Shift'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowAssignModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAssignShift} className={styles.modalForm}>
              <div className={styles.fg}><label className={styles.fl}>Employee</label>
                <select required value={assignForm.employee_id} onChange={e => setAssignForm(f => ({...f, employee_id: e.target.value}))} className={styles.fi} disabled={!!editingAssignId}>
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
                <button type="submit" className={styles.submitBtn}>{editingAssignId ? 'Save Changes' : 'Assign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
