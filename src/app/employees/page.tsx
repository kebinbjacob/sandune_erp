"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getEmployees, createEmployee, updateEmployee, Employee } from "@/lib/services/employeeService";
import styles from "../expenses/expenses.module.css";

const defaultMockEmployees: Employee[] = [
  { id: '1', employee_id: 'EMP-001', name: 'John Doe', role: 'Site Engineer', department: 'Civil', project: 'Skyline Tower', status: 'Active' },
  { id: '2', employee_id: 'EMP-002', name: 'Sarah Smith', role: 'Project Manager', department: 'Management', project: 'Metro Extension', status: 'Active' },
  { id: '3', employee_id: 'EMP-003', name: 'Michael Brown', role: 'Safety Officer', department: 'HSE', project: 'Ocean Heights', status: 'On Leave' },
  { id: '4', employee_id: 'EMP-004', name: 'Emily Chen', role: 'Architect', department: 'Design', project: 'Skyline Tower', status: 'Active' },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(defaultMockEmployees);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("All Roles");
  
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', department: '', status: 'Active' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      if (data && data.length > 0) {
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openModal = (emp?: Employee) => {
    if (emp) {
      setEditingId(emp.id || null);
      setForm({
        name: emp.name,
        email: emp.email || '',
        phone: emp.phone || '',
        role: emp.role,
        department: emp.department || '',
        status: emp.status || 'Active'
      });
    } else {
      setEditingId(null);
      setForm({ name: '', email: '', phone: '', role: '', department: '', status: 'Active' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateEmployee(editingId, form);
      } else {
        await createEmployee(form);
      }
      setShowModal(false);
      await load();
    } catch (err) { alert('Failed to save employee'); }
    finally { setSaving(false); }
  };

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee_id && emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "All Roles" || emp.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Employees</h1>
          <p className={styles.subtitle}>Manage your workforce, roles, and assignments.</p>
        </div>
        <button onClick={() => openModal()} className={styles.newBtn}>+ Add Employee</button>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search employees..."
          style={{ padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '300px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          style={{ padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="All Roles" style={{ color: '#000' }}>All Roles</option>
          <option value="Site Engineer" style={{ color: '#000' }}>Site Engineer</option>
          <option value="Project Manager" style={{ color: '#000' }}>Project Manager</option>
          <option value="Safety Officer" style={{ color: '#000' }}>Safety Officer</option>
          <option value="Architect" style={{ color: '#000' }}>Architect</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading employees...</div> : (
          <table className={styles.table}>
            <thead>
              <tr><th>Employee ID</th><th>Name</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id}>
                  <td className={styles.subCell}>{emp.employee_id || emp.id?.slice(0,8)}</td>
                  <td className={styles.boldCell}>{emp.name}</td>
                  <td>{emp.role}</td>
                  <td>{emp.department || '—'}</td>
                  <td>
                    <span className={styles.categoryBadge} style={{ background: emp.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: emp.status === 'Active' ? '#10b981' : '#fff' }}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link href={`/employees/${emp.id}`} style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', background: 'rgba(99,102,241,0.1)', padding: '4px 8px', borderRadius: '4px' }}>View Profile</Link>
                      <button className={styles.actionSelect} onClick={() => openModal(emp)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className={styles.loading}>No employees found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Edit Employee' : 'Add Employee'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Role *</label><input required value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} className={styles.fi} /></div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Department</label><input value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={styles.fi} /></div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className={styles.fi} /></div>
                {editingId && (
                  <div className={styles.fg}><label className={styles.fl}>Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={styles.fi}>
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Employee')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
