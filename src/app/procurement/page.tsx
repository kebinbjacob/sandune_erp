import Link from "next/link";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const procurementData = [
  { id: "PO-1045", vendor: "BuildCorp Supply", amount: "$12,400", date: "2026-08-02", status: "Approved" },
  { id: "PO-1046", vendor: "Steel Works Ltd", amount: "$45,000", date: "2026-08-04", status: "Pending" },
];

const columns = [
  { header: "PO Number", accessor: "id" },
  { header: "Vendor", accessor: "vendor" },
  { header: "Amount", accessor: "amount" },
  { header: "Order Date", accessor: "date" },
  { header: "Status", accessor: "status" },
];

export default function ProcurementPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Procurement</h1>
          <p className={styles.subtitle}>Manage purchase orders and requests.</p>
        </div>
        <Link href="/create?type=Create%20PO" className={styles.primaryButton}>+ Create PO</Link>
      </header>
      <Card><Table columns={columns} data={procurementData} /></Card>
    </div>
  );
}
