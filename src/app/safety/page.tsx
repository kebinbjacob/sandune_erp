'use client';

import { useState, useEffect } from 'react';
import { getSafetyIncidents, createSafetyIncident, updateSafetyIncident, updateIncidentStatus, deleteSafetyIncident, SafetyIncident, INCIDENT_SEVERITY, INCIDENT_STATUSES } from '@/lib/services/operationsService';
import { getProjects, Project } from '@/lib/services/projectService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import { useAuth } from '@/lib/context/AuthContext';
import styles from '../expenses/expenses.module.css';

export default function SafetyPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ project_id: '', incident_date: '', reported_by: '', severity: 'Minor', description: '', action_taken: '', status: 'Open' });

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this safety incident?')) return;
    try {
      await deleteSafetyIncident(id);
      await load();
    } catch (err) {
      alert('Failed to delete incident.');
    }
  };

  const openModal = (incident?: SafetyIncident) => {
    if (incident) {
      setEditingId(incident.id || null);
      setForm({
        project_id: incident.project_id || '',
        incident_date: incident.incident_date,
        reported_by: incident.reported_by || '',
        severity: incident.severity,
        description: incident.description,
        action_taken: incident.action_taken || '',
        status: incident.status || 'Open'
      });
    } else {
      setEditingId(null);
      setForm({ project_id: '', incident_date: '', reported_by: '', severity: 'Minor', description: '', action_taken: '', status: 'Open' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        project_id: form.project_id,
        incident_date: form.incident_date,
        reported_by: form.reported_by || user?.employees?.id || null,
        severity: form.severity,
        description: form.description,
        action_taken: form.action_taken || null,
        status: form.status
      };
      
      if (editingId) {
        await updateSafetyIncident(editingId, payload);
      } else {
        await createSafetyIncident(payload);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      alert('Failed to save incident.');
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

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthIncidents = incidents.filter(i => {
    if (!i.incident_date) return false;
    const d = new Date(i.incident_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const openIncidents = incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length;
  const highSeverityIncidents = incidents.filter(i => i.severity === 'High' || i.severity === 'Critical' || i.severity === 'Major').length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Safety Log</h1>
          <p className={styles.subtitle}>Track workplace incidents, injuries, and safety compliance.</p>
        </div>
        <button onClick={() => openModal()} className={styles.newBtn} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>+ Log Incident</button>
      </header>

      {/* Summary stat cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.sumCard}>
          <span className={styles.sumVal}>{thisMonthIncidents}</span>
          <span className={styles.sumLabel}>Incidents This Month</span>
        </div>
        <div className={styles.sumCard} style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <span className={styles.sumVal} style={{ color: '#ef4444' }}>{openIncidents}</span>
          <span className={styles.sumLabel}>Open / Unresolved</span>
        </div>
        <div className={styles.sumCard} style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <span className={styles.sumVal} style={{ color: '#f59e0b' }}>{highSeverityIncidents}</span>
          <span className={styles.sumLabel}>High Severity / Critical</span>
        </div>
      </div>

      <div className={styles.tableCard}>

        {loading ? <div className={styles.loading}>Loading safety records...</div> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date / Project</th>
                <th>Severity</th>
                <th>Description</th>
                <th>Action Taken</th>
                <th>Actions</th>
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
                    <div className={styles.subCell}>Reported by: {i.employees?.name || 'System'}</div>
                  </td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{i.action_taken || 'None'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select 
                        className={styles.actionSelect} 
                        value={i.status} 
                        onChange={(ev) => handleStatusChange(i.id!, ev.target.value)}
                        style={{ borderColor: statusColors[i.status], color: statusColors[i.status], padding: '4px 8px' }}
                      >
                        {INCIDENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className={styles.actionSelect} onClick={() => openModal(i)} style={{ padding: '5px 12px' }}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(i.id!)}>Delete</button>
                    </div>
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
              <h2 className={styles.modalTitle} style={{ color: '#ef4444' }}>{editingId ? 'Edit Incident' : 'Log Safety Incident'}</h2>
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
                    <option value="">{user?.employees?.name || user?.email || 'System'} (Self)</option>
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
              {editingId && (
                <div className={styles.fg}><label className={styles.fl}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={styles.fi}>
                    {INCIDENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} className={styles.submitBtn} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Log Incident')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
