import Link from "next/link";
import { Card } from "@/components/Card";
import styles from "../../employees/page.module.css";

export default function SiteReportsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Site Daily Report</h1>
          <p className={styles.subtitle}>Submit daily progress, weather, and workforce logs.</p>
        </div>
        <button className={styles.primaryButton} type="submit">Submit Report</button>
      </header>
      <Card title="New Report Entry">
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Project</label>
              <select className={styles.selectInput}><option>Skyline Tower</option></select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Date</label>
              <input type="date" className={styles.searchInput} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Work Completed Today</label>
            <textarea className={styles.searchInput} rows={4} style={{ resize: 'vertical' }}></textarea>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Workforce Count</label>
              <input type="number" className={styles.searchInput} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Weather</label>
              <input type="text" className={styles.searchInput} placeholder="e.g. Sunny, 85F" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Safety Incidents</label>
              <input type="text" className={styles.searchInput} placeholder="None" />
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
