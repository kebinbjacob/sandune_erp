"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: "📊" },
    ]
  },
  {
    title: "Core HR",
    items: [
      { 
        name: "Employees", 
        icon: "👥",
        subItems: [
          { name: "Directory", href: "/employees" },
          { name: "Add Employee", href: "/employees/new" },
        ]
      },
      { 
        name: "Attendance", 
        icon: "⏰",
        subItems: [
          { name: "Daily Attendance", href: "/attendance" },
          { name: "Timesheets", href: "/attendance/timesheets" },
          { name: "Corrections", href: "/attendance/corrections" },
          { name: "Reports", href: "/attendance/reports" },
        ]
      },
      { 
        name: "Leave", 
        icon: "🏖️",
        subItems: [
          { name: "Leave Requests", href: "/leave" },
          { name: "Apply Leave", href: "/leave/apply" },
          { name: "Balances", href: "/leave/balances" },
        ]
      },
      {
        name: "Shifts & Schedules",
        icon: "📅",
        subItems: [
          { name: "Shift Plans", href: "/shifts" },
          { name: "Schedules", href: "/shifts/schedules" },
        ]
      },
    ]
  },
  {
    title: "Operations",
    items: [
      { 
        name: "Projects", 
        icon: "🏗️",
        subItems: [
          { name: "Active Projects", href: "/projects" },
          { name: "Create Project", href: "/projects/new" }
        ]
      },
      { 
        name: "Tasks", 
        icon: "✅",
        subItems: [
          { name: "All Tasks", href: "/tasks" },
          { name: "Kanban Board", href: "/tasks/board" },
        ]
      },
      { name: "Daily Reports", href: "/reports/site", icon: "📝" },
      { name: "Safety", href: "/safety", icon: "🦺" },
    ]
  },
  {
    title: "Resources",
    items: [
      { name: "Materials", href: "/materials", icon: "🧱" },
      { name: "Equipment", href: "/equipment", icon: "🚜" },
      { name: "Procurement", href: "/procurement", icon: "🛒" },
    ]
  },
  {
    title: "CRM & Entities",
    items: [
      { name: "Clients", href: "/clients", icon: "🤝" },
      { name: "Contractors", href: "/contractors", icon: "👷" },
      { name: "Vendors", href: "/vendors", icon: "🏭" },
    ]
  },
  {
    title: "Finance & Admin",
    items: [
      { name: "Expenses", href: "/expenses", icon: "💸" },
      { name: "Payroll", href: "/payroll", icon: "💰" },
      { name: "User Management", href: "/settings/users", icon: "🔐", adminOnly: true },
      { 
        name: "Settings", 
        icon: "⚙️",
        subItems: [
          { name: "Company Profile", href: "/settings" },
          { name: "Preferences", href: "/settings/preferences" },
        ]
      },
    ]
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  // Auto-open submenus based on current route
  useEffect(() => {
    const newOpenState = { ...openSubMenus };
    navGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.subItems) {
          const isActive = item.subItems.some(sub => pathname === sub.href);
          if (isActive) {
            newOpenState[item.name] = true;
          }
        }
      });
    });
    setOpenSubMenus(newOpenState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleSubMenu = (name: string) => {
    setOpenSubMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <>
      {isOpen && <div className={styles.mobileOverlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''} glass`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon} />
          <h2>SanDune ERP</h2>
        </div>
      
      <div className={styles.navScrollArea}>
        {navGroups.map((group) => (
          <div key={group.title} className={styles.navGroup}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <nav className={styles.nav}>
              {group.items.map((item) => {
                // Hide adminOnly items from non-admins
                if ((item as any).adminOnly && !['Admin', 'SUPER_ADMIN', 'ADMIN'].includes(user?.role || '')) return null;

                const hasSubItems = !!item.subItems;
                const isActive = item.href 
                  ? (pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)))
                  : (hasSubItems && item.subItems?.some(sub => pathname === sub.href));

                const isOpen = openSubMenus[item.name];

                return (
                  <div key={item.name} className={styles.navItemWrapper}>
                    {hasSubItems ? (
                      <button 
                        className={`${styles.navItem} ${styles.navItemButton} ${isActive ? styles.active : ''}`}
                        onClick={() => toggleSubMenu(item.name)}
                      >
                        <span className={styles.icon}>{item.icon}</span>
                        <span style={{ flex: 1, textAlign: 'left' }}>{item.name}</span>
                        <span className={styles.chevron}>{isOpen ? '▼' : '▶'}</span>
                      </button>
                    ) : (
                      <Link 
                        href={item.href!} 
                        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                      >
                        <span className={styles.icon}>{item.icon}</span>
                        {item.name}
                      </Link>
                    )}

                    {hasSubItems && isOpen && (
                      <div className={styles.subMenu}>
                        {item.subItems?.map((sub) => {
                          if (sub.name === 'User Roles' && !['Admin', 'SUPER_ADMIN'].includes(user?.role || '')) return null;
                          return (
                            <Link 
                              key={sub.name} 
                              href={sub.href}
                              className={`${styles.subNavItem} ${pathname === sub.href ? styles.subActive : ''}`}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border-color)' }}>
        <button 
          onClick={logout}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
          }}
        >
          <span>🚪</span> Log Out
        </button>
      </div>
    </aside>
    </>
  );
}
