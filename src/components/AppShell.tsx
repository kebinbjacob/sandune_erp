"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { AIChatWidget } from "./ai/AIChatWidget";
import { AuthProvider } from "@/lib/context/AuthContext";
import styles from './AppShell.module.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoginPage) {
    return (
      <AuthProvider>
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {children}
        </main>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className={styles.mainWrapper}>
        <Navbar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
      <AIChatWidget />
    </AuthProvider>
  );
}
