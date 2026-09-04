'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { getAllTasks, updateTask, deleteTask, Task, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/services/taskService';
import { getProjects, Project } from '@/lib/services/projectService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import styles from "../employees/page.module.css";
import modalStyles from "./board/board.module.css";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', project_id: '', assigned_to: '', priority: 'Medium', status: 'To Do', due_date: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const [t, p, e] = await Promise.all([getAllTasks(), getProjects(), getEmployees()]);
      setTasks(t);
      setProjects(p);
      setEmployees(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      project_id: task.project_id || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority || 'Medium',
      status: task.status || 'To Do',
      due_date: task.due_date || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask?.id) return;
    setSaving(true);
    try {
      await updateTask(editingTask.id, {
        title: form.title,
        description: form.description || undefined,
        project_id: form.project_id,
        assigned_to: form.assigned_to || null,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null
      });
      setShowEditModal(false);
      await load();
    } catch (err) {
      alert('Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete task "${title}"?`)) return;
    try {
      await deleteTask(id);
      await load();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const columns = [
    { header: "Task", accessor: "title" },
    { 
      header: "Project", 
      accessor: "project",
      render: (_: any, row: any) => row.projects?.name || '—'
    },
    { 
      header: "Assigned To", 
      accessor: "assignee",
      render: (_: any, row: any) => row.employees ? `${row.employees.name} (${row.employees.role})` : <span style={{ color: 'var(--text-secondary)' }}>Unassigned</span>
    },
    { 
      header: "Priority", 
      accessor: "priority",
      render: (value: string) => {
        let color = '#10b981';
        if (value === 'Medium') color = '#f59e0b';
        if (value === 'High') color = '#ef4444';
        if (value === 'Critical') color = '#7f1d1d';
        return <span style={{ color, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>{value}</span>;
      }
    },
    { 
      header: "Status", 
      accessor: "status",
      render: (value: string) => (
        <span className={`${styles.statusBadge} ${value === 'Completed' ? styles.statusActive : (value === 'Blocked' ? styles.statusLeave : '')}`} style={value === 'Completed' ? {} : value === 'Blocked' ? { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
          {value}
        </span>
      )
    },
    {
      header: "Due Date",
      accessor: "due_date",
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    },
    {
      header: "Actions",
      accessor: "id",
      render: (id: string, row: Task) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => openEditModal(row)}
            style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(id, row.title)}
            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  // Filter State (R13)
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const filteredTasks = tasks.filter(t => {
    if (projectFilter && t.project_id !== projectFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchAssignee = t.employees?.name?.toLowerCase().includes(q);
      const matchProject = t.projects?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee && !matchProject) return false;
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Tasks List</h1>
          <p className={styles.subtitle}>Manage all daily assignments across projects.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/tasks/board" className={styles.secondaryButton} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>Kanban Board</Link>
          <Link href="/tasks/board" className={styles.primaryButton}>+ Add Task</Link>
        </div>
      </header>

      {/* R13: Search & Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <input
          type="text"
          placeholder="🔍 Search tasks, assignees, projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', padding: '8px 12px', fontSize: '0.85rem', flex: 1, minWidth: '200px' }}
        />
        <select
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', padding: '8px 12px', fontSize: '0.85rem', minWidth: '150px' }}
        >
          <option value="" style={{ background: '#1e1e2e' }}>All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id} style={{ background: '#1e1e2e' }}>{p.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', padding: '8px 12px', fontSize: '0.85rem', minWidth: '130px' }}
        >
          <option value="" style={{ background: '#1e1e2e' }}>All Statuses</option>
          {TASK_STATUSES.map(s => <option key={s} value={s} style={{ background: '#1e1e2e' }}>{s}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', padding: '8px 12px', fontSize: '0.85rem', minWidth: '130px' }}
        >
          <option value="" style={{ background: '#1e1e2e' }}>All Priorities</option>
          {TASK_PRIORITIES.map(p => <option key={p} value={p} style={{ background: '#1e1e2e' }}>{p}</option>)}
        </select>
        {(search || projectFilter || statusFilter || priorityFilter) && (
          <button
            onClick={() => { setSearch(''); setProjectFilter(''); setStatusFilter(''); setPriorityFilter(''); }}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Clear
          </button>
        )}
      </div>

      <Card>
        {loading ? <div style={{ padding: '20px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Loading tasks...</div> : (
          <Table columns={columns} data={filteredTasks} />
        )}
      </Card>

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className={modalStyles.overlay} onClick={() => setShowEditModal(false)}>
          <div className={modalStyles.modal} onClick={e => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <h2 className={modalStyles.modalTitle}>Edit Task</h2>
              <button className={modalStyles.closeBtn} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className={modalStyles.modalForm}>
              <div className={modalStyles.formGrid}>
                <div className={modalStyles.fg}>
                  <label className={modalStyles.fl}>Task Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className={modalStyles.fi} placeholder="What needs to be done?" />
                </div>
                <div className={modalStyles.fg}>
                  <label className={modalStyles.fl}>Project *</label>
                  <select required value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))} className={modalStyles.fi}>
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className={modalStyles.fg}>
                  <label className={modalStyles.fl}>Assigned To</label>
                  <select value={form.assigned_to} onChange={e => setForm(f => ({...f, assigned_to: e.target.value}))} className={modalStyles.fi}>
                    <option value="">Unassigned</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                  </select>
                </div>
                <div className={modalStyles.fg}>
                  <label className={modalStyles.fl}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={modalStyles.fi}>
                    {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className={modalStyles.fg}>
                  <label className={modalStyles.fl}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className={modalStyles.fi}>
                    {TASK_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className={modalStyles.fg}>
                  <label className={modalStyles.fl}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} className={modalStyles.fi} />
                </div>
              </div>
              <div className={modalStyles.fg}>
                <label className={modalStyles.fl}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={modalStyles.fi} rows={3} placeholder="Task details..." style={{ resize: 'vertical' }} />
              </div>
              <div className={modalStyles.modalFooter}>
                <button type="button" onClick={() => setShowEditModal(false)} className={modalStyles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} className={modalStyles.submitBtn}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

