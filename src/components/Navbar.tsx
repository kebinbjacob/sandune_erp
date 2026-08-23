'use client';

import Link from 'next/link';
import styles from './Navbar.module.css';
import { useAuth } from '@/lib/context/AuthContext';

export function Navbar() {
  const { user } = useAuth();

  // Get display name: prefer linked employee name, fallback to email
  const displayName = user?.employees?.name || user?.email?.split('@')[0] || 'User';
  const displayRole = user?.role || 'Staff';
  const avatarUrl = user?.employees?.avatar_url || user?.avatar_url || null;

  // Generate initials from name
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className={`${styles.navbar} glass`}>
      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>🔍</span>
        <input type="text" placeholder="Search across all modules..." className={styles.searchInput} />
      </div>
      
      <div className={styles.actions}>
        <button className={styles.iconButton} aria-label="Notifications">
          🔔
          <span className={styles.badge}>3</span>
        </button>
        
        <Link href="/profile" className={styles.profile} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.avatar} style={{ overflow: 'hidden' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userRole}>{displayRole}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}

