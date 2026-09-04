'use client';

import { useState, useEffect } from 'react';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment, Equipment } from '@/lib/services/resourceService';
import { getProjects, Project } from '@/lib/services/projectService';
import styles from '../expenses/expenses.module.css';

export default function EquipmentPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ name: '', category: '', serial_number: '', current_project_id: '', last_maintenance_date: '', next_maintenance_date: '', maintenance_notes: '', status: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [eq, prj] = await Promise.all([getEquipment(), getProjects()]);
      setEquipments(eq);
      setProjects(prj);
    } catch(e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete equipment "${name}"?`)) return;
    try {
      await deleteEquipment(id);
      await load();
    } catch (err) {
      alert('Failed to delete equipment');
    }
  };

  const openModal = (equipment?: Equipment) => {
    if (equipment) {
      setEditingId(equipment.id || null);
      setForm({
        name: equipment.name,
        category: equipment.category,
        serial_number: equipment.serial_number || '',
        current_project_id: equipment.current_project_id || '',
        last_maintenance_date: equipment.last_maintenance_date || '',
        next_maintenance_date: equipment.next_maintenance_date || '',
        maintenance_notes: equipment.maintenance_notes || '',
        status: equipment.status || ''
      });
    } else {
      setEditingId(null);
      setForm({ name: '', category: '', serial_number: '', current_project_id: '', last_maintenance_date: '', next_maintenance_date: '', maintenance_notes: '', status: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        current_project_id: form.current_project_id || null,
        last_maintenance_date: form.last_maintenance_date || null,
        next_maintenance_date: form.next_maintenance_date || null,
        maintenance_notes: form.maintenance_notes || null,
        status: form.current_project_id ? 'In Use' : 'Available'
      };
      if (editingId) {
        await updateEquipment(editingId, payload);
      } else {
        await createEquipment(payload);
      }
      setShowModal(false);
      await load();
    } catch (err) { alert('Failed to save equipment'); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Heavy Equipment</h1>
          <p className={styles.subtitle}>Manage machinery, assignments, and maintenance.</p>
        </div>
        <button onClick={() => openModal()} className={styles.newBtn}>+ Add Equipment</button>
      </header>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading equipment...</div> : (
          <table className={styles.table}>
            <thead>
              <tr><th>Equipment Name</th><th>Serial / Asset No.</th><th>Current Project</th><th>Status</th><th>Next Maintenance</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {equipments.map(eq => (
                <tr key={eq.id}>
                  <td>
                    <div className={styles.boldCell}>{eq.name}</div>
                    <span className={styles.categoryBadge} style={{background: 'rgba(255,255,255,0.05)'}}>{eq.category}</span>
                    <details style={{ marginTop: '6px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                      <summary style={{ outline: 'none', userSelect: 'none', color: '#818cf8', fontWeight: 600 }}>📝 Maintenance Notes</summary>
                      <p style={{ margin: '4px 0 0', padding: '6px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.8)' }}>
                        {eq.maintenance_notes || 'No maintenance notes logged.'}
                      </p>
                    </details>
                  </td>
                  <td className={styles.subCell}>{eq.serial_number || '—'}</td>
                  <td>{eq.projects?.name || <span style={{color: 'rgba(255,255,255,0.3)'}}>Unassigned</span>}</td>
                  <td><span className={styles.categoryBadge} style={{ background: eq.status === 'Available' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99,102,241,0.2)', color: eq.status === 'Available' ? '#10b981' : '#818cf8' }}>{eq.status}</span></td>
                  <td className={styles.subCell}>{eq.next_maintenance_date || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button className={styles.actionSelect} onClick={() => openModal(eq)}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(eq.id!, eq.name)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {equipments.length === 0 && <tr><td colSpan={6} className={styles.loading}>No equipment records found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Edit Equipment' : 'Add Equipment'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Equipment Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Category *</label><input required value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={styles.fi} placeholder="e.g. Excavator, Crane" /></div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Serial/Asset No.</label><input value={form.serial_number} onChange={e => setForm(f => ({...f, serial_number: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Assign Project</label>
                  <select value={form.current_project_id} onChange={e => setForm(f => ({...f, current_project_id: e.target.value}))} className={styles.fi}>
                    <option value="">Unassigned</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Last Maintenance</label><input type="date" value={form.last_maintenance_date} onChange={e => setForm(f => ({...f, last_maintenance_date: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Next Maintenance</label><input type="date" value={form.next_maintenance_date} onChange={e => setForm(f => ({...f, next_maintenance_date: e.target.value}))} className={styles.fi} /></div>
              </div>
              <div className={styles.fg}>
                <label className={styles.fl}>Maintenance Notes</label>
                <textarea
                  value={form.maintenance_notes}
                  onChange={e => setForm(f => ({...f, maintenance_notes: e.target.value}))}
                  className={styles.fi}
                  rows={3}
                  placeholder="Logs, issues, parts replaced..."
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Equipment')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

