'use client';

import { useState, useEffect } from 'react';
import { getContractors, createContractor, updateContractor, deleteContractor, Contractor } from '@/lib/services/crmService';
import styles from '../expenses/expenses.module.css';

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ name: '', specialization: '', contact_person: '', email: '', phone: '', rating: 5, status: 'Active' });

  const load = async () => {
    setLoading(true);
    try { setContractors(await getContractors()); } catch(e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete contractor "${name}"?`)) return;
    try {
      await deleteContractor(id);
      await load();
    } catch (err) {
      alert('Failed to delete contractor');
    }
  };

  const openModal = (contractor?: Contractor) => {
    if (contractor) {
      setEditingId(contractor.id || null);
      setForm({
        name: contractor.name,
        specialization: contractor.specialization,
        contact_person: contractor.contact_person || '',
        email: contractor.email || '',
        phone: contractor.phone || '',
        rating: contractor.rating || 5,
        status: contractor.status || 'Active'
      });
    } else {
      setEditingId(null);
      setForm({ name: '', specialization: '', contact_person: '', email: '', phone: '', rating: 5, status: 'Active' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateContractor(editingId, form);
      } else {
        await createContractor({ ...form, status: 'Active' });
      }
      setShowModal(false);
      await load();
    } catch (err) { alert('Failed to save contractor'); }
    finally { setSaving(false); }
  };

  // R13 Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredContractors = contractors.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchSpec = c.specialization?.toLowerCase().includes(q);
      const matchContact = c.contact_person?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      if (!matchName && !matchSpec && !matchContact && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Contractors</h1>
          <p className={styles.subtitle}>Directory of sub-contractors and specialists.</p>
        </div>
        <button onClick={() => openModal()} className={styles.newBtn}>+ Add Contractor</button>
      </header>

      {/* R13: Search & Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <input
          type="text"
          placeholder="🔍 Search contractors by name, specialization, contact..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.fi}
          style={{ flex: 1, minWidth: '220px' }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className={styles.fi}
          style={{ width: 'auto', minWidth: '140px' }}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        {(search || statusFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('All'); }}
            className={styles.cancelBtn}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            Clear
          </button>
        )}
      </div>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading contractors...</div> : (
          <table className={styles.table}>
            <thead>
              <tr><th>Name / Specialization</th><th>Primary Contact</th><th>Email</th><th>Phone</th><th>Rating</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredContractors.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.boldCell}>{c.name}</div>
                    <span className={styles.categoryBadge}>{c.specialization}</span>
                  </td>
                  <td>{c.contact_person || '—'}</td>
                  <td className={styles.subCell}>{c.email || '—'}</td>
                  <td className={styles.subCell}>{c.phone || '—'}</td>
                  <td style={{ color: '#f59e0b' }}>{'★'.repeat(c.rating || 0)}{'☆'.repeat(5 - (c.rating || 0))}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button className={styles.actionSelect} onClick={() => openModal(c)}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(c.id!, c.name)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {contractors.length === 0 && <tr><td colSpan={6} className={styles.loading}>No contractors found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Edit Contractor' : 'Add Contractor'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.fg}><label className={styles.fl}>Company/Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={styles.fi} /></div>
              <div className={styles.fg}><label className={styles.fl}>Specialization *</label><input required value={form.specialization} onChange={e => setForm(f => ({...f, specialization: e.target.value}))} className={styles.fi} placeholder="e.g. Plumbing, Electrical, Concrete" /></div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Contact Person</label><input value={form.contact_person} onChange={e => setForm(f => ({...f, contact_person: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Rating (1-5)</label><input type="number" min="1" max="5" value={form.rating} onChange={e => setForm(f => ({...f, rating: Number(e.target.value)}))} className={styles.fi} /></div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className={styles.fi} /></div>
              </div>
              {editingId && (
                <div className={styles.fg}><label className={styles.fl}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={styles.fi}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className={styles.modalFooter}>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Contractor')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
