import { supabase } from '@/lib/supabase/client';

export interface DashboardMetrics {
  activeEmployees: number;
  activeProjects: number;
  lowStockMaterials: number;
  totalClients: number;
  equipmentInUse: number;
  revenue?: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'leave' | 'expense' | 'site_report' | string;
  icon: string;
  title: string;
  description: string;
  createdAt: string;
  timeAgo: string;
}

export function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [empRes, projRes, matRes, clientRes, equipRes] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('materials').select('id, current_stock, reorder_level'),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'In Use'),
  ]);

  if (empRes.error) console.error('Error fetching employee count:', empRes.error);
  if (projRes.error) console.error('Error fetching project count:', projRes.error);
  if (matRes.error) console.error('Error fetching materials:', matRes.error);
  if (clientRes.error) console.error('Error fetching client count:', clientRes.error);
  if (equipRes.error) console.error('Error fetching equipment count:', equipRes.error);

  const materials = matRes.data || [];
  const lowStockCount = materials.filter(
    (m) => Number(m.current_stock) <= Number(m.reorder_level)
  ).length;

  return {
    activeEmployees: empRes.count || 0,
    activeProjects: projRes.count || 0,
    lowStockMaterials: lowStockCount,
    totalClients: clientRes.count || 0,
    equipmentInUse: equipRes.count || 0,
  };
}

export async function getRecentActivities(): Promise<RecentActivityItem[]> {
  const [leavesRes, expensesRes, reportsRes] = await Promise.all([
    supabase
      .from('leave_requests')
      .select('id, leave_type, status, created_at, employees(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('expenses')
      .select('id, title, amount, category, created_at, employees(name), projects(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('site_reports')
      .select('id, report_date, work_completed, created_at, employees(name), projects(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const items: RecentActivityItem[] = [];

  (leavesRes.data || []).forEach((l: any) => {
    items.push({
      id: `leave-${l.id}`,
      type: 'leave',
      icon: '🏖️',
      title: `${l.employees?.name || 'Employee'} requested ${l.leave_type} Leave`,
      description: `Status: ${l.status}`,
      createdAt: l.created_at || new Date().toISOString(),
      timeAgo: formatTimeAgo(l.created_at),
    });
  });

  (expensesRes.data || []).forEach((e: any) => {
    items.push({
      id: `exp-${e.id}`,
      type: 'expense',
      icon: '💰',
      title: `${e.employees?.name || 'Finance'} submitted expense "${e.title}"`,
      description: `Amount: ₹${Number(e.amount || 0).toLocaleString()} (${e.projects?.name || 'General'})`,
      createdAt: e.created_at || new Date().toISOString(),
      timeAgo: formatTimeAgo(e.created_at),
    });
  });

  (reportsRes.data || []).forEach((r: any) => {
    items.push({
      id: `report-${r.id}`,
      type: 'site_report',
      icon: '🏗️',
      title: `${r.employees?.name || 'Site Engineer'} submitted daily site report`,
      description: `Project: ${r.projects?.name || 'Site'}`,
      createdAt: r.created_at || new Date().toISOString(),
      timeAgo: formatTimeAgo(r.created_at),
    });
  });

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items.slice(0, 5);
}

// Alias for convenience and backward compatibility
export const getRecentActivity = getRecentActivities;
