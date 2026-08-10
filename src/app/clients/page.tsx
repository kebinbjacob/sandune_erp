'use client';

import { useState, useEffect } from 'react';
import { getClients, createClient, Client } from '@/lib/services/crmService';
import styles from '../expenses/expenses.module.css';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });

  const load = async () => {
    setLoading(true);
    try { setClients(await getClients()); } catch(e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createClient({ ...form, status: 'Active' });
      setShowModal(false);
      setForm({ name: '', contact_person: '', email: '', phone: '', address: '' });
      await load();
    } catch (err) { alert('Failed to create client'); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Clients</h1>
          <p className={styles.subtitle}>Manage client relationships and contracts.</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.newBtn}>+ Add Client</button>
      </header>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading clients...</div> : (
          <table className={styles.table}>
            <thead>
              <tr><th>Company Name</th><th>Primary Contact</th><th>Email</th><th>Phone</th><th>Status</th></tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td className={styles.boldCell}>{c.name}</td>
                  <td>{c.contact_person || '—'}</td>
                  <td className={styles.subCell}>{c.email || '—'}</td>
                  <td className={styles.subCell}>{c.phone || '—'}</td>
                  <td><span className={styles.categoryBadge} style={{ background: c.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: c.status === 'Active' ? '#10b981' : '#fff' }}>{c.status}</span></td>
                </tr>
              ))}
              {clients.length === 0 && <tr><td colSpan={5} className={styles.loading}>No clients found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Client</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.fg}><label className={styles.fl}>Company Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={styles.fi} /></div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Contact Person</label><input value={form.contact_person} onChange={e => setForm(f => ({...f, contact_person: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className={styles.fi} /></div>
              </div>
              <div className={styles.fg}><label className={styles.fl}>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={styles.fi} /></div>
              <div className={styles.fg}><label className={styles.fl}>Address</label><textarea value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} className={styles.fi} rows={2} /></div>
              <div className={styles.modalFooter}>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : 'Save Client'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
