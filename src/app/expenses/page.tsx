import Link from "next/link";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const expenseData = [
  { id: "EXP-992", project: "Skyline Tower", category: "Material", amount: "$4,500", date: "2026-08-01" },
  { id: "EXP-993", project: "Ocean View", category: "Labor", amount: "$12,000", date: "2026-08-03" },
];

const columns = [
  { header: "Expense ID", accessor: "id" },
  { header: "Project", accessor: "project" },
  { header: "Category", accessor: "category" },
  { header: "Amount", accessor: "amount" },
  { header: "Date", accessor: "date" },
];

export default function ExpensesPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Expenses</h1>
          <p className={styles.subtitle}>Track project costs and operational expenses.</p>
        </div>
        <Link href="/create?type=Log%20Expense" className={styles.primaryButton}>+ Log Expense</Link>
      </header>
      <Card><Table columns={columns} data={expenseData} /></Card>
    </div>
  );
}
