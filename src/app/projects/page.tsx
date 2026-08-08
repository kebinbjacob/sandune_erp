import Link from "next/link";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const projectsData = [
  { id: "PRJ-01", name: "Skyline Tower", client: "Apex Devs", status: "Active", completion: "45%" },
  { id: "PRJ-02", name: "Ocean View Residences", client: "BlueWater Co", status: "Planning", completion: "0%" },
  { id: "PRJ-03", name: "Metro Station Reno", client: "City Transit", status: "Delayed", completion: "78%" },
];

const columns = [
  { header: "ID", accessor: "id" },
  { header: "Project Name", accessor: "name" },
  { header: "Client", accessor: "client" },
  { 
    header: "Status", 
    accessor: "status",
    render: (value: string) => {
      let colorClass = styles.statusActive;
      if (value === 'Planning') colorClass = styles.statusLeave;
      if (value === 'Delayed') colorClass = ''; 
      return (
        <span className={`${styles.statusBadge} ${colorClass}`} style={value === 'Delayed' ? { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' } : {}}>
          {value}
        </span>
      );
    }
  },
  {
    header: "Completion",
    accessor: "completion",
    render: (value: string) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px' }}>
        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: value, height: '100%', background: 'var(--accent-primary)' }} />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{value}</span>
      </div>
    )
  }
];

export default function ProjectsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Projects</h1>
          <p className={styles.subtitle}>Manage your construction sites, budgets, and timelines.</p>
        </div>
        <Link href="/create?type=New%20Project" className={styles.primaryButton}>+ New Project</Link>
      </header>
      <Card>
        <Table columns={columns} data={projectsData} />
      </Card>
    </div>
  );
}
