"use client";

import Link from "next/link";
import { useDashboard } from "@/lib/DashboardContext";
import {
  ALL_STAGES,
  formatLongDateID,
  formatMediumDateID,
  getBookingSummary,
  getDateDiffFromToday,
  getNextBooking,
  REQUIRED_DOCUMENTS,
  type DocumentStage,
} from "@/lib/userDashboardData";
import { useMemo } from "react";

function pctForStage(stage: DocumentStage, progress: ReturnType<typeof useDashboard>["progress"]): number {
  if (stage === "Melayani") return progress.melayaniPct;
  if (stage === "Adaptif") return progress.adaptifPct;
  if (stage === "Pelaksanaan") return progress.pelaksanaanPct;
  return progress.laporanPct;
}

function AlertDot({ tone }: { tone: "warning" | "info" | "success" }) {
  const color = tone === "warning" ? "bg-[#f59e0b]" : tone === "success" ? "bg-[#10b981]" : "bg-[#3b82f6]";
  return <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />;
}

export default function DashboardRingkasanPage() {
  const { bookings, documents, histories, progress, notifications, profile, dashboardLoading } = useDashboard();

  const summary = getBookingSummary(bookings);
  const nextBooking = getNextBooking(bookings);

  const stageIndex = ALL_STAGES.indexOf(progress.currentStage);
  const stageNumber = stageIndex + 1;

  const stats = [
    { label: "Total Booking", value: String(summary.total), accent: "text-[#25365f]" },
    { label: "Disetujui", value: String(summary.approved), accent: "text-[#059669]" },
    { label: "Dalam Proses", value: String(summary.progress), accent: "text-[#2563eb]" },
    { label: "Menunggu", value: String(summary.pending), accent: "text-[#d97706]" },
  ];

  const alerts = useMemo(() => {
    const items: Array<{ text: string; tone: "warning" | "info" | "success" }> = [];

    const missingDocs = REQUIRED_DOCUMENTS[progress.currentStage].filter(
      (reqName) => !documents.some(
        (doc) => doc.stage === progress.currentStage && doc.fileName.toLowerCase().includes(reqName.toLowerCase()),
      ),
    );
    if (missingDocs.length > 0) {
      items.push({
        text: `${missingDocs.length} dokumen belum diupload di tahap ${progress.currentStage}.`,
        tone: "warning",
      });
    }

    const pendingFollowUps = histories.filter(
      (h) => h.followUpISO && !h.followUpDone && getDateDiffFromToday(h.followUpISO) <= 3,
    );
    for (const h of pendingFollowUps) {
      const diff = getDateDiffFromToday(h.followUpISO!);
      const label = diff < 0 ? "terlewat" : diff === 0 ? "hari ini" : diff === 1 ? "besok" : `${diff} hari lagi`;
      items.push({
        text: `Tindak lanjut ${h.id} jatuh tempo ${label}.`,
        tone: diff <= 0 ? "warning" : "info",
      });
    }

    const docsNeedRevision = documents.filter((d) => d.reviewStatus === "Perlu Revisi");
    if (docsNeedRevision.length > 0) {
      items.push({
        text: `${docsNeedRevision.length} dokumen perlu direvisi.`,
        tone: "warning",
      });
    }

    const unreadNotifs = notifications.filter((n) => !n.isRead).length;
    if (unreadNotifs > 0) {
      items.push({ text: `${unreadNotifs} notifikasi belum dibaca.`, tone: "info" });
    }

    return items;
  }, [documents, histories, notifications, progress.currentStage]);

  const recentHistories = histories.slice(0, 2);

  if (dashboardLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#e1dce8] border-t-[#25365f]" />
          <p className="text-sm text-[#6d7998]">Memuat data dashboard...</p>
        </div>
      </main>
    );
  }

  const quickActions = [
    { label: "Booking Baru", href: "/dashboard/booking-baru", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    )},
    { label: "Upload Dokumen", href: "/dashboard/dokumen", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
    )},
    { label: "Lihat Jadwal", href: "/dashboard/booking-jadwal", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
    )},
    { label: "Riwayat", href: "/dashboard/riwayat", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    )},
  ];

  return (
    <main className="w-full pb-10 text-[#121d35]">
      <div className="mx-auto max-w-[1100px]">

        <nav className="mb-6 text-[12px] font-bold text-[#6d7998]">
          <span className="text-[#25365f]">Ringkasan</span>
        </nav>

        <header className="mb-10">
          <h1 className="m-0 font-[family-name:var(--font-fraunces)] text-[clamp(28px,3.5vw,42px)] font-bold leading-[1.15] text-[#121d35]">
            Halo, {profile.schoolName}.
          </h1>
          <p className="mt-3 max-w-[540px] text-[15px] leading-[1.65] text-[#4f5b77]">
            Pantau perkembangan sesi dan kelola jadwal pendampingan sekolah Anda.
          </p>
        </header>

        {/* ─── QUICK ACTIONS + ALERTS (side by side) ─── */}
        <div className={`mb-10 grid gap-4 ${alerts.length > 0 ? "lg:grid-cols-[1fr_320px]" : ""}`}>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 self-start">
            {quickActions.map((qa) => (
              <Link
                key={qa.label}
                href={qa.href}
                className="group flex items-center gap-3 rounded-2xl border border-[#e1dce8] bg-white px-4 py-3.5 transition-all hover:border-[#c5cee0] hover:shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3f2f8] text-[#4a6baf] transition-colors group-hover:bg-[#e8e4f0] group-hover:text-[#25365f]">
                  {qa.icon}
                </div>
                <span className="text-[12px] font-bold text-[#4f5b77] group-hover:text-[#25365f]">{qa.label}</span>
              </Link>
            ))}
          </section>

          {alerts.length > 0 && (
            <aside className="rounded-2xl border border-[#e1dce8] bg-white p-5 self-start">
              <div className="mb-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6d7998]">Perlu Perhatian</span>
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f59e0b] px-1.5 text-[10px] font-bold text-white">{alerts.length}</span>
              </div>
              <ul className="flex flex-col gap-0">
                {alerts.map((alert, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-2.5 py-2.5 text-[12px] leading-[1.5] text-[#4f5b77] ${i > 0 ? "border-t border-[#f3f1f5]" : ""}`}
                  >
                    <AlertDot tone={alert.tone} />
                    <span>{alert.text}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>

        {/* ─── STATUS TAHAPAN ─── */}
        <section className="mb-12">
          <div className="mb-6 flex items-end justify-between border-b border-[#e1dce8] pb-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">
              Status Tahapan Saat Ini
            </h2>
          </div>

          <div className="rounded-2xl border border-[#e1dce8] bg-white p-6 shadow-[0_4px_20px_-8px_rgba(20,30,50,0.06)] md:p-8 lg:p-10">
            <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <span className="mb-3 inline-block rounded-lg border border-[#e8dec1] bg-[#fff8ed] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#ad7a2c]">
                  TAHAP {stageNumber} DARI 4
                </span>
                <h3 className="m-0 font-[family-name:var(--font-fraunces)] text-[clamp(28px,4vw,48px)] font-bold tracking-tight text-[#121d35] leading-[1.1]">
                  {progress.currentStage}.
                </h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-[#4f5b77]">
                  {pctForStage(progress.currentStage, progress) < 100
                    ? <>Tahap <strong className="font-semibold text-[#25365f]">{progress.currentStage}</strong> sedang berjalan. Kelengkapan dokumen: <strong className="font-semibold text-[#25365f]">{pctForStage(progress.currentStage, progress)}%</strong>.</>
                    : <>Semua dokumen di tahap <strong className="font-semibold text-[#25365f]">{progress.currentStage}</strong> sudah lengkap.</>
                  }
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col">
                {nextBooking && (
                  <Link
                    href={`/dashboard/booking/${nextBooking.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-6 py-3 text-center text-[12px] font-bold uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-[#b8933d] hover:shadow-md"
                  >
                    Detail Sesi Ini
                  </Link>
                )}
                <Link
                  href="/dashboard/dokumen"
                  className="inline-flex items-center justify-center rounded-xl border border-[#cfd5e6] bg-[#f9f8fc] px-6 py-3 text-center text-[12px] font-bold uppercase tracking-widest text-[#4f5b77] transition-colors hover:bg-[#eef1f8] hover:text-[#25365f]"
                >
                  Upload Dokumen
                </Link>
              </div>
            </div>

            {/* Stepper */}
            <div className="relative pt-4">
              <div className="absolute left-[5%] right-[5%] top-8 h-[2px] bg-[#f0eef4]" />
              <div
                className="absolute left-[5%] top-8 h-[2px] bg-[#d4a95c] transition-all duration-500"
                style={{ width: `${Math.max(0, (stageIndex / 3) * 90)}%` }}
              />

              <div className="relative flex justify-between">
                {ALL_STAGES.map((step, idx) => {
                  const isDone = idx < stageIndex;
                  const isActive = idx === stageIndex;
                  const pct = pctForStage(step, progress);

                  return (
                    <div key={step} className="flex flex-col items-center gap-2.5 bg-white px-2">
                      <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border-[3px] transition-colors ${
                        isDone ? "border-[#25365f] bg-[#25365f]" :
                        isActive ? "border-[#d4a95c] bg-white ring-4 ring-[#fff8ed]" :
                        "border-[#e1dce8] bg-[#fbfaf8]"
                      }`}>
                        {isDone && (
                          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {isActive && <div className="h-2 w-2 rounded-full bg-[#ad7a2c]" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-[0.1em] md:text-[11px] ${
                        isDone || isActive ? "text-[#121d35]" : "text-[#a3adc2]"
                      }`}>
                        {step}
                      </span>
                      <span className={`text-[10px] font-semibold ${pct === 100 ? "text-[#059669]" : "text-[#6d7998]"}`}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECONDARY INFO GRID ─── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">

          <section className="flex flex-col">
            <h2 className="mb-5 border-b border-[#e1dce8] pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">
              Jadwal Mendatang
            </h2>
            <div className="rounded-2xl border border-[#e1dce8] bg-white p-6 shadow-sm lg:p-7">
              <div className="mb-3 inline-block rounded-lg bg-[#f3f2f8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#4a5f8e]">
                {nextBooking?.status ?? "Belum Ada Jadwal"}
              </div>
              <h3 className="m-0 font-[family-name:var(--font-fraunces)] text-[clamp(18px,2vw,24px)] font-bold text-[#121d35]">
                {nextBooking ? formatLongDateID(nextBooking.dateISO) : "Belum ada booking aktif"}
              </h3>
              <div className="mt-5 flex flex-col gap-3 border-l-2 border-[#e8e4f0] pl-4 text-[14px]">
                <div>
                  <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#6d7998]">Waktu</span>
                  <span className="font-semibold text-[#25365f]">{nextBooking?.session ?? "-"}</span>
                </div>
                <div>
                  <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#6d7998]">Topik</span>
                  <span className="font-semibold text-[#25365f]">{nextBooking?.topic ?? "-"}</span>
                </div>
                {nextBooking?.category && (
                  <div>
                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-[#6d7998]">Kategori</span>
                    <span className="font-semibold text-[#25365f]">{nextBooking.category}</span>
                  </div>
                )}
              </div>
              <div className="mt-6 border-t border-[#f0eef4] pt-4">
                <Link
                  href="/dashboard/booking-jadwal"
                  className="text-[12px] font-bold uppercase tracking-wide text-[#4a5f8e] transition-colors hover:text-[#121d35]"
                >
                  Buka Kalender &rarr;
                </Link>
              </div>
            </div>
          </section>

          <section className="flex flex-col">
            <h2 className="mb-5 border-b border-[#e1dce8] pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">
              Ringkasan Aktivitas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((item, idx) => (
                <div
                  key={item.label}
                  className={`flex flex-col justify-between rounded-2xl border border-[#e1dce8] bg-white p-5 transition-all hover:border-[#cfd5e6] hover:shadow-sm ${idx === 0 ? "col-span-2" : ""}`}
                >
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#6d7998]">{item.label}</p>
                  <h4 className={`m-0 font-[family-name:var(--font-fraunces)] text-[28px] font-bold ${item.accent}`}>{item.value}</h4>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ─── RIWAYAT TERAKHIR ─── */}
        {recentHistories.length > 0 && (
          <section className="mt-10">
            <div className="mb-5 flex items-end justify-between border-b border-[#e1dce8] pb-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">
                Riwayat Terakhir
              </h2>
              <Link
                href="/dashboard/riwayat"
                className="text-[12px] font-bold uppercase tracking-wide text-[#4a5f8e] transition-colors hover:text-[#121d35]"
              >
                Lihat Semua &rarr;
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {recentHistories.map((h) => (
                <Link
                  key={h.id}
                  href={`/dashboard/riwayat/${h.id}`}
                  className="group block rounded-2xl border border-[#e1dce8] bg-white p-5 transition-all hover:border-[#cfd5e6] hover:shadow-md"
                >
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">{h.id}</span>
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      h.status === "Selesai" ? "bg-[#ecfdf5] text-[#059669]" :
                      h.status === "Laporan" ? "bg-[#eff6ff] text-[#2563eb]" :
                      "bg-[#fffbeb] text-[#d97706]"
                    }`}>
                      {h.status}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-bold leading-[1.35] text-[#25365f] group-hover:text-[#121d35]">{h.title}</h3>
                  <p className="mt-2 text-[12px] text-[#6d7998]">{formatMediumDateID(h.dateISO)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
