'use client';

import styles from '../../expenses/expenses.module.css';

export default function AttendanceCorrectionsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Attendance Corrections</h1>
          <p className={styles.subtitle}>Approve or reject missed punches and overtime claims.</p>
        </div>
      </header>
      <div className={styles.tableCard}>
        <div className={styles.loading}>Feature coming in Phase 5.</div>
      </div>
    </div>
  );
}
