'use client';

import { useState } from 'react';
import styles from '../expenses/expenses.module.css';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Company Settings</h1>
          <p className={styles.subtitle}>Configure ERP preferences, roles, and company details.</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => setActiveTab('profile')} className={styles.actionSelect} style={{ background: activeTab === 'profile' ? 'rgba(99,102,241,0.2)' : '', color: activeTab === 'profile' ? '#fff' : '' }}>Company Profile</button>
        <button onClick={() => setActiveTab('roles')} className={styles.actionSelect} style={{ background: activeTab === 'roles' ? 'rgba(99,102,241,0.2)' : '', color: activeTab === 'roles' ? '#fff' : '' }}>User Roles & Access</button>
        <button onClick={() => setActiveTab('prefs')} className={styles.actionSelect} style={{ background: activeTab === 'prefs' ? 'rgba(99,102,241,0.2)' : '', color: activeTab === 'prefs' ? '#fff' : '' }}>System Preferences</button>
      </div>

      <div className={styles.tableCard} style={{ padding: '2rem' }}>
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>Company Information</h3>
            <div className={styles.fg}><label className={styles.fl}>Company Name</label><input className={styles.fi} defaultValue="Sandune Construction LLC" /></div>
            <div className={styles.fg}><label className={styles.fl}>Registration Number</label><input className={styles.fi} defaultValue="CR-9382012" /></div>
            <div className={styles.fg}><label className={styles.fl}>Headquarters Address</label><textarea className={styles.fi} rows={3} defaultValue="123 Business Bay, Dubai, UAE" /></div>
            <button className={styles.submitBtn} style={{ alignSelf: 'flex-start' }}>Save Changes</button>
          </div>
        )}

        {activeTab === 'roles' && (
          <div>
            <h3 style={{ margin: '0 0 1rem', color: '#f8fafc' }}>Role-Based Access Control (RBAC)</h3>
            <table className={styles.table}>
              <thead><tr><th>Role</th><th>Permissions</th><th>Users</th><th>Actions</th></tr></thead>
              <tbody>
                <tr><td className={styles.boldCell}>Super Admin</td><td className={styles.subCell}>Full Access to all modules</td><td>1</td><td><button className={styles.actionSelect}>Edit</button></td></tr>
                <tr><td className={styles.boldCell}>HR Manager</td><td className={styles.subCell}>Employees, Leave, Attendance, Payroll</td><td>2</td><td><button className={styles.actionSelect}>Edit</button></td></tr>
                <tr><td className={styles.boldCell}>Project Manager</td><td className={styles.subCell}>Projects, Tasks, Site Reports</td><td>5</td><td><button className={styles.actionSelect}>Edit</button></td></tr>
                <tr><td className={styles.boldCell}>Safety Officer</td><td className={styles.subCell}>Safety Logs only</td><td>3</td><td><button className={styles.actionSelect}>Edit</button></td></tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'prefs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>System Configuration</h3>
            <div className={styles.fg}><label className={styles.fl}>Default Currency</label>
              <select className={styles.fi}><option>INR (₹)</option><option>USD ($)</option><option>AED (د.إ)</option></select>
            </div>
            <div className={styles.fg}><label className={styles.fl}>Date Format</label>
              <select className={styles.fi}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option></select>
            </div>
            <div className={styles.fg}><label className={styles.fl}>Notifications</label>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}><input type="checkbox" defaultChecked /> Enable Email Notifications</label>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}><input type="checkbox" defaultChecked /> Enable In-App Alerts</label>
            </div>
            <button className={styles.submitBtn} style={{ alignSelf: 'flex-start' }}>Save Preferences</button>
          </div>
        )}
      </div>
    </div>
  );
}
