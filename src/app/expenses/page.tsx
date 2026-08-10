'use client';

import { useState, useEffect } from 'react';
import { getExpenses, createExpense, updateExpenseStatus, Expense, EXPENSE_CATEGORIES, EXPENSE_STATUSES } from '@/lib/services/financeService';
import { getProjects, Project } from '@/lib/services/projectService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import styles from './expenses.module.css';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Materials', project_id: '', date: '', submitted_by: '', notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [exp, proj, emp] = await Promise.all([getExpenses(), getProjects(), getEmployees()]);
      setExpenses(exp);
      setProjects(proj);
      setEmployees(emp);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createExpense({
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
        project_id: form.project_id,
        date: form.date,
        submitted_by: form.submitted_by || null,
        notes: form.notes || null,
        status: 'Pending'
      });
      setShowModal(false);
      setForm({ title: '', amount: '', category: 'Materials', project_id: '', date: '', submitted_by: '', notes: '' });
      await load();
    } catch (err) {
      alert('Failed to add expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateExpenseStatus(id, newStatus);
      await load();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const pending = expenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + Number(e.amount), 0);
  
  const statusColors: Record<string, string> = { Pending: '#f59e0b', Approved: '#3b82f6', Paid: '#10b981', Rejected: '#ef4444' };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Expenses</h1>
          <p className={styles.subtitle}>Track overheads, material purchases, and contractor payouts.</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.newBtn}>+ Add Expense</button>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.sumCard}>
          <span className={styles.sumVal}>{fmt(total)}</span>
          <span className={styles.sumLabel}>Total Expenses</span>
        </div>
        <div className={styles.sumCard} style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <span className={styles.sumVal} style={{ color: '#f59e0b' }}>{fmt(pending)}</span>
          <span className={styles.sumLabel}>Pending Approval</span>
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading expenses...</div> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title / Project</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Submitted By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td>{new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <div className={styles.boldCell}>{e.title}</div>
                    <div className={styles.subCell}>{e.projects?.name}</div>
                  </td>
                  <td><span className={styles.categoryBadge}>{e.category}</span></td>
                  <td className={styles.amountCell}>{fmt(e.amount)}</td>
                  <td className={styles.subCell}>{e.employees?.name || 'Admin'}</td>
                  <td>
                    <span className={styles.statusBadge} style={{ background: `${statusColors[e.status]}22`, color: statusColors[e.status] }}>
                      {e.status}
                    </span>
                  </td>
                  <td>
                    <select 
                      className={styles.actionSelect} 
                      value={e.status} 
                      onChange={(ev) => handleStatusChange(e.id!, ev.target.value)}
                    >
                      {EXPENSE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={7} className={styles.loading}>No expenses recorded yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Expense</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Title *</label><input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className={styles.fi} placeholder="Expense description" /></div>
                <div className={styles.fg}><label className={styles.fl}>Amount (₹) *</label><input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className={styles.fi} placeholder="0.00" /></div>
                <div className={styles.fg}><label className={styles.fl}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={styles.fi}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.fg}><label className={styles.fl}>Date *</label><input required type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Project *</label>
                  <select required value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))} className={styles.fi}>
                    <option value="">Select Project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className={styles.fg}><label className={styles.fl}>Submitted By</label>
                  <select value={form.submitted_by} onChange={e => setForm(f => ({...f, submitted_by: e.target.value}))} className={styles.fi}>
                    <option value="">Admin (Self)</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.fg}><label className={styles.fl}>Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className={styles.fi} rows={2} /></div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
