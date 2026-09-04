'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProject, PROJECT_STATUSES, Project } from '@/lib/services/projectService';
import { getClients, Client } from '@/lib/services/crmService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import styles from '../projects.module.css';

export default function NewProjectPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    client: '',
    status: 'Planning',
    location: '',
    start_date: '',
    end_date: '',
    budget: '',
    description: '',
    manager_id: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [c, e] = await Promise.all([getClients(), getEmployees()]);
        setClients(c);
        setEmployees(e);
      } catch (err) {
        console.error('Error loading clients/employees:', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Please enter a project title.');
      return;
    }

    setSaving(true);
    try {
      const code = `PRJ-${Date.now().toString().slice(-5)}`;
      await createProject({
        project_code: code,
        name: form.name.trim(),
        client: form.client || undefined,
        status: form.status,
        location: form.location.trim() || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        description: form.description.trim() || undefined,
        manager_id: form.manager_id || undefined,
        completion_pct: 0,
      } as Partial<Project>);

      router.push('/projects');
    } catch (err: any) {
      alert(err.message || 'Failed to create project.');
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div style={{ marginBottom: '0.5rem' }}>
            <Link href="/projects" style={{ color: '#a5b4fc', fontSize: '0.85rem', textDecoration: 'none' }}>
              ← Back to Projects
            </Link>
          </div>
          <h1 className={styles.title}>Create New Project</h1>
          <p className={styles.subtitle}>Set up a new construction site, schedule, and allocated budget</p>
        </div>
      </header>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '800px',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={styles.fg}>
            <label className={styles.fl}>Project Title *</label>
            <input
              type="text"
              required
              className={styles.fi}
              placeholder="e.g. Skyline Luxury Tower"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fg}>
              <label className={styles.fl}>Client</label>
              <select
                className={styles.fi}
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fg}>
              <label className={styles.fl}>Status</label>
              <select
                className={styles.fi}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fg}>
              <label className={styles.fl}>Site Location</label>
              <input
                type="text"
                className={styles.fi}
                placeholder="e.g. Downtown Sector 4"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className={styles.fg}>
              <label className={styles.fl}>Project Manager</label>
              <select
                className={styles.fi}
                value={form.manager_id}
                onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
              >
                <option value="">Select Project Manager...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fg}>
              <label className={styles.fl}>Start Date</label>
              <input
                type="date"
                className={styles.fi}
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>

            <div className={styles.fg}>
              <label className={styles.fl}>Deadline / End Date</label>
              <input
                type="date"
                className={styles.fi}
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.fg}>
            <label className={styles.fl}>Total Budget (₹)</label>
            <input
              type="number"
              min="0"
              step="any"
              className={styles.fi}
              placeholder="e.g. 5000000"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
          </div>

          <div className={styles.fg}>
            <label className={styles.fl}>Description & Scope</label>
            <textarea
              rows={4}
              className={styles.fi}
              placeholder="Detailed description of the project deliverables..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => router.push('/projects')}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={styles.submitBtn}
            >
              {saving ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}