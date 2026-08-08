import Link from "next/link";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const safetyData = [
  { id: "SFT-001", date: "2026-08-01", type: "Inspection", site: "Skyline Tower", status: "Passed" },
  { id: "SFT-002", date: "2026-08-03", type: "Incident", site: "Ocean View", status: "Under Review" },
];

const columns = [
  { header: "Record ID", accessor: "id" },
  { header: "Date", accessor: "date" },
  { header: "Type", accessor: "type" },
  { header: "Site", accessor: "site" },
  { header: "Status", accessor: "status" },
];

export default function SafetyPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Safety Logs</h1>
          <p className={styles.subtitle}>Track safety inspections and incidents.</p>
        </div>
        <Link href="/create?type=Log%20Incident" className={styles.primaryButton}>+ Log Incident</Link>
      </header>
      <Card><Table columns={columns} data={safetyData} /></Card>
    </div>
  );
}
