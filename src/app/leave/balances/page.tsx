'use client';

import { useState, useEffect } from 'react';
import { getLeaveBalances, createLeaveBalance, LeaveBalance } from '@/lib/services/leaveBalancesService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import styles from '../../expenses/expenses.module.css';

export default function LeaveBalancesPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [year, setYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ employee_id: '', year, annual_total: 14, sick_total: 7, casual_total: 7 });

  const load = async () => {
    setLoading(true);
    try {
      const [b, e] = await Promise.all([getLeaveBalances(year), getEmployees()]);
      setBalances(b);
      setEmployees(e);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [year]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createLeaveBalance(form);
      setShowModal(false);
      await load();
    } catch (err) {
      alert('Failed to add balance. Maybe they already have an entry for this year?');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Leave Balances</h1>
          <p className={styles.subtitle}>Track yearly leave allocations vs used for employees.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={styles.actionSelect} style={{ padding: '0.65rem', fontSize: '0.9rem' }}>
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} className={styles.newBtn}>+ Allocate Leaves</button>
        </div>
      </header>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading balances...</div> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th style={{ textAlign: 'center' }}>Annual (Used / Total)</th>
                <th style={{ textAlign: 'center' }}>Sick (Used / Total)</th>
                <th style={{ textAlign: 'center' }}>Casual (Used / Total)</th>
              </tr>
            </thead>
            <tbody>
              {balances.map(b => (
                <tr key={b.id}>
                  <td>
                    <div className={styles.boldCell}>{b.employees?.name}</div>
                    <div className={styles.subCell}>{b.employees?.role} - {b.employees?.department}</div>
                  </td>
                  <td align="center">
                    <span className={styles.categoryBadge} style={{ background: b.annual_used >= b.annual_total ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: b.annual_used >= b.annual_total ? '#ef4444' : '#10b981' }}>
                      {b.annual_used} / {b.annual_total}
                    </span>
                  </td>
                  <td align="center">
                    <span className={styles.categoryBadge} style={{ background: b.sick_used >= b.sick_total ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: b.sick_used >= b.sick_total ? '#ef4444' : '#f59e0b' }}>
                      {b.sick_used} / {b.sick_total}
                    </span>
                  </td>
                  <td align="center">
                    <span className={styles.categoryBadge} style={{ background: b.casual_used >= b.casual_total ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)', color: b.casual_used >= b.casual_total ? '#ef4444' : '#6366f1' }}>
                      {b.casual_used} / {b.casual_total}
                    </span>
                  </td>
                </tr>
              ))}
              {balances.length === 0 && <tr><td colSpan={4} className={styles.loading}>No balances allocated for {year}.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Allocate Leaves</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className={styles.modalForm}>
              <div className={styles.fg}><label className={styles.fl}>Employee</label>
                <select required value={form.employee_id} onChange={e => setForm(f => ({...f, employee_id: e.target.value}))} className={styles.fi}>
                  <option value="">Select Employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Year</label><input required type="number" value={form.year} onChange={e => setForm(f => ({...f, year: Number(e.target.value)}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Annual Total</label><input required type="number" value={form.annual_total} onChange={e => setForm(f => ({...f, annual_total: Number(e.target.value)}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Sick Total</label><input required type="number" value={form.sick_total} onChange={e => setForm(f => ({...f, sick_total: Number(e.target.value)}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Casual Total</label><input required type="number" value={form.casual_total} onChange={e => setForm(f => ({...f, casual_total: Number(e.target.value)}))} className={styles.fi} /></div>
              </div>
              <div className={styles.modalFooter}>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : 'Allocate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}