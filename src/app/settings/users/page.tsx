'use client';

import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, updateUserStatus, AppUser, USER_ROLES } from '@/lib/services/userService';
import { getEmployees, createEmployee, Employee } from '@/lib/services/employeeService';
import { useAuth } from '@/lib/context/AuthContext';
import styles from '../../expenses/expenses.module.css';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<AppUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isNewEmployee, setIsNewEmployee] = useState(false);
  const [form, setForm] = useState({ 
    employee_id: '', 
    email: '', 
    role: 'Viewer', 
    custom_role: '', 
    status: 'Active', 
    department: '', 
    password: '',
    new_emp_name: '',
    new_emp_job_title: '',
    new_emp_phone: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const [u, e] = await Promise.all([getUsers(), getEmployees()]);
      setUsers(u);
      setEmployees(e);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openModal = (user?: AppUser) => {
    if (user) {
      setEditingId(user.id || null);
      
      const isCustomRole = !USER_ROLES.includes(user.role);
      
      setForm({
        employee_id: user.employee_id,
        email: user.email,
        role: isCustomRole ? 'Other' : user.role,
        custom_role: isCustomRole ? user.role : '',
        status: user.status,
        department: user.department || user.employees?.department || '',
        password: user.password || '',
        new_emp_name: '',
        new_emp_job_title: '',
        new_emp_phone: ''
      });
      setIsNewEmployee(false);
    } else {
      setEditingId(null);
      setForm({ 
        employee_id: '', 
        email: '', 
        role: 'Viewer', 
        custom_role: '', 
        status: 'Active', 
        department: '', 
        password: '',
        new_emp_name: '',
        new_emp_job_title: '',
        new_emp_phone: ''
      });
      setIsNewEmployee(false);
    }
    setShowModal(true);
  };

  const handleEmployeeChange = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setForm(f => ({ ...f, employee_id: empId, email: emp?.email || f.email, department: emp?.department || f.department }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalRole = form.role === 'Other' ? form.custom_role : form.role;
      if (!finalRole) {
        alert("Please specify a role.");
        setSaving(false);
        return;
      }

      if (editingId) {
        // For editing, we just update the app_users record
        await updateUser(editingId, {
          email: form.email,
          role: finalRole,
          status: form.status,
          department: form.department,
          password: form.password
        });
      } else {
        // For creating, we use the transactional API route via createUser
        await createUser({
          email: form.email,
          password: form.password,
          role_name: finalRole,
          department: form.department,
          status: form.status,
          isNewEmployee,
          employee_id: isNewEmployee ? undefined : form.employee_id,
          name: form.new_emp_name,
          new_emp_job_title: form.new_emp_job_title,
          new_emp_phone: form.new_emp_phone,
          custom_role: form.custom_role
        });
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      alert(err?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateUserStatus(id, newStatus);
      await load();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await updateUser(id, { role: newRole });
      await load();
    } catch (err) {
      alert('Failed to update role.');
    }
  };

  const statusColors: Record<string, string> = { Active: '#10b981', Suspended: '#ef4444' };

  if (!['Admin', 'SUPER_ADMIN'].includes(currentUser?.role || '')) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className={styles.tableCard} style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You do not have the required permissions to view or manage user accounts. Only System Administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>Manage application access and assign system roles to employees.</p>
        </div>
        <button onClick={() => openModal()} className={styles.newBtn}>+ Add User</button>
      </header>

      <div className={styles.tableCard}>
        {loading ? <div className={styles.loading}>Loading users...</div> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email / Login</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className={styles.boldCell}>{u.employees?.name}</div>
                    <div className={styles.subCell}>{u.employees?.role} (Job Title)</div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select 
                      className={styles.actionSelect} 
                      value={USER_ROLES.includes(u.role) || u.role === 'Viewer' ? u.role : 'Other'} 
                      onChange={(ev) => handleRoleChange(u.id!, ev.target.value)}
                      style={{ padding: '4px 8px' }}
                    >
                      {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      <option value="Viewer">Viewer</option>
                      {!USER_ROLES.includes(u.role) && u.role !== 'Viewer' && (
                        <option value={u.role}>{u.role} (Custom)</option>
                      )}
                    </select>
                  </td>
                  <td className={styles.subCell}>{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select 
                        className={styles.actionSelect} 
                        value={u.status} 
                        onChange={(ev) => handleStatusChange(u.id!, ev.target.value)}
                        style={{ borderColor: statusColors[u.status], color: statusColors[u.status], padding: '4px 8px' }}
                      >
                        <option>Active</option>
                        <option>Suspended</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <button className={styles.actionSelect} onClick={() => openModal(u)} style={{ padding: '5px 12px' }}>Edit Access</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className={styles.loading}>No users found. Add one to get started.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Edit User Access' : 'Add New User'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                {!editingId && (
                  <div className={styles.fg} style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="newEmpCheck" 
                      checked={isNewEmployee} 
                      onChange={e => setIsNewEmployee(e.target.checked)} 
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="newEmpCheck" style={{ cursor: 'pointer', color: 'white', fontWeight: 500 }}>
                      Create as a brand new employee
                    </label>
                  </div>
                )}

                {!isNewEmployee ? (
                  <div className={styles.fg} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.fl}>Linked Employee *</label>
                    <select required value={form.employee_id} onChange={e => handleEmployeeChange(e.target.value)} className={styles.fi} disabled={!!editingId}>
                      <option value="">Select Employee...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employee_id || e.id?.split('-')[0]})</option>)}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className={styles.fg} style={{ gridColumn: '1 / -1' }}>
                      <label className={styles.fl}>Full Name *</label>
                      <input required type="text" value={form.new_emp_name} onChange={e => setForm(f => ({...f, new_emp_name: e.target.value}))} className={styles.fi} placeholder="John Doe" />
                    </div>
                    <div className={styles.fg}>
                      <label className={styles.fl}>Job Title *</label>
                      <input required type="text" value={form.new_emp_job_title} onChange={e => setForm(f => ({...f, new_emp_job_title: e.target.value}))} className={styles.fi} placeholder="e.g. Sales Manager" />
                    </div>
                    <div className={styles.fg}>
                      <label className={styles.fl}>Phone Number</label>
                      <input type="text" value={form.new_emp_phone} onChange={e => setForm(f => ({...f, new_emp_phone: e.target.value}))} className={styles.fi} placeholder="+1 555-1234" />
                    </div>
                  </>
                )}
                
                <div className={styles.fg} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.fl}>Login Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={styles.fi} placeholder="user@company.com" disabled={!!editingId} />
                </div>

                <div className={styles.fg} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.fl}>Password {(!editingId) && '*'}</label>
                  <input type="password" required={!editingId} value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className={styles.fi} placeholder={editingId ? "Leave blank to keep unchanged" : "Set initial password"} />
                </div>
                
                <div className={styles.fg}>
                  <label className={styles.fl}>System Role *</label>
                  <select required value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} className={styles.fi}>
                    <option value="">Select Role...</option>
                    {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    <option value="Viewer">Viewer</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                </div>

                <div className={styles.fg}>
                  <label className={styles.fl}>Department</label>
                  <input type="text" value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} className={styles.fi} placeholder="e.g. Engineering" />
                </div>

                {form.role === 'Other' && (
                  <div className={styles.fg}>
                    <label className={styles.fl}>Custom Role Name *</label>
                    <input required value={form.custom_role} onChange={e => setForm(f => ({...f, custom_role: e.target.value}))} className={styles.fi} placeholder="e.g. Regional Director" />
                  </div>
                )}
                
                {editingId && (
                  <div className={styles.fg}>
                    <label className={styles.fl}>Access Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={styles.fi}>
                      <option>Active</option>
                      <option>Suspended</option>
                    </select>
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} className={styles.submitBtn}>{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Grant Access')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
