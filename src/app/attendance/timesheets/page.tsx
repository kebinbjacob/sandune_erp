
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../../employees/page.module.css";

const data = [
  { id: "TS-01", employee: "John Doe", hours: "40", overtime: "2", status: "Approved" },
  { id: "TS-02", employee: "Sarah Smith", hours: "38", overtime: "0", status: "Pending" }
];
const cols = [
  { header: "ID", accessor: "id" },
  { header: "Employee", accessor: "employee" },
  { header: "Regular Hours", accessor: "hours" },
  { header: "Overtime", accessor: "overtime" },
  { header: "Status", accessor: "status" }
];

export default function Timesheets() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1>Timesheets</h1><p className={styles.subtitle}>Review weekly hours and overtime.</p></div>
        <button className={styles.primaryButton}>Export</button>
      </header>
      <Card><Table columns={cols} data={data} /></Card>
    </div>
  );
}