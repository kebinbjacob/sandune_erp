'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Card } from '../components/Card';
import { RevenueAreaChart, WorkforceDonutChart, ProjectStatusChart } from '../components/DashboardCharts';
import {
  getDashboardMetrics,
  getRecentActivities,
  DashboardMetrics,
  RecentActivityItem,
} from '@/lib/services/dashboardService';

export default function Home() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeEmployees: 0,
    activeProjects: 0,
    lowStockMaterials: 0,
    totalClients: 0,
    equipmentInUse: 0,
  });
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [m, a] = await Promise.all([
          getDashboardMetrics(),
          getRecentActivities(),
        ]);
        setMetrics(m);
        setActivities(a);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard Overview</h1>
        <p className={styles.subtitle}>Welcome back, here's your complete ERP overview.</p>
      </header>

      {/* Core HR */}
      <section className={styles.sectionGroup}>
        <h2 className={styles.sectionTitle}>Core HR</h2>
        <div className={styles.metricsGrid}>
          <Card title="Workforce Attendance">
            <WorkforceDonutChart />
          </Card>
          <Card title="Active Employees">
            <div className={styles.metricValue}>{loading ? '...' : metrics.activeEmployees}</div>
            <div className={`${styles.metricChange} ${styles.positive}`}>Active workforce members</div>
            <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className={styles.metricChange}>Status: Active in system</div>
              <div className={styles.metricChange}>Real-time employee tracking</div>
            </div>
          </Card>
        </div>
      </section>

      {/* Operations */}
      <section className={styles.sectionGroup}>
        <h2 className={styles.sectionTitle}>Operations</h2>
        <div className={styles.metricsGrid}>
          <Card title="Project Progress">
            <ProjectStatusChart />
          </Card>
          <Card title="Active Projects Overview">
            <div className={styles.metricValue}>{loading ? '...' : `${metrics.activeProjects} Active`}</div>
            <div className={styles.metricChange}>Live construction & engineering projects</div>
            <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className={`${styles.metricChange} ${styles.positive}`}>Real-time status updates</div>
              <div className={styles.metricChange}>Active operational sites</div>
            </div>
          </Card>
        </div>
      </section>

      {/* Resources & CRM */}
      <section className={styles.sectionGroup}>
        <h2 className={styles.sectionTitle}>Resources & CRM</h2>
        <div className={styles.metricsGrid}>
          <Card title="Low Stock Materials">
            <div className={styles.metricValue}>{loading ? '...' : metrics.lowStockMaterials}</div>
            <div className={`${styles.metricChange} ${metrics.lowStockMaterials > 0 ? styles.negative : styles.positive}`}>
              {metrics.lowStockMaterials > 0 ? 'Action required (≤ reorder level)' : 'Stock levels healthy'}
            </div>
          </Card>
          <Card title="Equipment in Use">
            <div className={styles.metricValue}>{loading ? '...' : metrics.equipmentInUse}</div>
            <div className={styles.metricChange}>Currently deployed on active sites</div>
          </Card>
          <Card title="Total Clients">
            <div className={styles.metricValue}>{loading ? '...' : metrics.totalClients}</div>
            <div className={`${styles.metricChange} ${styles.positive}`}>Registered client portfolio</div>
          </Card>
        </div>
      </section>

      {/* Finance & Activity */}
      <section className={styles.sectionGroup}>
        <h2 className={styles.sectionTitle}>Finance & Activity</h2>
        <div className={styles.mainContent}>
          <Card title="Recent Activity" className={styles.activityCard}>
            {loading ? (
              <p style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>Loading recent activity...</p>
            ) : activities.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>No recent activity records found.</p>
            ) : (
              <ul className={styles.activityList}>
                {activities.map((item) => (
                  <li key={item.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>{item.icon}</div>
                    <div className={styles.activityDetails}>
                      <span>{item.title}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {item.description}
                      </span>
                      <span className={styles.activityTime}>{item.timeAgo}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Revenue Growth" className={styles.chartCard}>
            <div className={styles.metricValue} style={{ fontSize: '1.5rem', marginTop: '0' }}>
              $184,500
            </div>
            <div className={`${styles.metricChange} ${styles.positive}`}>+14% vs last month</div>
            <RevenueAreaChart />
          </Card>
        </div>
      </section>
    </div>
  );
}
