"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthContext";
import { useDashboard } from "@/lib/DashboardContext";
import { getNotificationHref } from "@/lib/userFlow";
import { formatShortDateID } from "@/lib/userDashboardData";
import styles from "./DashboardShell.module.css";

export interface DashboardNavItem {
  label: string;
  href: string;
}

interface DashboardAction {
  label: string;
  href: string;
}

interface DashboardShellProps {
  brandLogoSrc: string;
  brandName: string;
  areaLabel: string;
  navItems: DashboardNavItem[];
  action?: DashboardAction;
  children: React.ReactNode;
}

function getNavIcon(label: string) {
  if (label.includes("Ringkasan")) {
    return (<path d="M4 6.5C4 5.12 5.12 4 6.5 4h11C18.88 4 20 5.12 20 6.5v11C20 18.88 18.88 20 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Zm3 1.5h10M7 12h10M7 16h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />);
  }
  if (label.includes("Jadwal")) {
    return (<path d="M7 4v3M17 4v3M5.5 7h13A1.5 1.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9A1.5 1.5 0 0 1 5.5 7Zm0 4h13M8 14h3M13 14h3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />);
  }
  if (label.includes("Booking")) {
    return (<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 17.5v-11Zm3 1.5h8M8 12h8M8 16h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />);
  }
  if (label.includes("Dokumen")) {
    return (<path d="M8 4h6l4 4v9.5A2.5 2.5 0 0 1 15.5 20h-7A2.5 2.5 0 0 1 6 17.5v-11A2.5 2.5 0 0 1 8.5 4H8Zm6 0v4h4M9 13h6M9 16h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />);
  }
  if (label.includes("Riwayat")) {
    return (<path d="M5 11a7 7 0 1 1 2.05 4.95M5 11H2.75M5 11V7.75M12 8.5v3.25l2.5 1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />);
  }
  return (<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.5 8a6.5 6.5 0 0 1 13 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />);
}

function getNotifIcon(type: string) {
  if (type === "booking_approved" || type === "stage_advanced")
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  if (type === "booking_started")
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M10 8l6 4-6 4V8Z" fill="#2563eb" stroke="none" />
      </svg>
    );
  if (type === "booking_rejected" || type === "booking_cancelled")
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    );
  if (type.startsWith("doc"))
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    );
  if (type === "follow_up_reminder")
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  if (type === "booking_completed")
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a6baf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function getNotifIconBg(type: string) {
  if (type === "booking_approved" || type === "stage_advanced") return "bg-[#ecfdf5]";
  if (type === "booking_started") return "bg-[#eff6ff]";
  if (type === "booking_rejected" || type === "booking_cancelled") return "bg-[#fef2f2]";
  if (type.startsWith("doc")) return "bg-[#eff6ff]";
  if (type === "follow_up_reminder") return "bg-[#fffbeb]";
  if (type === "booking_completed") return "bg-[#f5f3ff]";
  return "bg-[#f0f4ff]";
}

function NotificationBell() {
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

  const recent = notifications.slice(0, 6);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Notifikasi"
        className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8deeb] bg-white text-[#4f5b77] transition-all hover:border-[#c5cee0] hover:bg-[#f0f3fa] hover:text-[#25365f] hover:shadow-sm"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#dc2626] px-1 text-[10px] font-bold leading-none text-white shadow-[0_2px_6px_rgba(220,38,38,0.4)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[380px] overflow-hidden rounded-2xl border border-[#e1dce8] bg-white shadow-[0_16px_48px_-12px_rgba(20,30,50,0.18)]">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#f9f8fc] to-white px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="text-[14px] font-bold text-[#25365f]">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#dc2626] px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-[#4a6baf] transition-colors hover:bg-[#eef1f8] hover:text-[#25365f]"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {recent.length > 0 ? recent.map((notif, idx) => (
              <button
                key={notif.id}
                type="button"
                onClick={() => {
                  const href = getNotificationHref("school", notif);
                  void markNotificationRead(notif.id);
                  setOpen(false);
                  if (href) {
                    router.push(href);
                  }
                }}
                className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#f7f6fa] ${
                  !notif.isRead ? "bg-[#faf8ff]" : ""
                } ${idx > 0 ? "border-t border-[#f3f1f5]" : ""}`}
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getNotifIconBg(notif.type)}`}>
                  {getNotifIcon(notif.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-bold text-[#25365f]">{notif.title}</span>
                    {!notif.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4a6baf]" />}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-[1.5] text-[#6d7998] line-clamp-2">{notif.message}</p>
                  <span className="mt-1 block text-[10px] font-semibold text-[#a3adc2]">{formatShortDateID(notif.createdAt)}</span>
                </div>
              </button>
            )) : (
              <div className="flex flex-col items-center gap-2 px-5 py-12">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c5cee0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p className="text-[13px] font-medium text-[#a3adc2]">Belum ada notifikasi</p>
              </div>
            )}
          </div>

          {notifications.length > 6 && (
            <div className="border-t border-[#e1dce8] px-5 py-2.5 text-center">
              <span className="text-[11px] font-bold text-[#6d7998]">
                {notifications.length - 6} notifikasi lainnya
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DashboardShell({
  brandLogoSrc,
  brandName,
  areaLabel,
  navItems,
  action,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { profile, addToast } = useDashboard();
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
              <Image src={brandLogoSrc} alt={`${brandName} logo`} width={128} height={114} priority />
            </div>
            <div className={styles.brandMeta}>
              <span className={styles.brandEyebrow}>Platform Pendampingan</span>
              <span className={styles.brandCaption}>Dashboard sekolah untuk kelola booking, dokumen, dan arsip.</span>
            </div>
          </Link>
        </div>

        <nav className={styles.nav} aria-label={`${areaLabel} navigation`}>
          {navItems.map((item) => {
            const isActive = activeNav?.href === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                <span className={styles.navIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">{getNavIcon(item.label)}</svg>
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.accountCard}>
            <p className={styles.accountName}>{profile.schoolName}</p>
            <p className={styles.accountMeta}>{profile.district}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={styles.logout}
            aria-label="Logout"
            disabled={isLoggingOut}
          >
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
            <p className={styles.topbarEyebrow}>Dashboard Sekolah</p>
            <h1>{activeNav?.label ?? areaLabel}</h1>
          </div>
          <div className={styles.topbarRight}>
            <NotificationBell />
            {action ? (
              <Button href={action.href} variant="primary" size="md">
                {action.label}
              </Button>
            ) : null}
            <div className={styles.topbarAccount}>
              <p>{profile.schoolName}</p>
              <span>{profile.district}</span>
            </div>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
