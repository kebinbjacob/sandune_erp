import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SanDune CRM",
  description: "A modern, premium CRM experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Sidebar />
        <div style={{ marginLeft: "280px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Navbar />
          <main style={{ padding: "32px", flex: 1 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
