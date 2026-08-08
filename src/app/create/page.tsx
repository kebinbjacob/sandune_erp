"use client";

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card } from "@/components/Card";
import { createEmployee } from "@/lib/services/employeeService";
import styles from "../employees/page.module.css";
import React, { Suspense, useState } from 'react';

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
    role: 'Site Engineer',
    department: 'Engineering',
    project: 'Skyline Tower',
    email: '',
    phone: '',
    status: 'Active',
    employee_id: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (isEmployeeForm) {
      try {
        const empId = formData.employee_id.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`;
        await createEmployee({
          employee_id: empId,
          name: formData.name,
          role: formData.role,
          department: formData.department,
          project: formData.project,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
        });
        router.push('/employees');
      } catch (err: any) {
        console.error('Error creating employee:', err);
        setErrorMsg(err.message || 'Failed to create employee record');
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
                  <input
                    type="text"
                    name="role"
                    required
                    className={styles.searchInput}
                    placeholder="Enter role (e.g. Site Engineer)"
                    value={formData.role}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Department</label>
                  <input
                    type="text"
                    name="department"
                    className={styles.searchInput}
                    placeholder="Enter department"
                    value={formData.department}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Project</label>
                  <input
                    type="text"
                    name="project"
                    className={styles.searchInput}
                    placeholder="Enter project name"
                    value={formData.project}
                    onChange={handleChange}
                  />
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
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
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
                  <input type="text" required className={styles.searchInput} placeholder={`Enter ${type.toLowerCase()} name`} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Category / Type</label>
                  <select className={styles.selectInput}>
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Urgent</option>
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
            <button type="submit" className={styles.primaryButton} disabled={loading}>
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
    <Suspense fallback={<div>Loading form...</div>}>
      <CreateForm />
    </Suspense>
  );
}
