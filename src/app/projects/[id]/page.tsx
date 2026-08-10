'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject, updateProject, Project, PROJECT_STATUSES } from '@/lib/services/projectService';
import { getTasksByProject, Task, TASK_STATUSES } from '@/lib/services/projectService';
import styles from '../../expenses/expenses.module.css';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Project>>({});

  const load = async () => {
    setLoading(true);
    try {
      if (typeof id === 'string') {
        const [p, t] = await Promise.all([getProject(id), getTasksByProject(id)]);
        setProject(p);
        setTasks(t);
        setForm(p || {});
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;
    setSaving(true);
    try {
      // Strip related nested objects before updating
      const updates = { ...form };
      delete updates.employees;
      delete updates.tasks;
      delete updates.id;
      
      await updateProject(project.id, updates);
      setIsEditing(false);
      await load();
    } catch (err) {
      alert('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.container}><div className={styles.loading}>Loading project details...</div></div>;
  if (!project) return <div className={styles.container}><div className={styles.loading}>Project not found.</div></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <button onClick={() => router.push('/projects')} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>← Back to Projects</button>
          <h1 className={styles.title}>{project.name} <span style={{ fontSize: '1rem', color: '#64748b' }}>({project.project_code})</span></h1>
          <p className={styles.subtitle}>{project.description || 'No description provided.'}</p>
        </div>
        {!isEditing && <button onClick={() => setIsEditing(true)} className={styles.newBtn}>Edit Project</button>}
      </header>

      {isEditing ? (
        <div className={styles.tableCard} style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', color: '#f8fafc' }}>Edit Project Details</h3>
          <form onSubmit={handleUpdate}>
            <div className={styles.formGrid}>
              <div className={styles.fg}><label className={styles.fl}>Project Name</label><input required value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={styles.fi} /></div>
              <div className={styles.fg}><label className={styles.fl}>Status</label>
                <select value={form.status || ''} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={styles.fi}>
                  {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.fg}><label className={styles.fl}>Description</label><textarea value={form.description || ''} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={styles.fi} rows={2} /></div>
            <div className={styles.formGrid}>
              <div className={styles.fg}><label className={styles.fl}>Start Date</label><input type="date" value={form.start_date || ''} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} className={styles.fi} /></div>
              <div className={styles.fg}><label className={styles.fl}>End Date</label><input type="date" value={form.end_date || ''} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} className={styles.fi} /></div>
              <div className={styles.fg}><label className={styles.fl}>Completion %</label><input type="number" min="0" max="100" value={form.completion_pct || 0} onChange={e => setForm(f => ({...f, completion_pct: Number(e.target.value)}))} className={styles.fi} /></div>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.fg}><label className={styles.fl}>Budget</label><input type="number" value={form.budget || 0} onChange={e => setForm(f => ({...f, budget: Number(e.target.value)}))} className={styles.fi} /></div>
              <div className={styles.fg}><label className={styles.fl}>Location</label><input value={form.location || ''} onChange={e => setForm(f => ({...f, location: e.target.value}))} className={styles.fi} /></div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => { setIsEditing(false); setForm(project); }} className={styles.actionSelect}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className={styles.summaryGrid}>
          <div className={styles.sumCard}><span className={styles.sumLabel}>Status</span><span className={styles.sumVal} style={{ fontSize: '1.25rem' }}>{project.status}</span></div>
          <div className={styles.sumCard}><span className={styles.sumLabel}>Completion</span><span className={styles.sumVal}>{project.completion_pct || 0}%</span></div>
          <div className={styles.sumCard}><span className={styles.sumLabel}>Budget</span><span className={styles.sumVal}>${(project.budget || 0).toLocaleString()}</span></div>
          <div className={styles.sumCard}><span className={styles.sumLabel}>Location</span><span className={styles.sumVal} style={{ fontSize: '1rem', marginTop: 'auto' }}>{project.location || 'N/A'}</span></div>
        </div>
      )}

      <h3 style={{ margin: '1rem 0', color: '#f8fafc' }}>Project Tasks</h3>
      <div className={styles.tableCard}>
        {tasks.length > 0 ? (
          <table className={styles.table}>
            <thead><tr><th>Task</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Due Date</th></tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td className={styles.boldCell}>{t.title}</td>
                  <td>{t.employees?.name || 'Unassigned'}</td>
                  <td className={styles.subCell}>{t.priority}</td>
                  <td><span className={styles.categoryBadge}>{t.status}</span></td>
                  <td className={styles.subCell}>{t.due_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.loading}>No tasks created for this project yet.</div>
        )}
      </div>
    </div>
  );
}
