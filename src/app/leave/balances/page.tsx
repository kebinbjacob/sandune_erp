
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../../employees/page.module.css";

const data = [
  { employee: "John Doe", total: 20, used: 5, remaining: 15 },
  { employee: "Sarah Smith", total: 20, used: 20, remaining: 0 }
];
const cols = [
  { header: "Employee", accessor: "employee" },
  { header: "Total Allowance", accessor: "total" },
  { header: "Used Days", accessor: "used" },
  { header: "Remaining Balance", accessor: "remaining" }
];

export default function LeaveBalances() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1>Leave Balances</h1><p className={styles.subtitle}>Track employee time-off allowances.</p></div>
      </header>
      <Card><Table columns={cols} data={data} /></Card>
    </div>
  );
}