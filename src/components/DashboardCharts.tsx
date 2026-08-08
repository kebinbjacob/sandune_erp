"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const revenueData = [
  { name: 'Jan', revenue: 40000, target: 24000 },
  { name: 'Feb', revenue: 30000, target: 13980 },
  { name: 'Mar', revenue: 20000, target: 9800 },
  { name: 'Apr', revenue: 27800, target: 39080 },
  { name: 'May', revenue: 18900, target: 48000 },
  { name: 'Jun', revenue: 23900, target: 38000 },
  { name: 'Jul', revenue: 34900, target: 43000 },
];

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export function RevenueAreaChart() {
  return (
    <div style={{ width: '100%', height: 220, marginTop: '16px' }}>
      <ResponsiveContainer>
        <AreaChart
          data={revenueData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }} 
            itemStyle={{ color: 'var(--text-primary)' }}
          />
          <Area type="monotone" dataKey="revenue" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const workforceData = [
  { name: 'Present', value: 128 },
  { name: 'Absent', value: 12 },
  { name: 'On Leave', value: 2 },
];

export function WorkforceDonutChart() {
  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={workforceData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {workforceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }}
            itemStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

const projectData = [
  { name: 'Skyline', complete: 45, pending: 55 },
  { name: 'Ocean', complete: 80, pending: 20 },
  { name: 'Metro', complete: 15, pending: 85 },
];

export function ProjectStatusChart() {
  return (
    <div style={{ width: '100%', height: 200, marginTop: '8px' }}>
      <ResponsiveContainer>
        <BarChart
          data={projectData}
          layout="vertical"
          margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
             contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
             cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Bar dataKey="complete" stackId="a" fill="var(--accent-primary)" radius={[4, 0, 0, 4]} />
          <Bar dataKey="pending" stackId="a" fill="rgba(255,255,255,0.05)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
