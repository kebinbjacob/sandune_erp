'use client';

import styles from '../../expenses/expenses.module.css';

export default function TimesheetsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Timesheets</h1>
          <p className={styles.subtitle}>Review weekly logged hours and overtime.</p>
        </div>
      </header>
      <div className={styles.tableCard}>
        <div className={styles.loading}>Feature coming in Phase 5 (Advanced Payroll integration).</div>
      </div>
    </div>
  );
}