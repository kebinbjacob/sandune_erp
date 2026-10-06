"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getEmployees, Employee, createEmployee, updateEmployee, deleteEmployee } from '@/lib/services/employeeService';
import { getDepartments, Department, getJobRoles, JobRole } from '@/lib/services/hierarchyService';
import { useAuth } from '@/lib/context/AuthContext';
import styles from '../expenses/expenses.module.css';

const defaultMockEmployees: Employee[] = [
  { id: '123e4567-e89b-12d3-a456-426614174000', employee_id: 'EMP-001', name: 'John Doe', email: 'john.doe@sandune.com', phone: '+1-555-0101', role: 'Site Engineer', department: 'Engineering', project: 'Skyline Tower', status: 'Active', salary: 85000 },
  { id: '123e4567-e89b-12d3-a456-426614174001', employee_id: 'EMP-002', name: 'Sarah Smith', email: 'sarah.smith@sandune.com', phone: '+1-555-0102', role: 'Project Manager', department: 'Management', project: 'Ocean View Residences', status: 'Active', salary: 95000 },
  { id: '123e4567-e89b-12d3-a456-426614174002', employee_id: 'EMP-003', name: 'Mike Johnson', email: 'mike.johnson@sandune.com', phone: '+1-555-0103', role: 'Safety Officer', department: 'Safety', project: 'Skyline Tower', status: 'On Leave', salary: 75000 },
  { id: '123e4567-e89b-12d3-a456-426614174003', employee_id: 'EMP-004', name: 'Emily Chen', email: 'emily.chen@sandune.com', phone: '+1-555-0104', role: 'Architect', department: 'Design', project: 'Metro Station', status: 'Active', salary: 90000 },
];

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>(defaultMockEmployees);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>("All Roles");
  
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', department: '', status: 'Active', employee_id: '' });

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [empData, deptData, roleData] = await Promise.all([
        getEmployees().catch(e => { console.error('getEmployees load error:', e); return []; }),
        getDepartments().catch(e => { console.error('getDepartments load error:', e); return []; }),
        getJobRoles().catch(e => { console.error('getJobRoles load error:', e); return []; })
      ]);
      if (empData && empData.length > 0) {
        setEmployees(empData);
      } else if (employees.length === 0) {
        setEmployees(defaultMockEmployees);
      }
      setDepartments(deptData || []);
      setJobRoles(roleData || []);
    } catch(e: any) { 
      console.error('Fatal load error:', e);
      if (employees.length === 0) {
        setEmployees(defaultMockEmployees);
      }
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openModal = (emp?: Employee) => {
    if (emp) {
      setEditingId(emp.id || emp.employee_id || null);
      setForm({
        name: emp.name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        role: emp.role || '',
        department: emp.department || '',
        status: emp.status || 'Active',
        employee_id: emp.employee_id || ''
      });
    } else {
      setEditingId(null);
      setForm({ name: '', email: '', phone: '', role: '', department: '', status: 'Active', employee_id: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, employee_id: form.employee_id.trim() || undefined };
      if (editingId) {
        await updateEmployee(editingId, payload);
      } else {
        await createEmployee(payload);
      }
      setShowModal(false);
      await load();
    } catch (err) { alert('Failed to save employee'); }
    finally { setSaving(false); }
  };

  const filtered = (employees || []).filter((emp) => {
    if (!emp) return false;
    const name = (emp.name || '').toLowerCase();
    const empCode = (emp.employee_id || (emp.id !== undefined && emp.id !== null ? String(emp.id) : '')).toLowerCase();
    const role = (emp.role || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const search = (searchTerm || '').trim().toLowerCase();

    const matchesSearch =
      !search ||
      name.includes(search) ||
      empCode.includes(search) ||
      role.includes(search) ||
      dept.includes(search);
    const matchesRole = selectedRole === "All Roles" || (emp.role || '').trim().toLowerCase() === selectedRole.trim().toLowerCase();
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
          {jobRoles.map(r => <option key={r.id} value={r.name} style={{ color: '#000' }}>{r.name}</option>)}
        </select>
      </div>

      <div className={styles.tableCard}>
        {loadError && (
          <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px', fontWeight: 500 }}>
            <p><strong>Error Loading Data:</strong></p>
            <p>{loadError}</p>
          </div>
        )}
        {loading ? <div className={styles.loading}>Loading employees...</div> : (
          <table className={styles.table}>
            <thead>
              <tr><th>Employee ID</th><th>Name</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => {
                if (!emp) return null;
                return (
                  <tr key={emp.id || emp.employee_id || idx}>
                    <td className={styles.subCell}>{emp.employee_id || (emp.id ? String(emp.id).slice(0, 8) : '—')}</td>
                  <td className={styles.boldCell}>{emp.name || 'Unnamed Employee'}</td>
                  <td>{emp.role || '—'}</td>
                  <td>{emp.department || '—'}</td>
                  <td>
                    <span className={styles.categoryBadge} style={{ background: emp.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: emp.status === 'Active' ? '#10b981' : '#fff' }}>
                      {emp.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link href={`/employees/${emp.id || emp.employee_id || ''}`} style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', background: 'rgba(99,102,241,0.1)', padding: '4px 8px', borderRadius: '4px' }}>View Profile</Link>
                      <button className={styles.actionSelect} onClick={() => openModal(emp)}>Edit</button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
                <div className={styles.fg}><label className={styles.fl}>Employee Code</label><input placeholder="Auto-generated if blank" value={form.employee_id} onChange={e => setForm(f => ({...f, employee_id: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={styles.fi} /></div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}>
                  <label className={styles.fl}>Department</label>
                  <select value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value, role: ''}))} className={styles.fi}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Role *</label>
                  <select required value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} className={styles.fi}>
                    <option value="">Select Role</option>
                    {(jobRoles || [])
                      .filter(r => !form.department || (departments || []).find(d => d.id === r.department_id)?.name === form.department)
                      .map(r => <option key={r.id || r.name} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fg}><label className={styles.fl}>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={styles.fi} /></div>
                <div className={styles.fg}><label className={styles.fl}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className={styles.fi} /></div>
              </div>
              {editingId && (
                <div className={styles.formGrid}>
                  <div className={styles.fg}><label className={styles.fl}>Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={styles.fi}>
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>
              )}
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
