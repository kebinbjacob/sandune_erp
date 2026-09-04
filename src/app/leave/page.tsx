'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { Table } from '@/components/Table';
import { getLeaveRequests, updateLeaveStatus, deleteLeaveRequest, LeaveRequest } from '@/lib/services/leaveService';
import { deductLeaveBalance } from '@/lib/services/leaveBalancesService';
import { exportToCSV } from '@/lib/utils/csvExport';
import styles from '../employees/page.module.css';
import pageStyles from './leave.module.css';

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const data = await getLeaveRequests();
      setRequests(data);
    } catch {
      setError('Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleExportCSV = () => {
    const headers = ['Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Applied At'];
    const rows = requests.map(r => {
      const s = new Date(r.start_date);
      const e = new Date(r.end_date);
      const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return [
        r.employees?.name || '',
        r.employees?.department || '',
        r.leave_type,
        r.start_date,
        r.end_date,
        diffDays,
        r.reason || '',
        r.status,
        r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : ''
      ];
    });
    exportToCSV(`Leave_Requests_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to withdraw/delete this leave request?')) return;
    try {
      await deleteLeaveRequest(id);
      await fetchRequests();
    } catch {
      alert('Failed to delete leave request.');
    }
  };

  const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      if (status === 'Approved') {
        const req = requests.find(r => r.id === id);
        if (req && req.employee_id && req.start_date && req.end_date) {
          const s = new Date(req.start_date);
          const e = new Date(req.end_date);
          const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const days = Math.max(1, diffDays);
          const year = s.getFullYear() || new Date().getFullYear();
          await deductLeaveBalance(req.employee_id, req.leave_type, days, year);
        }
      }
      await updateLeaveStatus(id, status);
      await fetchRequests();
    } catch {
      alert('Failed to update leave status.');
    }
  };


  const getDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const days = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${days} day${days > 1 ? 's' : ''} (${fmt(start)} – ${fmt(end)})`;
  };

  const columns = [
    {
      header: 'Employee',
      accessor: 'employees',
      render: (_: unknown, row: LeaveRequest) => (
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{row.employees?.name || '—'}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{row.employees?.department || ''}</div>
        </div>
      ),
    },
    { header: 'Leave Type', accessor: 'leave_type' },
    {
      header: 'Duration',
      accessor: 'start_date',
      render: (_: unknown, row: LeaveRequest) => getDuration(row.start_date, row.end_date),
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (v: string) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{v || '—'}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value: string) => (
        <span className={`${styles.statusBadge} ${
          value === 'Approved' ? styles.statusActive :
          value === 'Rejected' ? styles.statusInactive :
          styles.statusLeave
        }`}>
          {value}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id: string, row: LeaveRequest) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {row.status === 'Pending' && (
            <>
              <button
                onClick={() => handleStatusUpdate(id, 'Approved')}
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s' }}
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleStatusUpdate(id, 'Rejected')}
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s' }}
              >
                ✕ Reject
              </button>
            </>
          )}
          <button
            onClick={() => handleDelete(id)}
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s' }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const pending = requests.filter(r => r.status === 'Pending').length;
  const approved = requests.filter(r => r.status === 'Approved').length;
  const rejected = requests.filter(r => r.status === 'Rejected').length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Leave Management</h1>
          <p className={styles.subtitle}>Review and manage employee leave requests.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleExportCSV}
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            📥 Export CSV
          </button>
          <Link href="/leave/apply" className={pageStyles.applyBtn}>
            + Apply Leave
          </Link>
        </div>
      </header>

      {/* Summary cards */}
      <div className={pageStyles.summaryGrid}>
        <div className={pageStyles.summaryCard}>
          <span className={pageStyles.summaryLabel}>Total Requests</span>
          <span className={pageStyles.summaryValue}>{requests.length}</span>
        </div>
        <div className={`${pageStyles.summaryCard} ${pageStyles.pendingCard}`}>
          <span className={pageStyles.summaryLabel}>⏳ Pending</span>
          <span className={pageStyles.summaryValue}>{pending}</span>
        </div>
        <div className={`${pageStyles.summaryCard} ${pageStyles.approvedCard}`}>
          <span className={pageStyles.summaryLabel}>✅ Approved</span>
          <span className={pageStyles.summaryValue}>{approved}</span>
        </div>
        <div className={`${pageStyles.summaryCard} ${pageStyles.rejectedCard}`}>
          <span className={pageStyles.summaryLabel}>❌ Rejected</span>
          <span className={pageStyles.summaryValue}>{rejected}</span>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className={pageStyles.loadingState}>Loading leave requests...</div>
        ) : error ? (
          <div className={pageStyles.errorState}>{error}</div>
        ) : requests.length === 0 ? (
          <div className={pageStyles.emptyState}>
            <p>No leave requests found.</p>
            <Link href="/leave/apply" className={pageStyles.applyBtn}>Apply for the first leave →</Link>
          </div>
        ) : (
          <Table columns={columns} data={requests} />
        )}
      </Card>
    </div>
  );
}
