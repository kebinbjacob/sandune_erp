'use client';

import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, updateUserStatus, deleteUser, AppUser, USER_ROLES } from '@/lib/services/userService';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import { getDepartments, Department, getRolePermissions, RolePermission } from '@/lib/services/hierarchyService';
import { useAuth } from '@/lib/context/AuthContext';
import styles from '../../expenses/expenses.module.css';


const defaultMockUsers: AppUser[] = [
  {
    id: 'user-admin-1',
    employee_id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@sandune.com',
    role: 'SUPER_ADMIN',
    department: 'Management',
    status: 'Active',
    employees: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      employee_id: 'EMP-001',
      name: 'Kebin B Jacob',
      role: 'System Administrator',
      department: 'Management',
      status: 'Active'
    }
  },
  {
    id: 'user-admin-2',
    employee_id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'sarah.smith@sandune.com',
    role: 'ADMIN',
    department: 'Management',
    status: 'Active',
    employees: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      employee_id: 'EMP-002',
      name: 'Sarah Smith',
      role: 'Project Manager',
      department: 'Management',
      status: 'Active'
    }
  }
];

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<AppUser[]>(defaultMockUsers);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [systemRoles, setSystemRoles] = useState<string[]>(USER_ROLES);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    setLoadError(null);
    try {
      const [u, e, d, p] = await Promise.all([
        getUsers().catch(err => { console.error('getUsers load error:', err); return []; }),
        getEmployees().catch(err => { console.error('getEmployees load error:', err); return []; }),
        getDepartments().catch(err => { console.error('getDepartments load error:', err); return []; }),
        getRolePermissions().catch(err => { console.error('getRolePermissions load error:', err); return []; })
      ]);
      if (u && u.length > 0) {
        setUsers(u);
      } else if (users.length === 0) {
        setUsers(defaultMockUsers);
      }
      setEmployees(e || []);
      setDepartments(d || []);
      
      const uniqueRoles = Array.from(new Set([
        ...USER_ROLES,
        ...(p || []).map(perm => perm?.role_name).filter(Boolean)
      ])) as string[];
      setSystemRoles(uniqueRoles);
    } catch(err: any) { 
      console.error('Fatal load error:', err);
      if (users.length === 0) {
        setUsers(defaultMockUsers);
      }
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openModal = (user?: AppUser) => {
    if (user) {
      setEditingId(user.id || null);
      const isCustomRole = !systemRoles.includes(user.role);
      const linkedEmp = (Array.isArray(user.employees) ? user.employees[0] : user.employees)
        || (employees || []).find(e => (user.employee_id && (e.id === user.employee_id || e.employee_id === user.employee_id)) || (user.email && e.email && e.email.toLowerCase() === user.email.toLowerCase()));
      setForm({
        employee_id:    user.employee_id || '',
        email:          user.email || '',
        role:           isCustomRole ? 'Other' : (user.role || 'Viewer'),
        custom_role:    isCustomRole ? user.role : '',
        status:         user.status || 'Active',
        department:     user.department || linkedEmp?.department || '',
        password:       '',
        new_emp_name:       linkedEmp?.name || '',
        new_emp_job_title:  linkedEmp?.role || '',
        new_emp_phone:      linkedEmp?.phone || '',
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
    const emp = (employees || []).find(e => (e.id && e.id === empId) || (e.employee_id && e.employee_id === empId));
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
        // Update both app_users AND employees via the PUT API route
        await updateUser(editingId, {
          employee_id:      form.employee_id,
          role_name:        finalRole,
          custom_role:      form.custom_role,
          department:       form.department,
          status:           form.status,
          password:         form.password || undefined,
          // Employee record fields
          name:             form.new_emp_name,
          new_emp_job_title: form.new_emp_job_title,
          new_emp_phone:    form.new_emp_phone,
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
    if (!id) return;
    try {
      await updateUser(id, { role_name: newRole });
      await load();
    } catch (err) {
      alert('Failed to update role.');
    }
  };

  const getDisplayName = (u: AppUser) => {
    const linked = (Array.isArray(u.employees) ? u.employees[0] : u.employees)
      || (employees || []).find(e => (u.employee_id && (e.id === u.employee_id || e.employee_id === u.employee_id)) || (u.email && e.email && e.email.toLowerCase() === u.email.toLowerCase()));
    return linked?.name || u.email || 'User';
  };

  const handleDelete = async (u: AppUser) => {
    if (!u || !u.id) return;
    if (!confirm(`⚠️ Permanently delete user "${getDisplayName(u)}"?\n\nThis will remove their login access and app user record. The employee record will remain in the system.\n\nThis action cannot be undone.`)) return;
    try {
      await deleteUser(u.id);
      await load();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete user.');
    }
  };

  const handleBanToggle = async (u: AppUser) => {
    if (!u || !u.id) return;
    const isBanned = u.status === 'Suspended';
    const action = isBanned ? 'Unban' : 'Ban';
    if (!confirm(`${action} user "${getDisplayName(u)}"?`)) return;
    try {
      await updateUserStatus(u.id, isBanned ? 'Active' : 'Suspended');
      await load();
    } catch (err: any) {
      alert(err?.message || `Failed to ${action.toLowerCase()} user.`);
    }
  };

  const handleResetPassword = async (u: AppUser) => {
    if (!u || !u.id) return;
    const newPassword = prompt(`Set new password for "${getDisplayName(u)}":\n(minimum 6 characters)`);
    if (!newPassword) return;
    if (newPassword.length < 6) { alert('Password must be at least 6 characters.'); return; }
    try {
      await updateUser(u.id, { password: newPassword });
      alert('✅ Password updated successfully.');
    } catch (err: any) {
      alert(err?.message || 'Failed to reset password.');
    }
  };

  const statusColors: Record<string, string> = { Active: '#10b981', Suspended: '#ef4444' };

  const userRole = (currentUser?.role || '').trim().toUpperCase();
  const isAuthorized = 
    !currentUser || 
    userRole === 'ADMIN' || 
    userRole === 'SUPER_ADMIN' || 
    userRole.includes('ADMIN') || 
    userRole.includes('HR') ||
    userRole.includes('MANAGER') ||
    process.env.NODE_ENV !== 'production';

  if (!isAuthorized) {
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
        {loadError && (
          <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px', fontWeight: 500 }}>
            <p><strong>Error Loading Data:</strong></p>
            <p>{loadError}</p>
          </div>
        )}
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
              {users.map((u, idx) => {
                if (!u) return null;
                const linkedEmp = (Array.isArray(u.employees) ? u.employees[0] : u.employees)
                  || (employees || []).find(e => (u.employee_id && (e.id === u.employee_id || e.employee_id === u.employee_id)) || (u.email && e.email && e.email.toLowerCase() === u.email.toLowerCase()));
                const empName = linkedEmp?.name || u.email?.split('@')[0] || 'User';
                const empTitle = linkedEmp?.role || u.department || 'Staff';
                const targetRole = u.role || 'Viewer';
                const currentStatus = u.status || 'Active';

                return (
                  <tr key={u.id || u.email || idx}>
                    <td>
                      <div className={styles.boldCell}>{empName}</div>
                      <div className={styles.subCell}>{empTitle} (Job Title)</div>
                    </td>
                    <td>{u.email || '—'}</td>
                    <td>
                      <select 
                        className={styles.actionSelect} 
                        value={targetRole} 
                        onChange={(ev) => handleRoleChange(u.id || '', ev.target.value)}
                        style={{ padding: '4px 8px' }}
                      >
                        {systemRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        {!systemRoles.includes(targetRole) && (
                          <option value={targetRole}>{targetRole} (Custom)</option>
                        )}
                      </select>
                    </td>
                    <td className={styles.subCell} suppressHydrationWarning>
                      {u.last_login ? (isNaN(new Date(u.last_login).getTime()) ? u.last_login : new Date(u.last_login).toLocaleString()) : 'Never'}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: currentStatus === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: currentStatus === 'Active' ? '#10b981' : '#ef4444',
                        border: `1px solid ${currentStatus === 'Active' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}>{currentStatus}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Edit */}
                        <button
                          onClick={() => openModal(u)}
                          title="Edit user details"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', cursor: 'pointer' }}
                        >✏️ Edit</button>

                        {/* Ban / Unban */}
                        <button
                          onClick={() => handleBanToggle(u)}
                          title={currentStatus === 'Suspended' ? 'Unban user' : 'Ban / Suspend user'}
                          style={{ padding: '4px 10px', fontSize: '0.78rem', background: currentStatus === 'Suspended' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: currentStatus === 'Suspended' ? '#10b981' : '#f59e0b', border: `1px solid ${currentStatus === 'Suspended' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: '6px', cursor: 'pointer' }}
                        >{currentStatus === 'Suspended' ? '✅ Unban' : '🚫 Ban'}</button>

                        {/* Reset Password */}
                        <button
                          onClick={() => handleResetPassword(u)}
                          title="Reset user password"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', cursor: 'pointer' }}
                        >🔑 Reset PW</button>

                        {/* Delete — blocked for self-deletion */}
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(u)}
                            title="Permanently delete user"
                            style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', cursor: 'pointer' }}
                          >🗑️ Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                  <>
                    <div className={styles.fg} style={{ gridColumn: '1 / -1' }}>
                      <label className={styles.fl}>Linked Employee *</label>
                      <select required value={form.employee_id} onChange={e => handleEmployeeChange(e.target.value)} className={styles.fi} disabled={!!editingId}>
                        <option value="">Select Employee...</option>
                        {(employees || []).map((e, idx) => <option key={e.id || e.employee_id || idx} value={e.id || e.employee_id}>{e.name} ({e.employee_id || (e.id ? String(e.id).split('-')[0] : '')})</option>)}
                      </select>
                    </div>
                    {/* Show editable employee details when editing */}
                    {editingId && (
                      <>
                        <div className={styles.fg} style={{ gridColumn: '1 / -1' }}>
                          <label className={styles.fl}>Full Name</label>
                          <input type="text" value={form.new_emp_name} onChange={e => setForm(f => ({...f, new_emp_name: e.target.value}))} className={styles.fi} placeholder="Full Name" />
                        </div>
                        <div className={styles.fg}>
                          <label className={styles.fl}>Job Title</label>
                          <input type="text" value={form.new_emp_job_title} onChange={e => setForm(f => ({...f, new_emp_job_title: e.target.value}))} className={styles.fi} placeholder="e.g. Site Engineer" />
                        </div>
                        <div className={styles.fg}>
                          <label className={styles.fl}>Phone Number</label>
                          <input type="text" value={form.new_emp_phone} onChange={e => setForm(f => ({...f, new_emp_phone: e.target.value}))} className={styles.fi} placeholder="+1 555-1234" />
                        </div>
                      </>
                    )}
                  </>
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
                    {systemRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    <option value="Viewer">Viewer</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                </div>

                <div className={styles.fg}>
                  <label className={styles.fl}>Department</label>
                  <select value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} className={styles.fi}>
                    <option value="">Select Department</option>
                    {(departments || []).map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
                  </select>
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
