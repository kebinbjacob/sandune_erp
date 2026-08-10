'use client';

import { useState, useEffect } from 'react';
import { getPurchaseOrders, createPurchaseOrder, PurchaseOrder } from '@/lib/services/resourceService';
import { getVendors, Vendor } from '@/lib/services/crmService';
import { getProjects, Project } from '@/lib/services/projectService';
import styles from '../expenses/expenses.module.css';

export default function ProcurementPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ po_number: '', vendor_id: '', project_id: '', order_date: '', expected_delivery: '', total_amount: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const [p, v, prj] = await Promise.all([getPurchaseOrders(), getVendors(), getProjects()]);
      setPos(p);
      setVendors(v);
      setProjects(prj);
    } catch(e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPurchaseOrder({
        ...form,
        project_id: form.project_id || null,
        expected_delivery: form.expected_delivery || null,
        status: 'Draft'
      });
      setShowModal(false);
      setForm({ po_number: '', vendor_id: '', project_id: '', order_date: '', expected_delivery: '', total_amount: 0 });
      await load();
    } catch (err) { alert('Failed to create purchase order'); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Procurement (PO)</h1>
          <p className={styles.subtitle}>Manage purchase orders and vendor deliveries.</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.newBtn}>+ Create PO</button>
      </header>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading purchase orders...</div> : (
          <table className={styles.table}>
            <thead>
              <tr><th>PO Number</th><th>Vendor</th><th>Project</th><th>Order Date</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {pos.map(po => (
                <tr key={po.id}>
                  <td className={styles.boldCell}>{po.po_number}</td>
                  <td>{po.vendors?.name || '—'}</td>
                  <td>{po.projects?.name || '—'}</td>
                  <td className={styles.subCell}>{po.order_date}</td>
                  <td className={styles.boldCell}>${po.total_amount?.toLocaleString()}</td>
                  <td><span className={styles.categoryBadge} style={{ background: po.status === 'Draft' ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.2)', color: po.status === 'Draft' ? '#cbd5e1' : '#818cf8' }}>{po.status}</span></td>
                </tr>
              ))}
              {pos.length === 0 && <tr><td colSpan={6} className={styles.loading}>No purchase orders found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create Purchase Order</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>PO Number *</label><input required value={form.po_number} onChange={e => setForm(f => ({...f, po_number: e.target.value}))} className={styles.fi} placeholder="PO-2026-001" /></div>
                <div className={styles.fg}><label className={styles.fl}>Vendor *</label>
                  <select required value={form.vendor_id} onChange={e => setForm(f => ({...f, vendor_id: e.target.value}))} className={styles.fi}>
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Charge to Project</label>
                  <select value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))} className={styles.fi}>
                    <option value="">None (Overhead)</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className={styles.fg}><label className={styles.fl}>Total Amount *</label><input type="number" required value={form.total_amount} onChange={e => setForm(f => ({...f, total_amount: Number(e.target.value)}))} className={styles.fi} /></div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Order Date *</label><input type="date" required value={form.order_date} onChange={e => setForm(f => ({...f, order_date: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Expected Delivery</label><input type="date" value={form.expected_delivery} onChange={e => setForm(f => ({...f, expected_delivery: e.target.value}))} className={styles.fi} /></div>
              </div>
              <div className={styles.modalFooter}>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : 'Create PO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
