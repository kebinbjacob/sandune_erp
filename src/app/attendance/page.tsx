import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../employees/page.module.css";

const attendanceData = [
  { id: "EMP-001", name: "John Doe", date: "2026-08-04", checkIn: "08:50 AM", checkOut: "06:10 PM", status: "Present" },
  { id: "EMP-002", name: "Sarah Smith", date: "2026-08-04", checkIn: "09:15 AM", checkOut: "-", status: "Late" },
  { id: "EMP-003", name: "Mike Johnson", date: "2026-08-04", checkIn: "-", checkOut: "-", status: "Absent" },
];

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Date", accessor: "date" },
  { header: "Check In", accessor: "checkIn" },
  { header: "Check Out", accessor: "checkOut" },
  { 
    header: "Status", 
    accessor: "status",
    render: (value: string) => (
      <span className={`${styles.statusBadge} ${value === 'Present' ? styles.statusActive : value === 'Late' ? styles.statusLeave : ''}`} style={value === 'Absent' ? { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' } : {}}>
        {value}
      </span>
    )
  },
];

export default function AttendancePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Daily Attendance</h1>
          <p className={styles.subtitle}>Track employee check-ins and check-outs across all sites.</p>
        </div>
        <button className={styles.primaryButton}>Export Report</button>
      </header>
      <Card>
        <div className={styles.filters}>
          <input type="date" className={styles.searchInput} defaultValue="2026-08-04" />
          <select className={styles.selectInput}>
            <option>All Sites</option>
            <option>Skyline Tower</option>
          </select>
        </div>
        <Table columns={columns} data={attendanceData} />
      </Card>
    </div>
  );
}
