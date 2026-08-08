import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const clientsData = [
  { name: "Apex Devs", contact: "Alice Smith", phone: "555-0192", projects: "2 Active" },
  { name: "City Transit", contact: "Bob Johnson", phone: "555-0193", projects: "1 Active" },
];

const columns = [
  { header: "Company", accessor: "name" },
  { header: "Primary Contact", accessor: "contact" },
  { header: "Phone", accessor: "phone" },
  { header: "Projects", accessor: "projects" },
];

export default function ClientsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Clients</h1>
          <p className={styles.subtitle}>Manage client relationships and contracts.</p>
        </div>
      </header>
      <Card><Table columns={columns} data={clientsData} /></Card>
    </div>
  );
}
