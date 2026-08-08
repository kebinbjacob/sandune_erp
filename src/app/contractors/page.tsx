import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const contractorData = [
  { name: "ElectriCity Inc", trade: "Electrical", activeWorkers: 14, status: "Active" },
  { name: "PlumbLine Co", trade: "Plumbing", activeWorkers: 8, status: "Active" },
];

const columns = [
  { header: "Company", accessor: "name" },
  { header: "Trade", accessor: "trade" },
  { header: "Active Workers", accessor: "activeWorkers" },
  { header: "Status", accessor: "status" },
];

export default function ContractorsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Contractors</h1>
          <p className={styles.subtitle}>Manage sub-contractors and their workforce.</p>
        </div>
      </header>
      <Card><Table columns={columns} data={contractorData} /></Card>
    </div>
  );
}
