'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { Table } from '@/components/Table';
import { getLeaveRequests, updateLeaveStatus, LeaveRequest } from '@/lib/services/leaveService';
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

  const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
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
      render: (id: string, row: LeaveRequest) =>
        row.status === 'Pending' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
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
          </div>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>No actions</span>
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
        <Link href="/leave/apply" className={pageStyles.applyBtn}>
          + Apply Leave
        </Link>
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
