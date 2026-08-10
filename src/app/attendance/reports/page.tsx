'use client';

import styles from '../../expenses/expenses.module.css';

export default function AttendanceReportsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Attendance Reports</h1>
          <p className={styles.subtitle}>Generate and export monthly attendance summaries.</p>
        </div>
      </header>
      <div className={styles.tableCard}>
        <div className={styles.loading}>Feature coming in Phase 5.</div>
      </div>
    </div>
  );
}
