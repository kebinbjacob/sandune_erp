
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
}