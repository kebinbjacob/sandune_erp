import styles from "./page.module.css";
import { Card } from "../components/Card";
import { RevenueAreaChart, WorkforceDonutChart, ProjectStatusChart } from "../components/DashboardCharts";

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard Overview</h1>
        <p className={styles.subtitle}>Welcome back, here's your complete ERP overview.</p>
      </header>

      {/* Core HR */}
      <section className={styles.sectionGroup}>
        <h2 className={styles.sectionTitle}>Core HR</h2>
        <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
          <Card title="Workforce Attendance">
            <WorkforceDonutChart />
          </Card>
          <Card title="Total Employees">
            <div className={styles.metricValue}>142</div>
            <div className={`${styles.metricChange} ${styles.positive}`}>+3 this month</div>
            <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className={`${styles.metricChange} ${styles.negative}`}>12 Absent Today</div>
              <div className={`${styles.metricChange} ${styles.negative}`}>5 Pending Leave Requests</div>
            </div>
          </Card>
        </div>
      </section>

      {/* Operations */}
      <section className={styles.sectionGroup}>
        <h2 className={styles.sectionTitle}>Operations</h2>
        <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
          <Card title="Project Progress">
            <ProjectStatusChart />
          </Card>
          <Card title="Active Projects Overview">
            <div className={styles.metricValue}>8 Active</div>
            <div className={styles.metricChange}>Across 4 cities</div>
            <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className={`${styles.metricChange} ${styles.negative}`}>34 Tasks Pending</div>
              <div className={`${styles.metricChange} ${styles.positive}`}>1 Safety Incident (Down 50%)</div>
            </div>
          </Card>
        </div>
      </section>

      {/* Resources & CRM */}
      <section className={styles.sectionGroup}>
        <h2 className={styles.sectionTitle}>Resources & CRM</h2>
        <div className={styles.metricsGrid}>
          <Card title="Low Stock Materials">
            <div className={styles.metricValue}>12</div>
            <div className={`${styles.metricChange} ${styles.negative}`}>Action required</div>
          </Card>
          <Card title="Equipment in Maintenance">
            <div className={styles.metricValue}>4</div>
            <div className={styles.metricChange}>Out of 85 total</div>
          </Card>
          <Card title="Active Clients">
            <div className={styles.metricValue}>24</div>
            <div className={`${styles.metricChange} ${styles.positive}`}>+2 new contracts</div>
          </Card>
        </div>
      </section>

      {/* Finance & Activity */}
      <section className={styles.sectionGroup}>
        <h2 className={styles.sectionTitle}>Finance & Activity</h2>
        <div className={styles.mainContent}>
          <Card title="Recent Activity" className={styles.activityCard}>
            <ul className={styles.activityList}>
              <li className={styles.activityItem}>
                <div className={styles.activityIcon}>🏗️</div>
                <div className={styles.activityDetails}>
                  <span><strong>Site Engineer</strong> submitted daily report for <strong>Skyline Tower</strong>.</span>
                  <span className={styles.activityTime}>2 hours ago</span>
                </div>
              </li>
              <li className={styles.activityItem}>
                <div className={styles.activityIcon}>🛒</div>
                <div className={styles.activityDetails}>
                  <span><strong>Procurement</strong> approved PO-1045 for <strong>BuildCorp Supply</strong>.</span>
                  <span className={styles.activityTime}>5 hours ago</span>
                </div>
              </li>
              <li className={styles.activityItem}>
                <div className={styles.activityIcon}>💰</div>
                <div className={styles.activityDetails}>
                  <span><strong>Finance</strong> processed July 2026 Payroll.</span>
                  <span className={styles.activityTime}>1 day ago</span>
                </div>
              </li>
            </ul>
          </Card>
          
          <Card title="Revenue Growth" className={styles.chartCard}>
            <div className={styles.metricValue} style={{ fontSize: '1.5rem', marginTop: '0' }}>$184,500</div>
            <div className={`${styles.metricChange} ${styles.positive}`}>+14% vs last month</div>
            <RevenueAreaChart />
          </Card>
        </div>
      </section>
    </div>
  );
}
