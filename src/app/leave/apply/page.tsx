'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createLeaveRequest, getEmployees } from '@/lib/services/leaveService';
import { getLeaveBalances } from '@/lib/services/leaveBalancesService';
import styles from './apply-leave.module.css';

const LEAVE_TYPES = [
  'Annual Leave',
  'Sick Leave',
  'Casual Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Emergency Leave',
  'Unpaid Leave',
];

export default function ApplyLeavePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<{ id: string; name: string; role: string; department: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [balanceWarning, setBalanceWarning] = useState<string | null>(null);

  const [form, setForm] = useState({
    employee_id: '',
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    getEmployees().then(setEmployees).catch(console.error);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const checkBalance = async () => {
      if (!form.employee_id || !form.leave_type || !form.start_date || !form.end_date) {
        if (isMounted) setBalanceWarning(null);
        return;
      }
      const s = new Date(form.start_date);
      const e = new Date(form.end_date);
      const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff <= 0 || isNaN(diff)) {
        if (isMounted) setBalanceWarning(null);
        return;
      }

      const year = s.getFullYear() || new Date().getFullYear();
      try {
        const balances = await getLeaveBalances(year);
        const empBal = balances.find(b => b.employee_id === form.employee_id);
        if (!empBal) {
          if (isMounted) setBalanceWarning(null);
          return;
        }

        const normType = form.leave_type.toLowerCase();
        let total = 0;
        let used = 0;
        if (normType.includes('annual')) {
          total = empBal.annual_total || 0;
          used = empBal.annual_used || 0;
        } else if (normType.includes('sick')) {
          total = empBal.sick_total || 0;
          used = empBal.sick_used || 0;
        } else if (normType.includes('casual')) {
          total = empBal.casual_total || 0;
          used = empBal.casual_used || 0;
        } else {
          if (isMounted) setBalanceWarning(null);
          return;
        }

        const remaining = total - used;
        if (remaining < diff) {
          if (isMounted) {
            setBalanceWarning(`Warning: Requested ${diff} days exceeds available ${form.leave_type} balance (${remaining} days remaining: ${total} total, ${used} used). You may still submit for manager review.`);
          }
        } else {
          if (isMounted) setBalanceWarning(null);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setBalanceWarning(null);
      }
    };

    checkBalance();
    return () => { isMounted = false; };
  }, [form.employee_id, form.leave_type, form.start_date, form.end_date]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getDuration = () => {
    if (!form.start_date || !form.end_date) return null;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.employee_id || !form.leave_type || !form.start_date || !form.end_date) {
      setError('Please fill in all required fields.');
      return;
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError('End date cannot be before start date.');
      return;
    }

    setLoading(true);
    try {
      await createLeaveRequest({ ...form, status: 'Pending' });
      setSuccess(true);
      setTimeout(() => router.push('/leave'), 1500);
    } catch {
      setError('Failed to submit leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const duration = getDuration();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Apply for Leave</h1>
          <p className={styles.subtitle}>Submit a leave request on behalf of an employee</p>
        </div>
        <button className={styles.backBtn} onClick={() => router.push('/leave')}>
          ← Back to Leave Management
        </button>
      </header>

      <div className={styles.formCard}>
        {success ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>✅</div>
            <h2>Leave Request Submitted!</h2>
            <p>Redirecting to Leave Management...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Employee <span className={styles.required}>*</span></label>
                <select name="employee_id" value={form.employee_id} onChange={handleChange} className={styles.select} required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Leave Type <span className={styles.required}>*</span></label>
                <select name="leave_type" value={form.leave_type} onChange={handleChange} className={styles.select} required>
                  <option value="">Select Leave Type</option>
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Start Date <span className={styles.required}>*</span></label>
                <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className={styles.input} required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>End Date <span className={styles.required}>*</span></label>
                <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className={styles.input} required />
              </div>
            </div>

            {duration && (
              <div className={styles.durationBadge}>
                📅 Duration: <strong>{duration} day{duration > 1 ? 's' : ''}</strong>
              </div>
            )}

            {balanceWarning && (
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span>
                <span>{balanceWarning}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Reason / Notes</label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                className={styles.textarea}
                rows={4}
                placeholder="Provide details about the leave request..."
              />
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={() => router.push('/leave')} className={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Submitting...' : '✔ Submit Leave Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

