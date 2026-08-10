'use client';

import { useState, useEffect } from 'react';
import { getContractors, createContractor, Contractor } from '@/lib/services/crmService';
import styles from '../expenses/expenses.module.css';

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ name: '', specialization: '', contact_person: '', email: '', phone: '', rating: 5 });

  const load = async () => {
    setLoading(true);
    try { setContractors(await getContractors()); } catch(e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createContractor({ ...form, status: 'Active' });
      setShowModal(false);
      setForm({ name: '', specialization: '', contact_person: '', email: '', phone: '', rating: 5 });
      await load();
    } catch (err) { alert('Failed to create contractor'); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Contractors</h1>
          <p className={styles.subtitle}>Directory of sub-contractors and specialists.</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.newBtn}>+ Add Contractor</button>
      </header>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading contractors...</div> : (
          <table className={styles.table}>
            <thead>
              <tr><th>Name / Specialization</th><th>Primary Contact</th><th>Email</th><th>Phone</th><th>Rating</th></tr>
            </thead>
            <tbody>
              {contractors.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.boldCell}>{c.name}</div>
                    <span className={styles.categoryBadge}>{c.specialization}</span>
                  </td>
                  <td>{c.contact_person || '—'}</td>
                  <td className={styles.subCell}>{c.email || '—'}</td>
                  <td className={styles.subCell}>{c.phone || '—'}</td>
                  <td style={{ color: '#f59e0b' }}>{'★'.repeat(c.rating || 0)}{'☆'.repeat(5 - (c.rating || 0))}</td>
                </tr>
              ))}
              {contractors.length === 0 && <tr><td colSpan={5} className={styles.loading}>No contractors found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Contractor</h2>
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
              <div className={styles.modalFooter}>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : 'Save Contractor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
