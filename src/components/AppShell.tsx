"use client";

import { usePathname } from 'next/navigation';
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { AIChatWidget } from "./ai/AIChatWidget";
import { AuthProvider } from "@/lib/context/AuthContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

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
      <Sidebar />
      <div style={{ marginLeft: "280px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />
        <main style={{ padding: "32px", flex: 1 }}>
          {children}
        </main>
      </div>
      <AIChatWidget />
    </AuthProvider>
  );
}
