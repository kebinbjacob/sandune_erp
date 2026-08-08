import Link from "next/link";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const materialsData = [
  { item: "Cement (Portland)", category: "Raw Material", stock: "450 Bags", site: "Skyline Tower", status: "Healthy" },
  { item: "Steel TMT Bars", category: "Structural", stock: "12 Tons", site: "Warehouse A", status: "Low Stock" },
];

const columns = [
  { header: "Material", accessor: "item" },
  { header: "Category", accessor: "category" },
  { header: "Current Stock", accessor: "stock" },
  { header: "Location", accessor: "site" },
  { 
    header: "Status", 
    accessor: "status",
    render: (value: string) => (
      <span className={`${styles.statusBadge} ${value === 'Healthy' ? styles.statusActive : styles.statusLeave}`} style={value === 'Low Stock' ? { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' } : {}}>
        {value}
      </span>
    )
  },
];

export default function MaterialsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Material Inventory</h1>
          <p className={styles.subtitle}>Track construction materials and stock alerts.</p>
        </div>
        <Link href="/create?type=Add%20Stock" className={styles.primaryButton}>+ Add Stock</Link>
      </header>
      <Card><Table columns={columns} data={materialsData} /></Card>
    </div>
  );
}
