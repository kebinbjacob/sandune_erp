"use client";

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card } from "@/components/Card";
import { createEmployee } from "@/lib/services/employeeService";
import { getDepartments, getJobRoles, Department, JobRole } from "@/lib/services/hierarchyService";
import { getProjects, Project } from "@/lib/services/projectService";
import styles from "../employees/page.module.css";
import React, { Suspense, useState, useEffect } from 'react';

function CreateForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const type = searchParams.get('type') || 'Record';

  const isEmployeeForm =
    type === 'Add Employee' ||
    type === 'Employee' ||
    type.toLowerCase().includes('employee') ||
    pathname?.includes('/employees/new');

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: '',
    project: '',
    email: '',
    phone: '',
    status: 'Active',
    employee_id: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic dropdowns state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (isEmployeeForm) {
      console.log("Fetching DB options for Employee form...");
      Promise.all([
        getDepartments().catch(e => { console.error(e); return []; }),
        getJobRoles().catch(e => { console.error(e); return []; }),
        getProjects().catch(e => { console.error(e); return []; })
      ]).then(([depts, roles, projs]) => {
        setDepartments(depts || []);
        setJobRoles(roles || []);
        setProjects(projs || []);
      }).catch(err => console.error("Error loading hierarchy/projects:", err));
    }
  }, [isEmployeeForm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'department') {
      setFormData((prev) => ({ ...prev, department: value, role: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (isEmployeeForm) {
      try {
        const empId = formData.employee_id.trim() || undefined;
        await createEmployee({
          employee_id: empId,
          name: formData.name,
          role: formData.role,
          department: formData.department || undefined,
          project: formData.project || undefined,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          status: formData.status,
        });
        router.push('/employees');
      } catch (err: unknown) {
        const supaErr = err as { message?: string; details?: string; hint?: string; code?: string };
        const msg = supaErr?.message || supaErr?.details || supaErr?.hint || JSON.stringify(err);
        console.error('Error creating employee:', supaErr);
        if (supaErr?.code === '23505') {
          setErrorMsg('A record with this Employee ID or Email already exists. Please use a unique value.');
        } else {
          setErrorMsg(msg || 'Failed to create employee. Please check all fields and try again.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      alert(`Successfully created new ${type}!`);
      router.back();
    }
  };

  const pageTitle = isEmployeeForm ? 'Add Employee' : `Create New ${type}`;
  const cardTitle = isEmployeeForm ? 'Employee Details' : `${type} Information`;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>{pageTitle}</h1>
          <p className={styles.subtitle}>
            {isEmployeeForm
              ? 'Fill in the details below to add a new employee to the organization.'
              : `Fill in the details below to add a new ${type.toLowerCase()} to the system.`}
          </p>
        </div>
      </header>

      <Card title={cardTitle}>
        {errorMsg && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              marginBottom: '16px',
              fontSize: '0.9rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
          {isEmployeeForm ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className={styles.searchInput}
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Role *</label>
                  <select
                    name="role"
                    required
                    className={styles.selectInput}
                    value={formData.role}
                    onChange={handleChange}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="" style={{ color: '#000' }}>Select Role</option>
                    {jobRoles
                      .filter(r => !formData.department || departments.find(d => d.id === r.department_id)?.name === formData.department)
                      .map(r => <option key={r.id} value={r.name} style={{ color: '#000' }}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Department</label>
                  <select
                    name="department"
                    className={styles.selectInput}
                    value={formData.department}
                    onChange={handleChange}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="" style={{ color: '#000' }}>Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.name} style={{ color: '#000' }}>{d.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Project</label>
                  <select
                    name="project"
                    className={styles.selectInput}
                    value={formData.project}
                    onChange={handleChange}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="" style={{ color: '#000' }}>Select Project (Optional)</option>
                    {projects.map(p => <option key={p.id} value={p.name} style={{ color: '#000' }}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
                  <input
                    type="email"
                    name="email"
                    className={styles.searchInput}
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className={styles.searchInput}
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select
                    name="status"
                    className={styles.selectInput}
                    value={formData.status}
                    onChange={handleChange}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="Active" style={{ color: '#000' }}>Active</option>
                    <option value="On Leave" style={{ color: '#000' }}>On Leave</option>
                    <option value="Inactive" style={{ color: '#000' }}>Inactive</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Employee ID (Optional)</label>
                  <input
                    type="text"
                    name="employee_id"
                    className={styles.searchInput}
                    placeholder="e.g. EMP-005"
                    value={formData.employee_id}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Name / Title</label>
                  <input type="text" required className={styles.searchInput} placeholder={"Enter ${type.toLowerCase()} name"} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Category / Type</label>
                  <select className={styles.selectInput} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option style={{ color: '#000' }}>Standard</option>
                    <option style={{ color: '#000' }}>Premium</option>
                    <option style={{ color: '#000' }}>Urgent</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Notes / Description</label>
                <textarea className={styles.searchInput} rows={4} style={{ resize: 'vertical' }}></textarea>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={loading} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Saving...' : isEmployeeForm ? 'Save Employee' : `Save ${type}`}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: '20px' }}>Loading form...</div>}>
      <CreateForm />
    </Suspense>
  );
}
