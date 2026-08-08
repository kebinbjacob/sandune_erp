import Link from "next/link";
import { Card } from "@/components/Card";
import styles from "../employees/page.module.css";

export default function SettingsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>System Settings</h1>
          <p className={styles.subtitle}>Configure ERP preferences and branding.</p>
        </div>
        <button className={styles.primaryButton} type="submit">Save Changes</button>
      </header>
      <Card title="Company Profile">
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Company Name</label>
              <input type="text" className={styles.searchInput} defaultValue="SanDune Construction" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Contact Email</label>
              <input type="email" className={styles.searchInput} defaultValue="admin@sandune.com" />
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
