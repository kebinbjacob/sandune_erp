import styles from './Navbar.module.css';

export function Navbar() {
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
        
        <div className={styles.profile}>
          <div className={styles.avatar}>JD</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Jane Doe</span>
            <span className={styles.userRole}>Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
