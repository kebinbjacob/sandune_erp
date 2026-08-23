'use client';

import { useState, useEffect } from 'react';
import { getMaterials, createMaterial, updateMaterial, Material } from '@/lib/services/resourceService';
import styles from '../expenses/expenses.module.css';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ item_name: '', category: '', current_stock: 0, unit: '', reorder_level: 0, location: '', status: '' });

  const load = async () => {
    setLoading(true);
    try { setMaterials(await getMaterials()); } catch(e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openModal = (material?: Material) => {
    if (material) {
      setEditingId(material.id || null);
      setForm({
        item_name: material.item_name,
        category: material.category,
        current_stock: material.current_stock,
        unit: material.unit,
        reorder_level: material.reorder_level,
        location: material.location || '',
        status: material.status
      });
    } else {
      setEditingId(null);
      setForm({ item_name: '', category: '', current_stock: 0, unit: '', reorder_level: 0, location: '', status: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const computedStatus = form.current_stock <= form.reorder_level ? 'Low Stock' : 'Healthy';
      if (editingId) {
        await updateMaterial(editingId, { ...form, status: computedStatus });
      } else {
        await createMaterial({ ...form, status: computedStatus });
      }
      setShowModal(false);
      await load();
    } catch (err) { alert('Failed to save material'); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Materials & Inventory</h1>
          <p className={styles.subtitle}>Track raw materials, stock levels, and locations.</p>
        </div>
        <button onClick={() => openModal()} className={styles.newBtn}>+ Add Material</button>
      </header>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading inventory...</div> : (
          <table className={styles.table}>
            <thead>
              <tr><th>Item Name</th><th>Category</th><th>Stock Level</th><th>Reorder Level</th><th>Location</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {materials.map(m => {
                const isLow = m.current_stock <= m.reorder_level;
                return (
                  <tr key={m.id}>
                    <td className={styles.boldCell}>{m.item_name}</td>
                    <td>{m.category}</td>
                    <td className={styles.boldCell}>{m.current_stock} {m.unit}</td>
                    <td className={styles.subCell}>{m.reorder_level} {m.unit}</td>
                    <td>{m.location || '—'}</td>
                    <td>
                      <span className={styles.categoryBadge} style={{ background: isLow ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: isLow ? '#ef4444' : '#10b981' }}>
                        {isLow ? 'Low Stock' : 'Healthy'}
                      </span>
                    </td>
                    <td><button className={styles.actionSelect} onClick={() => openModal(m)}>Edit</button></td>
                  </tr>
                );
              })}
              {materials.length === 0 && <tr><td colSpan={7} className={styles.loading}>No materials in inventory.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Edit Material' : 'Add Material'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Item Name *</label><input required value={form.item_name} onChange={e => setForm(f => ({...f, item_name: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Category *</label><input required value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={styles.fi} placeholder="e.g. Cement, Steel, Wood" /></div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Current Stock *</label><input type="number" required value={form.current_stock} onChange={e => setForm(f => ({...f, current_stock: Number(e.target.value)}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Unit *</label><input required value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))} className={styles.fi} placeholder="e.g. Tons, Bags, Pieces" /></div>
                <div className={styles.fg}><label className={styles.fl}>Reorder Level *</label><input type="number" required value={form.reorder_level} onChange={e => setForm(f => ({...f, reorder_level: Number(e.target.value)}))} className={styles.fi} /></div>
              </div>
              <div className={styles.fg}><label className={styles.fl}>Storage Location</label><input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} className={styles.fi} /></div>
              
              <div className={styles.modalFooter}>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Material')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
