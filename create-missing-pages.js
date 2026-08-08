const fs = require('fs');
const path = require('path');

const pagesToCreate = {
  'employees/new': 'export { default } from "../../create/page";',
  'attendance/timesheets': `
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../../employees/page.module.css";

const data = [
  { id: "TS-01", employee: "John Doe", hours: "40", overtime: "2", status: "Approved" },
  { id: "TS-02", employee: "Sarah Smith", hours: "38", overtime: "0", status: "Pending" }
];
const cols = [
  { header: "ID", accessor: "id" },
  { header: "Employee", accessor: "employee" },
  { header: "Regular Hours", accessor: "hours" },
  { header: "Overtime", accessor: "overtime" },
  { header: "Status", accessor: "status" }
];

export default function Timesheets() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1>Timesheets</h1><p className={styles.subtitle}>Review weekly hours and overtime.</p></div>
        <button className={styles.primaryButton}>Export</button>
      </header>
      <Card><Table columns={cols} data={data} /></Card>
    </div>
  );
}`,
  'leave/balances': `
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../../employees/page.module.css";

const data = [
  { employee: "John Doe", total: 20, used: 5, remaining: 15 },
  { employee: "Sarah Smith", total: 20, used: 20, remaining: 0 }
];
const cols = [
  { header: "Employee", accessor: "employee" },
  { header: "Total Allowance", accessor: "total" },
  { header: "Used Days", accessor: "used" },
  { header: "Remaining Balance", accessor: "remaining" }
];

export default function LeaveBalances() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1>Leave Balances</h1><p className={styles.subtitle}>Track employee time-off allowances.</p></div>
      </header>
      <Card><Table columns={cols} data={data} /></Card>
    </div>
  );
}`,
  'projects/new': 'export { default } from "../../create/page";',
  'tasks/board': `
import { Card } from "@/components/Card";
import styles from "../../employees/page.module.css";

export default function KanbanBoard() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1>Kanban Board</h1><p className={styles.subtitle}>Visual task management.</p></div>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <Card title="To Do"><div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>Task 1: Order Cement</div></Card>
        <Card title="In Progress"><div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>Task 2: Foundation Pouring</div></Card>
        <Card title="Done"><div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>Task 3: Site Inspection</div></Card>
      </div>
    </div>
  );
}`,
  'settings/roles': `
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import styles from "../../employees/page.module.css";

const data = [
  { role: "Admin", access: "Full System", users: 3 },
  { role: "Project Manager", access: "Operations, Resources", users: 12 },
  { role: "Site Engineer", access: "Daily Reports, Tasks", users: 45 }
];
const cols = [
  { header: "Role Name", accessor: "role" },
  { header: "Access Level", accessor: "access" },
  { header: "Active Users", accessor: "users" }
];

export default function Roles() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1>User Roles</h1><p className={styles.subtitle}>Manage permissions and security.</p></div>
        <button className={styles.primaryButton}>+ Create Role</button>
      </header>
      <Card><Table columns={cols} data={data} /></Card>
    </div>
  );
}`,
  'settings/preferences': `
import { Card } from "@/components/Card";
import styles from "../../employees/page.module.css";

export default function Preferences() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1>Preferences</h1><p className={styles.subtitle}>System-wide configurations.</p></div>
        <button className={styles.primaryButton}>Save Settings</button>
      </header>
      <Card title="Localization">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Timezone</label>
            <select className={styles.selectInput}><option>UTC - Standard</option><option>EST</option></select>
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Currency</label>
            <select className={styles.selectInput}><option>USD ($)</option><option>EUR (€)</option></select>
          </div>
        </div>
      </Card>
    </div>
  );
}`
};

const baseDir = 'c:/Users/kelvin babu/Downloads/sandune-main/sandune-main/src/app';

for (const [route, content] of Object.entries(pagesToCreate)) {
  const fullDir = path.join(baseDir, route);
  fs.mkdirSync(fullDir, { recursive: true });
  fs.writeFileSync(path.join(fullDir, 'page.tsx'), content);
  console.log('Created: ' + route);
}
