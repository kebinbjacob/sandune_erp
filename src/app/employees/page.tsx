"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { getEmployees, Employee } from "@/lib/services/employeeService";
import styles from "./page.module.css";

const defaultMockEmployees: Employee[] = [
  { id: "EMP-001", employee_id: "EMP-001", name: "John Doe", role: "Site Engineer", project: "Skyline Tower", status: "Active" },
  { id: "EMP-002", employee_id: "EMP-002", name: "Sarah Smith", role: "Project Manager", project: "Ocean View Residences", status: "Active" },
  { id: "EMP-003", employee_id: "EMP-003", name: "Mike Johnson", role: "Safety Officer", project: "Skyline Tower", status: "On Leave" },
  { id: "EMP-004", employee_id: "EMP-004", name: "Emily Chen", role: "Architect", project: "Metro Station", status: "Active" },
];

const columns = [
  { header: "ID", accessor: "emp_code" },
  { header: "Name", accessor: "name" },
  { header: "Role", accessor: "role" },
  { header: "Project", accessor: "project" },
  { 
    header: "Status", 
    accessor: "status",
    render: (value: string) => (
      <span className={`${styles.statusBadge} ${value === 'Active' ? styles.statusActive : styles.statusLeave}`}>
        {value}
      </span>
    )
  },
  {
    header: "Actions",
    accessor: "uuid",
    render: (uuid: string) => (
      <Link href={`/employees/${uuid}`} style={{ color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
        View Profile →
      </Link>
    )
  },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(defaultMockEmployees);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("All Roles");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await getEmployees();
        if (isMounted) {
          if (data && data.length > 0) {
            setEmployees(data);
          }
        }
      } catch (err) {
        console.error("Failed to load live employees from Supabase:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee_id && emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "All Roles" || emp.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const tableData = filtered.map((emp) => ({
    uuid: emp.id || '',
    emp_code: emp.employee_id || emp.id?.slice(0,8) || 'EMP-000',
    name: emp.name,
    role: emp.role,
    project: emp.project || 'Unassigned',
    status: emp.status || 'Active',
  }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Employees</h1>
          <p className={styles.subtitle}>Manage your workforce, roles, and assignments.</p>
        </div>
        <Link href="/create?type=Add%20Employee" className={styles.primaryButton}>+ Add Employee</Link>
      </header>

      <Card>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search employees..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className={styles.selectInput}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="All Roles">All Roles</option>
            <option value="Site Engineer">Site Engineer</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Safety Officer">Safety Officer</option>
            <option value="Architect">Architect</option>
          </select>
        </div>
        {loading && <div style={{ padding: "16px", color: "var(--text-secondary)" }}>Loading employee data...</div>}
        <Table columns={columns} data={tableData} />
      </Card>
    </div>
  );
}
