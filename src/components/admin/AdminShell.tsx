"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useDashboard } from "@/lib/DashboardContext";
import { getNotificationHref } from "@/lib/userFlow";
import { formatShortDateID } from "@/lib/userDashboardData";
import styles from "@/components/dashboard/DashboardShell.module.css";

export interface AdminNavItem {
  label: string;
  href: string;
}

interface AdminShellProps {
  navItems: AdminNavItem[];
  children: React.ReactNode;
}

function getAdminNavIcon(label: string) {
  if (label.includes("Ringkasan")) {
    return (
      <path
        d="M4 6.5C4 5.12 5.12 4 6.5 4h11C18.88 4 20 5.12 20 6.5v11C20 18.88 18.88 20 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Zm3 1.5h10M7 12h10M7 16h6"
        fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      />
    );
  }
  if (label.includes("Booking")) {
    return (
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 17.5v-11Zm3 1.5h8M8 12h8M8 16h5"
        fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      />
    );
  }
  if (label.includes("Dokumen")) {
    return (
      <path
        d="M8 4h6l4 4v9.5A2.5 2.5 0 0 1 15.5 20h-7A2.5 2.5 0 0 1 6 17.5v-11A2.5 2.5 0 0 1 8.5 4H8Zm6 0v4h4M9 13h6M9 16h4"
        fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      />
    );
  }
  if (label.includes("Sekolah")) {
    return (
      <path
        d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01"
        fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      />
    );
  }
  return (
    <path
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.5 8a6.5 6.5 0 0 1 13 0"
      fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
    />
  );
}

function AdminNotificationBell() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useDashboard();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const recent = notifications.slice(0, 5);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Notifikasi"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8deeb] bg-white text-[#4f5b77] transition-colors hover:bg-[#f3f1f6] hover:text-[#25365f]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#b86b63] text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[340px] rounded-[20px] border border-[#e1dce8] bg-white shadow-[0_24px_48px_-28px_rgba(37,54,95,0.45)]">
          <div className="flex items-center justify-between border-b border-[#e1dce8] px-4 py-3">
            <span className="text-[13px] font-bold text-[#25365f]">Notifikasi</span>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllNotificationsRead} className="text-[11px] font-bold text-[#9b6a1d] hover:text-[#7f5514]">
                Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {recent.length > 0 ? recent.map((notif) => (
              <button
                key={notif.id}
                type="button"
                onClick={() => {
                  const href = getNotificationHref("admin", notif);
                  void markNotificationRead(notif.id);
                  setOpen(false);
                  if (href) {
                    router.push(href);
                  }
                }}
                className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-[#f5f3f7] ${!notif.isRead ? "bg-[#faf6ef]" : ""}`}
              >
                <div className="flex items-center gap-2">
                  {!notif.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-[#d2ac50]" />}
                  <span className="text-[13px] font-bold text-[#25365f]">{notif.title}</span>
                </div>
                <span className="text-[12px] leading-[1.5] text-[#6d7998] pl-4">{notif.message}</span>
                <span className="text-[10px] font-semibold text-[#a3adc2] pl-4">{formatShortDateID(notif.createdAt)}</span>
              </button>
            )) : (
              <div className="px-4 py-8 text-center text-[13px] text-[#6d7998]">Tidak ada notifikasi.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminShell({ navItems, children }: AdminShellProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { addToast } = useDashboard();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const activeNav = [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
      window.location.replace("/login");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Logout gagal. Coba lagi.";
      addToast(message, "error");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandWrap}>
          <Link className={styles.brand} href="/">
            <div className={styles.logoFrame}>
              <Image src="/assets/logo.png" alt="masiang logo" width={128} height={114} priority />
            </div>
            <div className={styles.brandMeta}>
              <span className={styles.brandEyebrow}>Panel Admin</span>
              <span className={styles.brandCaption}>Kelola booking, review dokumen, dan pantau sekolah binaan.</span>
            </div>
          </Link>
        </div>

        <nav className={styles.nav} aria-label="Admin navigation">
          {navItems.map((item) => {
            const isActive = activeNav?.href === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                <span className={styles.navIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">{getAdminNavIcon(item.label)}</svg>
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.accountCard}>
            <p className={styles.accountName}>Admin MASIANG</p>
            <p className={styles.accountMeta}>Pengawas / Pembicara</p>
          </div>
          <button type="button" onClick={handleLogout} className={styles.logout} aria-label="Logout" disabled={isLoggingOut}>
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v-2H5V5h5V3Zm4.59 4.41L13.17 8.83 15.34 11H8v2h7.34l-2.17 2.17 1.42 1.42L19.17 12l-4.58-4.59Z" fill="currentColor" />
            </svg>
            <span>{isLoggingOut ? "Keluar..." : "Logout"}</span>
          </button>
        </div>
      </aside>

      <div className={styles.mainWrap}>
        <header className={styles.topbar}>
          <div className={styles.topbarCopy}>
            <p className={styles.topbarEyebrow}>Panel Admin</p>
            <h1>{activeNav?.label ?? "Dashboard"}</h1>
          </div>
          <div className={styles.topbarRight}>
            <AdminNotificationBell />
            <div className={styles.topbarAccount}>
              <p>Admin MASIANG</p>
              <span>Pengawas</span>
            </div>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
