"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

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
      { 
        name: "Settings", 
        icon: "⚙️",
        subItems: [
          { name: "Company Profile", href: "/settings" },
          { name: "User Roles", href: "/settings/roles" },
          { name: "Preferences", href: "/settings/preferences" },
        ]
      },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
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
    <aside className={`${styles.sidebar} glass`}>
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
                        {item.subItems?.map((sub) => (
                          <Link 
                            key={sub.name} 
                            href={sub.href}
                            className={`${styles.subNavItem} ${pathname === sub.href ? styles.subActive : ''}`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
