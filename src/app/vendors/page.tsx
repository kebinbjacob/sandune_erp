'use client';

import { useState, useEffect } from 'react';
import { getVendors, createVendor, updateVendor, Vendor } from '@/lib/services/crmService';
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Vendors & Suppliers</h1>
          <p className={styles.subtitle}>Directory of material and equipment suppliers.</p>
        </div>
        <button onClick={() => openModal()} className={styles.newBtn}>+ Add Vendor</button>
      </header>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading vendors...</div> : (
          <table className={styles.table}>
            <thead>
              <tr><th>Vendor Name</th><th>Category</th><th>Primary Contact</th><th>Email</th><th>Phone</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id}>
                  <td className={styles.boldCell}>{v.name}</td>
                  <td><span className={styles.categoryBadge} style={{background: 'rgba(255,255,255,0.05)'}}>{v.category}</span></td>
                  <td>{v.contact_person || '—'}</td>
                  <td className={styles.subCell}>{v.email || '—'}</td>
                  <td className={styles.subCell}>{v.phone || '—'}</td>
                  <td><button className={styles.actionSelect} onClick={() => openModal(v)}>Edit</button></td>
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
