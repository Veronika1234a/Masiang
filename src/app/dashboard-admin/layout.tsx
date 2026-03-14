"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { ToastContainer } from "@/components/ui/Toast";

const adminNavItems = [
  { label: "Ringkasan", href: "/dashboard-admin" },
  { label: "Kelola Booking", href: "/dashboard-admin/booking" },
  { label: "Review Dokumen", href: "/dashboard-admin/dokumen" },
  { label: "Daftar Sekolah", href: "/dashboard-admin/sekolah" },
];

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRole="admin">
      <AdminShell navItems={adminNavItems}>
        {children}
      </AdminShell>
      <ToastContainer />
    </AuthGuard>
  );
}
