'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  
  // Profile Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    role: '',
    department: '',
  });

  // Password Form State
  const [passForm, setPassForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.employees?.name || '',
        phone: user.employees?.phone || '',
        role: user.employees?.role || '',
        department: user.employees?.department || '',
      });
      setAvatarUrl(user.employees?.avatar_url || null);
      setLoading(false);
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setSaving(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      if (user?.employee_id) {
        const { error: empUpdateError } = await supabase
          .from('employees')
          .update({ avatar_url: data.publicUrl })
          .eq('id', user.employee_id);
          
        if (empUpdateError) throw empUpdateError;
      }
      
      if (user?.id) {
        const { error: userUpdateError } = await supabase
          .from('app_users')
          .update({ avatar_url: data.publicUrl })
          .eq('id', user.id);
          
        if (userUpdateError) throw userUpdateError;
      }

      setAvatarUrl(data.publicUrl);
      if (refreshUser) refreshUser();
      alert('Profile picture updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Error uploading avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      if (user?.employee_id) {
        const { error: empError } = await supabase
          .from('employees')
          .update({
            name: form.name,
            phone: form.phone,
            role: form.role,
            department: form.department
          })
          .eq('id', user.employee_id);
          
        if (empError) throw empError;
      }
      
      if (user?.id) {
        const { error: userError } = await supabase
          .from('app_users')
          .update({
            department: form.department
          })
          .eq('id', user.id);
          
        if (userError) throw userError;
      }
      
      if (refreshUser) refreshUser();
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    
    try {
      setPasswordSaving(true);
      
      // Update Supabase Auth Password
      const { error: authError } = await supabase.auth.updateUser({
        password: passForm.newPassword
      });
      
      if (authError) throw authError;

      // Update internal app_users table (if it's tracking password)
      if (user?.id) {
        await supabase
          .from('app_users')
          .update({ password: passForm.newPassword })
          .eq('id', user.id);
      }
      
      setPassForm({ newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    } catch (error: any) {
      alert(error.message || 'Error changing password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading profile...</div>;

  const initials = (user?.employees?.name || user?.email || 'User')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>Manage your personal information and security preferences.</p>
      </header>

      <div className={styles.grid}>
        {/* Left Column: Avatar & Summary */}
        <div className={styles.card}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className={styles.avatarImage} />
              ) : (
                <span>{initials}</span>
              )}
              <div className={styles.uploadOverlay}>Change Picture</div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={uploadAvatar} 
                accept="image/*" 
                className={styles.fileInput} 
              />
            </div>
            <div>
              <div className={styles.nameBadge}>{form.name || user?.email}</div>
              <div className={styles.roleBadge}>{user?.role}</div>
            </div>
            
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Profile Form */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>👤 Personal Information</h2>
            <form onSubmit={handleProfileSave}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    className={styles.input} 
                    required 
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input 
                    type="tel" 
                    value={form.phone} 
                    onChange={e => setForm({...form, phone: e.target.value})} 
                    className={styles.input} 
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Job Title</label>
                  <input 
                    type="text" 
                    value={form.role} 
                    onChange={e => setForm({...form, role: e.target.value})} 
                    className={styles.input} 
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Department</label>
                  <input 
                    type="text" 
                    value={form.department} 
                    onChange={e => setForm({...form, department: e.target.value})} 
                    className={styles.input} 
                  />
                </div>
              </div>
              
              <div className={styles.actions}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Form */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>🔒 Security & Password</h2>
            <form onSubmit={handlePasswordSave}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>New Password</label>
                  <input 
                    type="password" 
                    value={passForm.newPassword} 
                    onChange={e => setPassForm({...passForm, newPassword: e.target.value})} 
                    className={styles.input} 
                    required 
                    minLength={6}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={passForm.confirmPassword} 
                    onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} 
                    className={styles.input} 
                    required 
                    minLength={6}
                  />
                </div>
              </div>
              
              <div className={styles.actions}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={passwordSaving}>
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
