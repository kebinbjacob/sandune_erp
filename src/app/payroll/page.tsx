import Link from "next/link";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const payrollData = [
  { id: "PAY-2607", employee: "John Doe", period: "July 2026", amount: "$5,200", status: "Paid" },
  { id: "PAY-2608", employee: "Sarah Smith", period: "July 2026", amount: "$6,500", status: "Paid" },
];

const columns = [
  { header: "Run ID", accessor: "id" },
  { header: "Employee", accessor: "employee" },
  { header: "Period", accessor: "period" },
  { header: "Net Amount", accessor: "amount" },
  { header: "Status", accessor: "status" },
];

export default function PayrollPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Payroll</h1>
          <p className={styles.subtitle}>Manage employee salary structure and payouts.</p>
        </div>
        <Link href="/create?type=Payroll%20Run" className={styles.primaryButton}>Run Payroll</Link>
      </header>
      <Card><Table columns={columns} data={payrollData} /></Card>
    </div>
  );
}
