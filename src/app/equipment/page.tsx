import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const equipmentData = [
  { id: "EQ-01", name: "Excavator Cat-320", location: "Skyline Tower", status: "In Use" },
  { id: "EQ-02", name: "Crane Tower", location: "Warehouse A", status: "Maintenance" },
];

const columns = [
  { header: "Equipment ID", accessor: "id" },
  { header: "Name", accessor: "name" },
  { header: "Location", accessor: "location" },
  { header: "Status", accessor: "status" },
];

export default function EquipmentPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Equipment</h1>
          <p className={styles.subtitle}>Manage heavy machinery and maintenance schedules.</p>
        </div>
      </header>
      <Card><Table columns={columns} data={equipmentData} /></Card>
    </div>
  );
}
