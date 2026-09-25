'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import styles from './hierarchy.module.css';
import { 
  getDepartments, Department, createDepartment, deleteDepartment,
  getJobRoles, JobRole, createJobRole, deleteJobRole,
  getRolePermissions, RolePermission, updateRolePermission, createSystemRole
} from '@/lib/services/hierarchyService';
import { useRouter } from 'next/navigation';

export default function HierarchyPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'departments' | 'roles' | 'permissions'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newDeptName, setNewDeptName] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDept, setNewRoleDept] = useState('');
  const [newSystemRoleName, setNewSystemRoleName] = useState('');

  // Check super admin
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [d, r, p] = await Promise.all([
      getDepartments(),
      getJobRoles(),
      getRolePermissions()
    ]);
    setDepartments(d);
    setJobRoles(r);
    setPermissions(p);
    setLoading(false);
  }

  // --- Handlers ---
  async function handleCreateDepartment() {
    if (!newDeptName.trim()) return;
    await createDepartment({ name: newDeptName });
    setNewDeptName('');
    loadData();
  }

  async function handleDeleteDepartment(id: string) {
    if (confirm('Are you sure? This deletes associated roles.')) {
      await deleteDepartment(id);
      loadData();
    }
  }

  async function handleCreateJobRole() {
    if (!newRoleName.trim() || !newRoleDept) return;
    await createJobRole({ name: newRoleName, department_id: newRoleDept });
    setNewRoleName('');
    setNewRoleDept('');
    loadData();
  }

  async function handleDeleteJobRole(id: string) {
    if (confirm('Delete this role?')) {
      await deleteJobRole(id);
      loadData();
    }
  }

  async function handleTogglePermission(
    role: string, 
    menu: string, 
    field: 'can_read' | 'can_create' | 'can_edit' | 'can_delete' | 'can_approve',
    currentVal: boolean
  ) {
    const existing = permissions.find(p => p.role_name === role && p.menu_key === menu) || {
      role_name: role, menu_key: menu, can_read: false, can_create: false, can_edit: false, can_delete: false, can_approve: false
    };
    
    const newVal = !currentVal;
    
    // Optimistic UI update
    setPermissions(prev => {
      const exists = prev.find(p => p.role_name === role && p.menu_key === menu);
      if (exists) {
        return prev.map(p => (p.role_name === role && p.menu_key === menu) ? { ...p, [field]: newVal } : p);
      }
      return [...prev, { ...existing, [field]: newVal }];
    });
    
    await updateRolePermission(role, menu, { [field]: newVal });
  }

  async function handleCreateSystemRole() {
    if (!newSystemRoleName.trim()) return;
    const allModules = Array.from(new Set(permissions.map(p => p.menu_key)));
    if (allModules.length === 0) {
      allModules.push('Overview', 'Core HR', 'Operations', 'Resources', 'Finance', 'Settings');
    }
    await createSystemRole(newSystemRoleName.trim(), allModules);
    setNewSystemRoleName('');
    loadData();
  }

  if (loading) return <div style={{ padding: '24px', color: '#fff' }}>Loading hierarchy...</div>;

  // Compute unique system roles & modules for permissions matrix
  const systemRoles = Array.from(new Set(permissions.map(p => p.role_name)));
  const modules = Array.from(new Set(permissions.map(p => p.menu_key)));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Hierarchy Management</h1>
        <p className={styles.subtitle}>Super Admin controls for organizational structure and module access.</p>
      </header>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'departments' ? styles.active : ''}`} onClick={() => setActiveTab('departments')}>Departments</button>
        <button className={`${styles.tab} ${activeTab === 'roles' ? styles.active : ''}`} onClick={() => setActiveTab('roles')}>Job Roles</button>
        <button className={`${styles.tab} ${activeTab === 'permissions' ? styles.active : ''}`} onClick={() => setActiveTab('permissions')}>Module Access</button>
      </div>

      <div className={styles.panel}>
        {activeTab === 'departments' && (
          <div>
            <div className={styles.actionRow} style={{ justifyContent: 'flex-start', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="New Department Name" 
                value={newDeptName} 
                onChange={e => setNewDeptName(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button className={styles.primaryBtn} onClick={handleCreateDepartment}>+ Add</button>
            </div>
            <table className={styles.table}>
              <thead><tr><th>Department Name</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {departments.map(d => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.description || '-'}</td>
                    <td>
                      <button className={styles.deleteBtn} onClick={() => handleDeleteDepartment(d.id!)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && <tr><td colSpan={3}>No departments found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'roles' && (
          <div>
            <div className={styles.actionRow} style={{ justifyContent: 'flex-start', gap: '12px' }}>
              <select 
                value={newRoleDept} 
                onChange={e => setNewRoleDept(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input 
                type="text" 
                placeholder="Job Role Name" 
                value={newRoleName} 
                onChange={e => setNewRoleName(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button className={styles.primaryBtn} onClick={handleCreateJobRole}>+ Add</button>
            </div>
            <table className={styles.table}>
              <thead><tr><th>Job Role</th><th>Department</th><th>Actions</th></tr></thead>
              <tbody>
                {jobRoles.map(r => {
                  const dept = departments.find(d => d.id === r.department_id);
                  return (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{dept?.name || 'Unknown'}</td>
                      <td>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteJobRole(r.id!)}>Delete</button>
                      </td>
                    </tr>
                  )
                })}
                {jobRoles.length === 0 && <tr><td colSpan={3}>No roles found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div>
            <div className={styles.actionRow} style={{ justifyContent: 'flex-start', gap: '12px', marginBottom: '24px' }}>
              <input 
                type="text" 
                placeholder="New System Role (e.g. Project Manager)" 
                value={newSystemRoleName} 
                onChange={e => setNewSystemRoleName(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button className={styles.primaryBtn} onClick={handleCreateSystemRole}>+ Add System Role</button>
            </div>
            
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px', fontSize: '0.85rem' }}>
              Toggle granular module permissions for each System Role. (SUPER_ADMIN changes are restricted).
            </p>
            {systemRoles.map(role => (
              <div key={role} className={styles.permCard}>
                <div className={styles.permRoleTitle}>{role}</div>
                <div className={styles.permGrid}>
                  <div className={`${styles.permHeader} ${styles.permHeaderLeft}`}>Module</div>
                  <div className={styles.permHeader}>Read</div>
                  <div className={styles.permHeader}>Create</div>
                  <div className={styles.permHeader}>Edit</div>
                  <div className={styles.permHeader}>Delete</div>
                  <div className={styles.permHeader}>Approve</div>
                  
                  {modules.map(module => {
                    const p = permissions.find(x => x.role_name === role && x.menu_key === module) || {} as any;
                    const disabled = role === 'SUPER_ADMIN'; // Optional lock
                    return (
                      <div key={module} className={styles.permRow}>
                        <div className={styles.permCellLeft}>{module}</div>
                        {['can_read', 'can_create', 'can_edit', 'can_delete', 'can_approve'].map(field => (
                          <div key={field} className={styles.permCell}>
                            <input 
                              type="checkbox"
                              className={styles.permCheckbox}
                              checked={!!p[field]}
                              disabled={disabled}
                              onChange={() => handleTogglePermission(role, module, field as any, !!p[field])}
                              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
