import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const leaveData = [
  { id: "REQ-101", employee: "Mike Johnson", type: "Sick Leave", duration: "2 Days (Aug 5 - Aug 6)", status: "Pending" },
  { id: "REQ-102", employee: "Emily Chen", type: "Casual Leave", duration: "1 Day (Aug 10)", status: "Approved" },
];

const columns = [
  { header: "Employee", accessor: "employee" },
  { header: "Leave Type", accessor: "type" },
  { header: "Duration", accessor: "duration" },
  { 
    header: "Status", 
    accessor: "status",
    render: (value: string) => (
      <span className={`${styles.statusBadge} ${value === 'Approved' ? styles.statusActive : styles.statusLeave}`}>
        {value}
      </span>
    )
  },
  {
    header: "Actions",
    accessor: "id",
    render: () => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Approve</button>
        <button style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Reject</button>
      </div>
    )
  }
];

export default function LeavePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Leave Management</h1>
          <p className={styles.subtitle}>Review and approve employee leave requests.</p>
        </div>
      </header>
      <Card>
        <Table columns={columns} data={leaveData} />
      </Card>
    </div>
  );
}
