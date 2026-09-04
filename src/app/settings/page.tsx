'use client';

import { useState, useEffect } from 'react';
import styles from '../expenses/expenses.module.css';
import { getCompanySettings, saveCompanySettings } from '@/lib/services/settingsService';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'roles' | 'prefs'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name: 'Sandune Construction LLC',
    registration_number: 'CR-9382012',
    address: '123 Business Bay, Dubai, UAE',
    currency: 'INR (₹)',
    date_format: 'DD/MM/YYYY',
    timezone: 'UTC - Standard',
    email_notifications: 'true',
    in_app_alerts: 'true',
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await getCompanySettings();
        setForm((prev) => ({
          ...prev,
          company_name: data.company_name ?? prev.company_name,
          registration_number: data.registration_number ?? prev.registration_number,
          address: data.address ?? prev.address,
          currency: data.currency ?? prev.currency,
          date_format: data.date_format ?? prev.date_format,
          timezone: data.timezone ?? prev.timezone,
          email_notifications: data.email_notifications ?? prev.email_notifications,
          in_app_alerts: data.in_app_alerts ?? prev.in_app_alerts,
        }));
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(null);
      await saveCompanySettings({
        company_name: form.company_name,
        registration_number: form.registration_number,
        address: form.address,
      });
      setSaveSuccess('Company profile saved successfully!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save company profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(null);
      await saveCompanySettings({
        currency: form.currency,
        date_format: form.date_format,
        timezone: form.timezone,
        email_notifications: form.email_notifications,
        in_app_alerts: form.in_app_alerts,
      });
      setSaveSuccess('System preferences saved successfully!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save system preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Company Settings</h1>
          <p className={styles.subtitle}>Configure ERP preferences, roles, and company details.</p>
        </div>
      </header>

      {saveSuccess && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            color: '#10b981',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          ✓ {saveSuccess}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={styles.actionSelect}
          style={{
            background: activeTab === 'profile' ? 'rgba(99,102,241,0.2)' : '',
            color: activeTab === 'profile' ? '#fff' : '',
          }}
        >
          Company Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={styles.actionSelect}
          style={{
            background: activeTab === 'roles' ? 'rgba(99,102,241,0.2)' : '',
            color: activeTab === 'roles' ? '#fff' : '',
          }}
        >
          User Roles & Access
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prefs')}
          className={styles.actionSelect}
          style={{
            background: activeTab === 'prefs' ? 'rgba(99,102,241,0.2)' : '',
            color: activeTab === 'prefs' ? '#fff' : '',
          }}
        >
          System Preferences
        </button>
      </div>

      <div className={styles.tableCard} style={{ padding: '2rem' }}>
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>Loading settings...</div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <form
                onSubmit={handleSaveProfile}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}
              >
                <h3 style={{ margin: 0, color: '#f8fafc' }}>Company Information</h3>
                <div className={styles.fg}>
                  <label className={styles.fl}>Company Name</label>
                  <input
                    className={styles.fi}
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Registration Number</label>
                  <input
                    className={styles.fi}
                    value={form.registration_number}
                    onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Headquarters Address</label>
                  <textarea
                    className={styles.fi}
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.submitBtn}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {activeTab === 'roles' && (
              <div>
                <h3 style={{ margin: '0 0 1rem', color: '#f8fafc' }}>Role-Based Access Control (RBAC)</h3>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Permissions</th>
                      <th>Users</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.boldCell}>Super Admin</td>
                      <td className={styles.subCell}>Full Access to all modules</td>
                      <td>1</td>
                      <td>
                        <button type="button" className={styles.actionSelect}>
                          Edit
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.boldCell}>HR Manager</td>
                      <td className={styles.subCell}>Employees, Leave, Attendance, Payroll</td>
                      <td>2</td>
                      <td>
                        <button type="button" className={styles.actionSelect}>
                          Edit
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.boldCell}>Project Manager</td>
                      <td className={styles.subCell}>Projects, Tasks, Site Reports</td>
                      <td>5</td>
                      <td>
                        <button type="button" className={styles.actionSelect}>
                          Edit
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.boldCell}>Safety Officer</td>
                      <td className={styles.subCell}>Safety Logs only</td>
                      <td>3</td>
                      <td>
                        <button type="button" className={styles.actionSelect}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'prefs' && (
              <form
                onSubmit={handleSavePrefs}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}
              >
                <h3 style={{ margin: 0, color: '#f8fafc' }}>System Configuration</h3>
                <div className={styles.fg}>
                  <label className={styles.fl}>Default Currency</label>
                  <select
                    className={styles.fi}
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  >
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="AED (د.إ)">AED (د.إ)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                  </select>
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Date Format</label>
                  <select
                    className={styles.fi}
                    value={form.date_format}
                    onChange={(e) => setForm({ ...form, date_format: e.target.value })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Timezone</label>
                  <select
                    className={styles.fi}
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  >
                    <option value="UTC - Standard">UTC - Standard</option>
                    <option value="Asia/Dubai (GST +4)">Asia/Dubai (GST +4)</option>
                    <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                    <option value="America/New_York (EST -5)">America/New_York (EST -5)</option>
                    <option value="Europe/London (GMT +0)">Europe/London (GMT +0)</option>
                  </select>
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Notifications</label>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={form.email_notifications === 'true'}
                      onChange={(e) => setForm({ ...form, email_notifications: e.target.checked ? 'true' : 'false' })}
                    />
                    Enable Email Notifications
                  </label>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                    <input
                      type="checkbox"
                      checked={form.in_app_alerts === 'true'}
                      onChange={(e) => setForm({ ...form, in_app_alerts: e.target.checked ? 'true' : 'false' })}
                    />
                    Enable In-App Alerts
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.submitBtn}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
