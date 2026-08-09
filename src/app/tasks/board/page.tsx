'use client';

import { useState, useEffect } from 'react';
import { getAllTasks, createTask, updateTaskStatus, Task, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/services/taskService';
import { getProjects, Project } from '@/lib/services/projectService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import styles from './board.module.css';

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
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
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to allow CSS dragging effects
    setTimeout(() => {
      const el = document.getElementById(`task-${id}`);
      if (el) el.classList.add(styles.dragging);
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    const el = document.getElementById(`task-${id}`);
    if (el) el.classList.remove(styles.dragging);
    setDraggedTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: newStatus } : t));

    try {
      await updateTaskStatus(draggedTaskId, newStatus);
    } catch (err) {
      alert('Failed to update status.');
      await load(); // Revert on failure
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createTask({
        title: form.title,
        description: form.description || null,
        project_id: form.project_id,
        assigned_to: form.assigned_to || null,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null
      });
      setShowModal(false);
      setForm({ title: '', description: '', project_id: '', assigned_to: '', priority: 'Medium', status: 'To Do', due_date: '' });
      await load();
    } catch (err) {
      alert('Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  const priorityColors: Record<string, string> = {
    Low: '#10b981', Medium: '#f59e0b', High: '#ef4444', Critical: '#7f1d1d'
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Kanban Board</h1>
          <p className={styles.subtitle}>Drag and drop tasks to manage progress</p>
        </div>
        <button className={styles.newBtn} onClick={() => setShowModal(true)}>+ New Task</button>
      </header>

      {loading ? <div className={styles.loading}>Loading board...</div> : (
        <div className={styles.board}>
          {TASK_STATUSES.map(status => {
            const columnTasks = tasks.filter(t => t.status === status);
            return (
              <div 
                key={status} 
                className={styles.column}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className={styles.colHeader}>
                  <h3 className={styles.colTitle}>{status}</h3>
                  <span className={styles.colCount}>{columnTasks.length}</span>
                </div>
                
                <div className={styles.taskList}>
                  {columnTasks.map(task => (
                    <div 
                      key={task.id}
                      id={`task-${task.id}`}
                      className={styles.taskCard}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id!)}
                      onDragEnd={(e) => handleDragEnd(e, task.id!)}
                    >
                      <div className={styles.taskTags}>
                        <span className={styles.priorityTag} style={{ background: `${priorityColors[task.priority]}22`, color: priorityColors[task.priority] }}>
                          {task.priority}
                        </span>
                        <span className={styles.projectTag}>{task.projects?.name || 'No Project'}</span>
                      </div>
                      
                      <h4 className={styles.taskTitle}>{task.title}</h4>
                      {task.description && <p className={styles.taskDesc}>{task.description}</p>}
                      
                      <div className={styles.taskFooter}>
                        <div className={styles.assignee}>
                          {task.employees ? (
                            <>
                              <div className={styles.avatar}>{task.employees.name.charAt(0)}</div>
                              <span className={styles.assigneeName}>{task.employees.name}</span>
                            </>
                          ) : (
                            <span className={styles.unassigned}>Unassigned</span>
                          )}
                        </div>
                        {task.due_date && (
                          <span className={styles.dueDate}>
                            📅 {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Task</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Task Title *</label><input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className={styles.fi} placeholder="What needs to be done?" /></div>
                <div className={styles.fg}><label className={styles.fl}>Project *</label>
                  <select required value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))} className={styles.fi}>
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className={styles.fg}><label className={styles.fl}>Assigned To</label>
                  <select value={form.assigned_to} onChange={e => setForm(f => ({...f, assigned_to: e.target.value}))} className={styles.fi}>
                    <option value="">Unassigned</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                  </select>
                </div>
                <div className={styles.fg}><label className={styles.fl}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={styles.fi}>
                    {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.fg}><label className={styles.fl}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className={styles.fi}>
                    {TASK_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className={styles.fg}><label className={styles.fl}>Due Date</label><input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} className={styles.fi} /></div>
              </div>
              <div className={styles.fg}><label className={styles.fl}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={styles.fi} rows={3} placeholder="Task details..." style={{ resize: 'vertical' }} /></div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : '+ Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}