'use client';

import { useState, useEffect } from 'react';
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, PurchaseOrder, POLineItem } from '@/lib/services/resourceService';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);
  const [form, setForm] = useState({ po_number: '', vendor_id: '', project_id: '', order_date: '', expected_delivery: '', total_amount: 0, status: 'Draft' });

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

  const handleDelete = async (id: string, poNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete purchase order "${poNumber}"?`)) return;
    try {
      await deletePurchaseOrder(id);
      await load();
    } catch (err) {
      alert('Failed to delete purchase order');
    }
  };

  const openModal = (po?: PurchaseOrder) => {
    if (po) {
      setEditingId(po.id || null);
      setLineItems(po.line_items && Array.isArray(po.line_items) ? po.line_items : []);
      setForm({
        po_number: po.po_number,
        vendor_id: po.vendor_id,
        project_id: po.project_id || '',
        order_date: po.order_date,
        expected_delivery: po.expected_delivery || '',
        total_amount: po.total_amount,
        status: po.status || 'Draft'
      });
    } else {
      setEditingId(null);
      setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
      setForm({ po_number: '', vendor_id: '', project_id: '', order_date: '', expected_delivery: '', total_amount: 0, status: 'Draft' });
    }
    setShowModal(true);
  };

  const updateLineItem = (index: number, field: keyof POLineItem, value: string | number) => {
    setLineItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const computedTotal = lineItems.length > 0
    ? lineItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0)
    : Number(form.total_amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        line_items: lineItems,
        total_amount: computedTotal,
        project_id: form.project_id || null,
        expected_delivery: form.expected_delivery || null,
        status: form.status
      };
      if (editingId) {
        await updatePurchaseOrder(editingId, payload);
      } else {
        await createPurchaseOrder(payload);
      }
      setShowModal(false);
      await load();
    } catch (err) { alert('Failed to save purchase order'); }
    finally { setSaving(false); }
  };

  // R13 Search & Filter
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredPOs = pos.filter(po => {
    if (vendorFilter && po.vendor_id !== vendorFilter) return false;
    if (statusFilter !== 'All' && po.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchPO = po.po_number.toLowerCase().includes(q);
      const matchVendor = po.vendors?.name?.toLowerCase().includes(q);
      const matchProject = po.projects?.name?.toLowerCase().includes(q);
      if (!matchPO && !matchVendor && !matchProject) return false;
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Procurement (PO)</h1>
          <p className={styles.subtitle}>Manage purchase orders and vendor deliveries.</p>
        </div>
        <button onClick={() => openModal()} className={styles.newBtn}>+ Create PO</button>
      </header>

      {/* R13: Search & Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <input
          type="text"
          placeholder="🔍 Search PO number, vendor, or project..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.fi}
          style={{ flex: 1, minWidth: '220px' }}
        />
        <select
          value={vendorFilter}
          onChange={e => setVendorFilter(e.target.value)}
          className={styles.fi}
          style={{ width: 'auto', minWidth: '160px' }}
        >
          <option value="">All Vendors</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className={styles.fi}
          style={{ width: 'auto', minWidth: '130px' }}
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Delivered">Delivered</option>
          <option value="Paid">Paid</option>
        </select>
        {(search || vendorFilter || statusFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setVendorFilter(''); setStatusFilter('All'); }}
            className={styles.cancelBtn}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            Clear
          </button>
        )}
      </div>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading purchase orders...</div> : (
          <table className={styles.table}>
            <thead>
              <tr><th>PO Number</th><th>Vendor</th><th>Project</th><th>Order Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredPOs.map(po => (
                <tr key={po.id}>
                  <td className={styles.boldCell}>{po.po_number}</td>
                  <td>{po.vendors?.name || '—'}</td>
                  <td>{po.projects?.name || '—'}</td>
                  <td className={styles.subCell}>{po.order_date}</td>
                  <td className={styles.boldCell}>₹{po.total_amount?.toLocaleString('en-IN')}</td>
                  <td><span className={styles.categoryBadge} style={{ background: po.status === 'Draft' ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.2)', color: po.status === 'Draft' ? '#cbd5e1' : '#818cf8' }}>{po.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button className={styles.actionSelect} onClick={() => openModal(po)}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(po.id!, po.po_number)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pos.length === 0 && <tr><td colSpan={7} className={styles.loading}>No purchase orders found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
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
                <div className={styles.fg}>
                  <label className={styles.fl}>Total Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={computedTotal}
                    readOnly
                    className={styles.fi}
                    style={{ background: 'rgba(255,255,255,0.03)', color: '#10b981', fontWeight: 700 }}
                  />
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Order Date *</label><input type="date" required value={form.order_date} onChange={e => setForm(f => ({...f, order_date: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Expected Delivery</label><input type="date" value={form.expected_delivery} onChange={e => setForm(f => ({...f, expected_delivery: e.target.value}))} className={styles.fi} /></div>
              </div>

              {/* Line Items Repeater */}
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className={styles.fl}>Line Items ({lineItems.length})</label>
                  <button
                    type="button"
                    onClick={() => setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])}
                    style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    + Add Item
                  </button>
                </div>
                {lineItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      placeholder="Item Description"
                      value={item.description}
                      onChange={e => updateLineItem(idx, 'description', e.target.value)}
                      className={styles.fi}
                      style={{ padding: '6px 8px' }}
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => updateLineItem(idx, 'quantity', Number(e.target.value))}
                      className={styles.fi}
                      style={{ padding: '6px 8px' }}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Unit Price"
                      value={item.unit_price}
                      onChange={e => updateLineItem(idx, 'unit_price', Number(e.target.value))}
                      className={styles.fi}
                      style={{ padding: '6px 8px' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                      ₹{((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px' }}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {editingId && (
                <div className={styles.fg}><label className={styles.fl}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={styles.fi}>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              )}
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Create PO')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

