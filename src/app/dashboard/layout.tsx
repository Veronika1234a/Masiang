"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ToastContainer } from "@/components/ui/Toast";

const navItems = [
  { label: "Ringkasan", href: "/dashboard/ringkasan" },
  { label: "Booking Jadwal", href: "/dashboard/booking-jadwal" },
  { label: "Booking", href: "/dashboard/booking" },
  { label: "Dokumen", href: "/dashboard/dokumen" },
  { label: "Riwayat", href: "/dashboard/riwayat" },
  { label: "Profil", href: "/dashboard/profil" },
];

export default function UserDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRole="school">
      <DashboardShell
        brandLogoSrc="/assets/logo.png"
        brandName="masiang"
        areaLabel="Ringkasan"
        navItems={navItems}
        action={{ label: "+ Booking Baru", href: "/dashboard/booking-baru" }}
      >
        {children}
      </DashboardShell>
      <ToastContainer />
    </AuthGuard>
  );
}
