'use client';

import styles from '../../expenses/expenses.module.css';

export default function ShiftSchedulesPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Shift Schedules</h1>
          <p className={styles.subtitle}>Calendar view of employee shift assignments.</p>
        </div>
      </header>
      <div className={styles.tableCard}>
        <div className={styles.loading}>Feature coming in Phase 5.</div>
      </div>
    </div>
  );
}
