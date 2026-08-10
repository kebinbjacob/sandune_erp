'use client';

import { useState, useEffect } from 'react';
import { getSafetyIncidents, createSafetyIncident, updateIncidentStatus, SafetyIncident, INCIDENT_SEVERITY, INCIDENT_STATUSES } from '@/lib/services/operationsService';
import { getProjects, Project } from '@/lib/services/projectService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import styles from '../expenses/expenses.module.css';

export default function SafetyPage() {
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ project_id: '', incident_date: '', reported_by: '', severity: 'Minor', description: '', action_taken: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [inc, p, e] = await Promise.all([getSafetyIncidents(), getProjects(), getEmployees()]);
      setIncidents(inc);
      setProjects(p);
      setEmployees(e);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createSafetyIncident({
        project_id: form.project_id,
        incident_date: form.incident_date,
        reported_by: form.reported_by || null,
        severity: form.severity,
        description: form.description,
        action_taken: form.action_taken || null,
        status: 'Open'
      });
      setShowModal(false);
      setForm({ project_id: '', incident_date: '', reported_by: '', severity: 'Minor', description: '', action_taken: '' });
      await load();
    } catch (err) {
      alert('Failed to log incident.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateIncidentStatus(id, newStatus);
      await load();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const severityColors: Record<string, string> = { Minor: '#3b82f6', Moderate: '#f59e0b', Major: '#ef4444', Critical: '#7f1d1d' };
  const statusColors: Record<string, string> = { Open: '#ef4444', Investigating: '#f59e0b', Resolved: '#10b981', Closed: '#6b7280' };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Safety Log</h1>
          <p className={styles.subtitle}>Track workplace incidents, injuries, and safety compliance.</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.newBtn} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>+ Log Incident</button>
      </header>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading safety records...</div> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date / Project</th>
                <th>Severity</th>
                <th>Description</th>
                <th>Action Taken</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(i => (
                <tr key={i.id}>
                  <td style={{ minWidth: '150px' }}>
                    <div className={styles.boldCell}>{new Date(i.incident_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className={styles.subCell}>{i.projects?.name}</div>
                  </td>
                  <td>
                    <span className={styles.categoryBadge} style={{ background: `${severityColors[i.severity]}22`, color: severityColors[i.severity] }}>
                      {i.severity}
                    </span>
                  </td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                    {i.description}
                    <div className={styles.subCell}>Reported by: {i.employees?.name || 'Admin'}</div>
                  </td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{i.action_taken || 'None'}</td>
                  <td>
                    <select 
                      className={styles.actionSelect} 
                      value={i.status} 
                      onChange={(ev) => handleStatusChange(i.id!, ev.target.value)}
                      style={{ borderColor: statusColors[i.status], color: statusColors[i.status] }}
                    >
                      {INCIDENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && <tr><td colSpan={5} className={styles.loading}>No safety incidents recorded! Great job.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} style={{ color: '#ef4444' }}>Log Safety Incident</h2>
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
                <div className={styles.fg}><label className={styles.fl}>Date *</label><input required type="date" value={form.incident_date} onChange={e => setForm(f => ({...f, incident_date: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Reported By</label>
                  <select value={form.reported_by} onChange={e => setForm(f => ({...f, reported_by: e.target.value}))} className={styles.fi}>
                    <option value="">Admin (Self)</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className={styles.fg}><label className={styles.fl}>Severity</label>
                  <select value={form.severity} onChange={e => setForm(f => ({...f, severity: e.target.value}))} className={styles.fi}>
                    {INCIDENT_SEVERITY.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.fg}><label className={styles.fl}>Incident Description *</label><textarea required value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={styles.fi} rows={3} placeholder="What happened?" style={{ resize: 'vertical' }} /></div>
              <div className={styles.fg}><label className={styles.fl}>Immediate Action Taken</label><textarea value={form.action_taken} onChange={e => setForm(f => ({...f, action_taken: e.target.value}))} className={styles.fi} rows={2} placeholder="e.g. First aid provided, work stopped" style={{ resize: 'vertical' }} /></div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} className={styles.submitBtn} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>{saving ? 'Saving...' : 'Log Incident'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
