'use client';

import { useState, useEffect } from 'react';
import { getSiteReports, createSiteReport, updateSiteReport, SiteReport } from '@/lib/services/operationsService';
import { getProjects, Project } from '@/lib/services/projectService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import styles from '../../expenses/expenses.module.css';

export default function SiteReportsPage() {
  const [reports, setReports] = useState<SiteReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ project_id: '', report_date: '', submitted_by: '', weather: 'Sunny', work_completed: '', issues_faced: '', materials_used: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [r, p, e] = await Promise.all([getSiteReports(), getProjects(), getEmployees()]);
      setReports(r);
      setProjects(p);
      setEmployees(e);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openModal = (report?: SiteReport) => {
    if (report) {
      setEditingId(report.id || null);
      setForm({
        project_id: report.project_id || '',
        report_date: report.report_date,
        submitted_by: report.submitted_by || '',
        weather: report.weather || 'Sunny',
        work_completed: report.work_completed || '',
        issues_faced: report.issues_faced || '',
        materials_used: report.materials_used || ''
      });
    } else {
      setEditingId(null);
      setForm({ project_id: '', report_date: '', submitted_by: '', weather: 'Sunny', work_completed: '', issues_faced: '', materials_used: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        project_id: form.project_id,
        report_date: form.report_date,
        submitted_by: form.submitted_by || null,
        weather: form.weather || null,
        work_completed: form.work_completed || null,
        issues_faced: form.issues_faced || null,
        materials_used: form.materials_used || null,
      };
      
      if (editingId) {
        await updateSiteReport(editingId, payload);
      } else {
        await createSiteReport(payload);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      alert('Failed to save report.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Daily Site Reports</h1>
          <p className={styles.subtitle}>Track daily progress, weather, and issues for all active projects.</p>
        </div>
        <button onClick={() => openModal()} className={styles.newBtn}>+ New Report</button>
      </header>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading reports...</div> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date / Project</th>
                <th>Weather</th>
                <th>Work Completed</th>
                <th>Issues Faced</th>
                <th>Submitted By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td style={{ minWidth: '150px' }}>
                    <div className={styles.boldCell}>{new Date(r.report_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className={styles.subCell}>{r.projects?.name}</div>
                  </td>
                  <td><span className={styles.categoryBadge}>{r.weather || '—'}</span></td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{r.work_completed || '—'}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: '0.8rem', color: r.issues_faced ? '#f87171' : 'rgba(255,255,255,0.4)' }}>{r.issues_faced || 'None'}</td>
                  <td className={styles.subCell}>{r.employees?.name || 'Admin'}</td>
                  <td><button className={styles.actionSelect} onClick={() => openModal(r)}>Edit</button></td>
                </tr>
              ))}
              {reports.length === 0 && <tr><td colSpan={6} className={styles.loading}>No reports found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Edit Report' : 'Daily Site Report'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Project *</label>
                  <select required value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))} className={styles.fi}>
                    <option value="">Select Project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className={styles.fg}><label className={styles.fl}>Date *</label><input required type="date" value={form.report_date} onChange={e => setForm(f => ({...f, report_date: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Submitted By</label>
                  <select value={form.submitted_by} onChange={e => setForm(f => ({...f, submitted_by: e.target.value}))} className={styles.fi}>
                    <option value="">Admin (Self)</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className={styles.fg}><label className={styles.fl}>Weather</label>
                  <select value={form.weather} onChange={e => setForm(f => ({...f, weather: e.target.value}))} className={styles.fi}>
                    <option>Sunny</option><option>Cloudy</option><option>Rainy</option><option>Storm</option><option>Extreme Heat</option><option>Snow</option>
                  </select>
                </div>
              </div>
              <div className={styles.fg}><label className={styles.fl}>Work Completed</label><textarea value={form.work_completed} onChange={e => setForm(f => ({...f, work_completed: e.target.value}))} className={styles.fi} rows={3} placeholder="What was achieved today?" style={{ resize: 'vertical' }} /></div>
              <div className={styles.fg}><label className={styles.fl}>Materials Used</label><textarea value={form.materials_used} onChange={e => setForm(f => ({...f, materials_used: e.target.value}))} className={styles.fi} rows={2} placeholder="e.g. 50 bags cement, 2 tons steel" style={{ resize: 'vertical' }} /></div>
              <div className={styles.fg}><label className={styles.fl}>Issues Faced</label><textarea value={form.issues_faced} onChange={e => setForm(f => ({...f, issues_faced: e.target.value}))} className={styles.fi} rows={2} placeholder="Any delays, breakdowns, or problems?" style={{ resize: 'vertical' }} /></div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Submitting...' : (editingId ? 'Save Changes' : 'Submit Report')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
