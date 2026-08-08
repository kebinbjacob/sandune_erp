import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const vendorData = [
  { name: "BuildCorp Supply", material: "General Hardware", phone: "555-0011", status: "Active" },
  { name: "Steel Works Ltd", material: "Structural Steel", phone: "555-0022", status: "Active" },
];

const columns = [
  { header: "Vendor", accessor: "name" },
  { header: "Material Supplied", accessor: "material" },
  { header: "Contact", accessor: "phone" },
  { header: "Status", accessor: "status" },
];

export default function VendorsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Vendors</h1>
          <p className={styles.subtitle}>Manage material suppliers and ratings.</p>
        </div>
      </header>
      <Card><Table columns={columns} data={vendorData} /></Card>
    </div>
  );
}
