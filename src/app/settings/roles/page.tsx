
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../../employees/page.module.css";

const data = [
  { role: "Admin", access: "Full System", users: 3 },
  { role: "Project Manager", access: "Operations, Resources", users: 12 },
  { role: "Site Engineer", access: "Daily Reports, Tasks", users: 45 }
];
const cols = [
  { header: "Role Name", accessor: "role" },
  { header: "Access Level", accessor: "access" },
  { header: "Active Users", accessor: "users" }
];

export default function Roles() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1>User Roles</h1><p className={styles.subtitle}>Manage permissions and security.</p></div>
        <button className={styles.primaryButton}>+ Create Role</button>
      </header>
      <Card><Table columns={cols} data={data} /></Card>
    </div>
  );
}