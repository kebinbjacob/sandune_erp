import Link from "next/link";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const tasksData = [
  { id: "TSK-01", title: "Foundation Pouring", project: "Skyline Tower", assignedTo: "John Doe", status: "In Progress", priority: "High" },
  { id: "TSK-02", title: "Site Inspection", project: "Ocean View", assignedTo: "Sarah Smith", status: "Pending", priority: "Medium" },
];

const columns = [
  { header: "Task", accessor: "title" },
  { header: "Project", accessor: "project" },
  { header: "Assigned To", accessor: "assignedTo" },
  { header: "Priority", accessor: "priority" },
  { header: "Status", accessor: "status" },
];

export default function TasksPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Tasks</h1>
          <p className={styles.subtitle}>Manage daily assignments and priorities.</p>
        </div>
        <Link href="/create?type=Add%20Task" className={styles.primaryButton}>+ Add Task</Link>
      </header>
      <Card><Table columns={columns} data={tasksData} /></Card>
    </div>
  );
}
