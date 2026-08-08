'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProjects, createProject, Project, PROJECT_STATUSES } from '@/lib/services/projectService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import styles from './projects.module.css';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Planning:  { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  Active:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'On Hold': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  Delayed:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  Completed: { color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', client: '', status: 'Planning', location: '',
    start_date: '', end_date: '', budget: '', description: '', manager_id: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([getProjects(), getEmployees()]);
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
      const code = `PRJ-${Date.now().toString().slice(-5)}`;
      await createProject({
        project_code: code,
        name: form.name,
        client: form.client || null,
        status: form.status,
        location: form.location || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? Number(form.budget) : null,
        description: form.description || null,
        manager_id: form.manager_id || null,
        completion_pct: 0,
      } as Partial<Project>);
      setShowModal(false);
      setForm({ name: '', client: '', status: 'Planning', location: '', start_date: '', end_date: '', budget: '', description: '', manager_id: '' });
      await load();
    } catch(err: unknown) {
      alert('Failed to create project.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n?: number) => n ? `₹${n.toLocaleString('en-IN')}` : '—';
  const totalBudget = projects.reduce((a, p) => a + (p.budget || 0), 0);
  const active = projects.filter(p => p.status === 'Active').length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>Manage construction sites, budgets, and timelines</p>
        </div>
        <button className={styles.newBtn} onClick={() => setShowModal(true)}>+ New Project</button>
      </header>

      {/* Summary */}
      <div className={styles.summaryGrid}>
        <div className={styles.sumCard}><span className={styles.sumVal}>{projects.length}</span><span className={styles.sumLabel}>Total Projects</span></div>
        <div className={styles.sumCard} style={{ borderColor: 'rgba(16,185,129,0.3)' }}><span className={styles.sumVal} style={{ color: '#10b981' }}>{active}</span><span className={styles.sumLabel}>🟢 Active</span></div>
        <div className={styles.sumCard} style={{ borderColor: 'rgba(99,102,241,0.3)' }}><span className={styles.sumVal} style={{ color: '#a5b4fc' }}>{fmt(totalBudget)}</span><span className={styles.sumLabel}>💼 Total Budget</span></div>
        <div className={styles.sumCard} style={{ borderColor: 'rgba(239,68,68,0.3)' }}><span className={styles.sumVal} style={{ color: '#ef4444' }}>{projects.filter(p => p.status === 'Delayed').length}</span><span className={styles.sumLabel}>⚠ Delayed</span></div>
      </div>

      {/* Project cards */}
      {loading ? <div className={styles.loading}>Loading projects...</div> : (
        <div className={styles.projectGrid}>
          {projects.map(p => {
            const cfg = STATUS_COLORS[p.status] || STATUS_COLORS.Planning;
            return (
              <div key={p.id} className={styles.projectCard}>
                <div className={styles.cardTop}>
                  <div>
                    <p className={styles.cardCode}>{p.project_code}</p>
                    <h3 className={styles.cardName}>{p.name}</h3>
                    <p className={styles.cardClient}>{p.client || 'No Client'}</p>
                  </div>
                  <span className={styles.statusPill} style={{ color: cfg.color, background: cfg.bg }}>{p.status}</span>
                </div>

                {p.description && <p className={styles.cardDesc}>{p.description}</p>}

                {/* Progress bar */}
                <div className={styles.progressSection}>
                  <div className={styles.progressLabel}>
                    <span>Completion</span>
                    <span style={{ color: cfg.color, fontWeight: 700 }}>{p.completion_pct || 0}%</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${p.completion_pct || 0}%`, background: cfg.color }} />
                  </div>
                </div>

                <div className={styles.cardMeta}>
                  {p.location && <span className={styles.metaItem}>📍 {p.location}</span>}
                  {p.budget && <span className={styles.metaItem}>💰 {fmt(p.budget)}</span>}
                  {p.start_date && <span className={styles.metaItem}>📅 {new Date(p.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>}
                </div>

                <div className={styles.cardFooter}>
                  <Link href={`/projects/${p.id}`} className={styles.viewBtn}>View Details →</Link>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className={styles.empty}>No projects yet. <button onClick={() => setShowModal(true)} className={styles.emptyLink}>Create the first one →</button></div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Project</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Project Name *</label><input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className={styles.fi} placeholder="e.g. Skyline Tower Phase 2" /></div>
                <div className={styles.fg}><label className={styles.fl}>Client</label><input value={form.client} onChange={e => setForm(p => ({...p, client: e.target.value}))} className={styles.fi} placeholder="Client name" /></div>
                <div className={styles.fg}><label className={styles.fl}>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))} className={styles.fi}>
                    {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.fg}><label className={styles.fl}>Location</label><input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} className={styles.fi} placeholder="Site location" /></div>
                <div className={styles.fg}><label className={styles.fl}>Start Date</label><input type="date" value={form.start_date} onChange={e => setForm(p => ({...p, start_date: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>End Date</label><input type="date" value={form.end_date} onChange={e => setForm(p => ({...p, end_date: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Budget (₹)</label><input type="number" value={form.budget} onChange={e => setForm(p => ({...p, budget: e.target.value}))} className={styles.fi} placeholder="0" /></div>
                <div className={styles.fg}><label className={styles.fl}>Project Manager</label>
                  <select value={form.manager_id} onChange={e => setForm(p => ({...p, manager_id: e.target.value}))} className={styles.fi}>
                    <option value="">Select Manager</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.fg}><label className={styles.fl}>Description</label><textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className={styles.fi} rows={3} placeholder="Brief project description..." style={{ resize: 'vertical' }} /></div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Creating...' : '+ Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
