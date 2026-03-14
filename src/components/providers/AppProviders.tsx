"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/AuthContext";
import { DashboardProvider } from "@/lib/DashboardContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DashboardProvider>{children}</DashboardProvider>
    </AuthProvider>
  );
}
