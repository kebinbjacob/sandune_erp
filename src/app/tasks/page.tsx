'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { getAllTasks, Task, TASK_STATUSES } from '@/lib/services/taskService';
import styles from "../employees/page.module.css";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAllTasks();
        setTasks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { header: "Task", accessor: "title" },
    { 
      header: "Project", 
      accessor: "project",
      render: (_: any, row: any) => row.projects?.name || '—'
    },
    { 
      header: "Assigned To", 
      accessor: "assignee",
      render: (_: any, row: any) => row.employees ? `${row.employees.name} (${row.employees.role})` : <span style={{ color: 'var(--text-secondary)' }}>Unassigned</span>
    },
    { 
      header: "Priority", 
      accessor: "priority",
      render: (value: string) => {
        let color = '#10b981';
        if (value === 'Medium') color = '#f59e0b';
        if (value === 'High') color = '#ef4444';
        if (value === 'Critical') color = '#7f1d1d';
        return <span style={{ color, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>{value}</span>;
      }
    },
    { 
      header: "Status", 
      accessor: "status",
      render: (value: string) => (
        <span className={`${styles.statusBadge} ${value === 'Completed' ? styles.statusActive : (value === 'Blocked' ? styles.statusLeave : '')}`} style={value === 'Completed' ? {} : value === 'Blocked' ? { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
          {value}
        </span>
      )
    },
    {
      header: "Due Date",
      accessor: "due_date",
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Tasks List</h1>
          <p className={styles.subtitle}>Manage all daily assignments across projects.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/tasks/board" className={styles.secondaryButton} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>Kanban Board</Link>
          <Link href="/tasks/board" className={styles.primaryButton}>+ Add Task</Link>
        </div>
      </header>
      <Card>
        {loading ? <div style={{ padding: '20px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Loading tasks...</div> : (
          <Table columns={columns} data={tasks} />
        )}
      </Card>
    </div>
  );
}
