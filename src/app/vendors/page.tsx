'use client';

import { useState, useEffect } from 'react';
import { getVendors, createVendor, updateVendor, deleteVendor, Vendor } from '@/lib/services/crmService';
import styles from '../expenses/expenses.module.css';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ name: '', category: '', contact_person: '', email: '', phone: '', status: 'Active' });

  const load = async () => {
    setLoading(true);
    try { setVendors(await getVendors()); } catch(e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${name}"?`)) return;
    try {
      await deleteVendor(id);
      await load();
    } catch (err) {
      alert('Failed to delete vendor');
    }
  };

  const openModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingId(vendor.id || null);
      setForm({
        name: vendor.name,
        category: vendor.category,
        contact_person: vendor.contact_person || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        status: vendor.status || 'Active'
      });
    } else {
      setEditingId(null);
      setForm({ name: '', category: '', contact_person: '', email: '', phone: '', status: 'Active' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateVendor(editingId, form);
      } else {
        await createVendor({ ...form, status: 'Active' });
      }
      setShowModal(false);
      await load();
    } catch (err) { alert('Failed to save vendor'); }
    finally { setSaving(false); }
  };

  // R13 Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredVendors = vendors.filter(v => {
    if (statusFilter !== 'All' && v.status !== statusFilter) return false;
    if (categoryFilter !== 'All' && v.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchCat = v.category?.toLowerCase().includes(q);
      const matchContact = v.contact_person?.toLowerCase().includes(q);
      const matchEmail = v.email?.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchContact && !matchEmail) return false;
    }
    return true;
  });

  const categories = ['All', ...Array.from(new Set(vendors.map(v => v.category).filter(Boolean)))];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Vendors & Suppliers</h1>
          <p className={styles.subtitle}>Directory of material and equipment suppliers.</p>
        </div>
        <button onClick={() => openModal()} className={styles.newBtn}>+ Add Vendor</button>
      </header>

      {/* R13: Search & Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <input
          type="text"
          placeholder="🔍 Search vendors by name, category, contact..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.fi}
          style={{ flex: 1, minWidth: '220px' }}
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className={styles.fi}
          style={{ width: 'auto', minWidth: '150px' }}
        >
          {categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className={styles.fi}
          style={{ width: 'auto', minWidth: '130px' }}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        {(search || categoryFilter !== 'All' || statusFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setCategoryFilter('All'); setStatusFilter('All'); }}
            className={styles.cancelBtn}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            Clear
          </button>
        )}
      </div>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading vendors...</div> : (
          <table className={styles.table}>
            <thead>
              <tr><th>Vendor Name</th><th>Category</th><th>Primary Contact</th><th>Email</th><th>Phone</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredVendors.map(v => (
                <tr key={v.id}>
                  <td className={styles.boldCell}>{v.name}</td>
                  <td><span className={styles.categoryBadge} style={{background: 'rgba(255,255,255,0.05)'}}>{v.category}</span></td>
                  <td>{v.contact_person || '—'}</td>
                  <td className={styles.subCell}>{v.email || '—'}</td>
                  <td className={styles.subCell}>{v.phone || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button className={styles.actionSelect} onClick={() => openModal(v)}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(v.id!, v.name)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && <tr><td colSpan={6} className={styles.loading}>No vendors found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Edit Vendor' : 'Add Vendor'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.fg}><label className={styles.fl}>Vendor Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={styles.fi} /></div>
              <div className={styles.fg}><label className={styles.fl}>Category *</label>
                <select required value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={styles.fi}>
                  <option value="">Select Category...</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Heavy Machinery">Heavy Machinery</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Hardware Tools">Hardware Tools</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className={styles.fg}><label className={styles.fl}>Contact Person</label><input value={form.contact_person} onChange={e => setForm(f => ({...f, contact_person: e.target.value}))} className={styles.fi} /></div>
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
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Vendor')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
