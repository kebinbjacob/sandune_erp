import Link from "next/link";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "./page.module.css";

// Mock Data
const employees = [
  { id: "EMP-001", name: "John Doe", role: "Site Engineer", project: "Skyline Tower", status: "Active" },
  { id: "EMP-002", name: "Sarah Smith", role: "Project Manager", project: "Ocean View Residences", status: "Active" },
  { id: "EMP-003", name: "Mike Johnson", role: "Safety Officer", project: "Skyline Tower", status: "On Leave" },
  { id: "EMP-004", name: "Emily Chen", role: "Architect", project: "Metro Station", status: "Active" },
];

const columns = [
  { header: "ID", accessor: "id" },
  { header: "Name", accessor: "name" },
  { header: "Role", accessor: "role" },
  { header: "Project", accessor: "project" },
  { 
    header: "Status", 
    accessor: "status",
    render: (value: string) => (
      <span className={`${styles.statusBadge} ${value === 'Active' ? styles.statusActive : styles.statusLeave}`}>
        {value}
      </span>
    )
  },
];

export default function EmployeesPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Employees</h1>
          <p className={styles.subtitle}>Manage your workforce, roles, and assignments.</p>
        </div>
        <Link href="/create?type=Add%20Employee" className={styles.primaryButton}>+ Add Employee</Link>
      </header>

      <Card>
        <div className={styles.filters}>
          <input type="text" placeholder="Search employees..." className={styles.searchInput} />
          <select className={styles.selectInput}>
            <option>All Roles</option>
            <option>Site Engineer</option>
            <option>Project Manager</option>
          </select>
        </div>
        <Table columns={columns} data={employees} />
      </Card>
    </div>
  );
}
