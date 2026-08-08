
import { Card } from "@/components/Card";
import styles from "../../employees/page.module.css";

export default function Preferences() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1>Preferences</h1><p className={styles.subtitle}>System-wide configurations.</p></div>
        <button className={styles.primaryButton}>Save Settings</button>
      </header>
      <Card title="Localization">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Timezone</label>
            <select className={styles.selectInput}><option>UTC - Standard</option><option>EST</option></select>
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Currency</label>
            <select className={styles.selectInput}><option>USD ($)</option><option>EUR (€)</option></select>
          </div>
        </div>
      </Card>
    </div>
  );
}