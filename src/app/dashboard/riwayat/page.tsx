"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardDataState } from "@/components/dashboard/DashboardDataState";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/lib/DashboardContext";
import {
  formatMediumDateID,
  getDateDiffFromToday,
  type RiwayatStatus,
} from "@/lib/userDashboardData";

type SortOption = "date-desc" | "date-asc" | "status";
const ITEMS_PER_PAGE = 5;

function getStatusClasses(status: RiwayatStatus) {
  if (status === "Selesai") return "bg-[#d8eef0] text-[#2d7480]";
  if (status === "Laporan") return "bg-[#dce7fb] text-[#496b9f]";
  return "bg-[#fff2de] text-[#ad7a2c]";
}

function getFollowUpReminder(dateISO?: string): { label: string; tone: "danger" | "warning" | "info" } | null {
  if (!dateISO) return null;
  const diff = getDateDiffFromToday(dateISO);
  if (diff < 0) return { label: "Follow-up Terlewat", tone: "danger" };
  if (diff === 0) return { label: "Follow-up Hari Ini", tone: "danger" };
  if (diff === 1) return { label: "Follow-up Besok", tone: "warning" };
  if (diff <= 3) return { label: `Follow-up ${diff} hari lagi`, tone: "warning" };
  return null;
}

function getReminderClasses(tone: "danger" | "warning" | "info") {
  if (tone === "danger") return "border-[#f0b8b8] bg-[#ffe9e9] text-[#812f2f]";
  if (tone === "warning") return "border-[#f1d9a8] bg-[#fff7e8] text-[#ad7a2c]";
  return "border-[#d5dff0] bg-[#eef3ff] text-[#2d4a7a]";
}

export default function DashboardRiwayatPage() {
  const { histories } = useDashboard();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<RiwayatStatus | "Semua">("Semua");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredHistories = useMemo(() => {
    const nk = keyword.trim().toLowerCase();
    const filtered = histories.filter((item) => {
      const matchKey = nk.length === 0 || item.title.toLowerCase().includes(nk) || item.description.toLowerCase().includes(nk) || item.id.toLowerCase().includes(nk);
      const matchStatus = statusFilter === "Semua" || item.status === statusFilter;
      const matchDate = !dateFilter || item.dateISO === dateFilter;
      return matchKey && matchStatus && matchDate;
    });
    filtered.sort((a, b) => {
      if (sortBy === "date-asc") return a.dateISO.localeCompare(b.dateISO);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return b.dateISO.localeCompare(a.dateISO);
    });
    return filtered;
  }, [dateFilter, histories, keyword, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHistories.length / ITEMS_PER_PAGE));
  const paginated = filteredHistories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const resetFilters = () => { setKeyword(""); setStatusFilter("Semua"); setDateFilter(""); setCurrentPage(1); };

  return (
    <main className="w-full pb-10 text-[#121d35]">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-8">
        <nav className="text-[12px] font-bold text-[#6d7998]">
          <span className="text-[#25365f]">Riwayat</span>
        </nav>
        <header className="max-w-2xl">
          <h1 className="m-0 font-[var(--font-fraunces)] text-[clamp(28px,3vw,42px)] font-medium leading-[1.2] text-[#121d35]">Riwayat Pendampingan</h1>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#313f61]">Arsip sesi yang sudah berjalan, lengkap dengan keluaran dokumen dan tindak lanjut.</p>
        </header>

        <section className="rounded-2xl border border-[#e1dce8] bg-[#f9f8fc] p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid gap-4 md:grid-cols-4 xl:flex-1">
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d7998]">Kata Kunci</span>
                <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }} placeholder="Cari judul, deskripsi, atau ID" className="min-h-11 rounded-xl border border-[#d7deef] bg-white px-3 text-[14px] text-[#313f61] outline-none focus:border-[#b7c4df]" />
              </label>
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d7998]">Status</span>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as RiwayatStatus | "Semua"); setCurrentPage(1); }} className="min-h-11 rounded-xl border border-[#d7deef] bg-white px-3 text-[14px] text-[#313f61] outline-none focus:border-[#b7c4df]">
                  <option value="Semua">Semua</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Laporan">Laporan</option>
                  <option value="Tindak Lanjut">Tindak Lanjut</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d7998]">Tanggal</span>
                <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className="min-h-11 rounded-xl border border-[#d7deef] bg-white px-3 text-[14px] text-[#313f61] outline-none focus:border-[#b7c4df]" />
              </label>
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d7998]">Urutkan</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="min-h-11 rounded-xl border border-[#d7deef] bg-white px-3 text-[14px] text-[#313f61] outline-none focus:border-[#b7c4df]">
                  <option value="date-desc">Terbaru</option>
                  <option value="date-asc">Terlama</option>
                  <option value="status">Status</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button href="/dashboard/booking" variant="outline" size="md">Kembali ke Booking</Button>
              <Button variant="ghost" size="md" onClick={resetFilters}>Reset</Button>
            </div>
          </div>
        </section>

        {filteredHistories.length === 0 ? (
          <DashboardDataState variant="empty" />
        ) : (
          <>
            <section className="flex flex-col gap-4">
              {paginated.map((item) => {
                const reminder = getFollowUpReminder(item.followUpISO);
                const followUpProgress = item.followUpItems
                  ? `${item.followUpItems.filter((fi) => fi.done).length}/${item.followUpItems.length}`
                  : null;

                return (
                  <article key={item.id} className="rounded-2xl border border-[#e1dce8] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cfd5e6] hover:shadow-md">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">{item.id}</span>
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusClasses(item.status)}`}>{item.status}</span>
                          {reminder && <span className={`inline-flex rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase ${getReminderClasses(reminder.tone)}`}>{reminder.label}</span>}
                          {item.followUpDone && <span className="inline-flex rounded-md bg-[#d9e7df] px-2.5 py-1 text-[10px] font-bold uppercase text-[#205930]">Tindak Lanjut Selesai</span>}
                        </div>
                        <h2 className="mt-3 font-[var(--font-fraunces)] text-[clamp(22px,2vw,30px)] font-medium leading-[1.2] text-[#121d35]">{item.title}</h2>
                        <p className="mt-3 max-w-3xl text-[14px] leading-[1.6] text-[#4f5b77]">{item.description}</p>
                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Tanggal Sesi</p>
                            <p className="mt-1 text-[14px] font-semibold text-[#25365f]">{formatMediumDateID(item.dateISO)}</p>
                          </div>
                          {item.bookingId && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Booking</p>
                              <Link href={`/dashboard/booking/${item.bookingId}`} className="mt-1 text-[14px] font-semibold text-[#4a6baf] hover:text-[#25365f]">{item.bookingId}</Link>
                            </div>
                          )}
                          {followUpProgress && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Tindak Lanjut</p>
                              <p className="mt-1 text-[14px] font-semibold text-[#25365f]">{followUpProgress} selesai</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex w-full flex-col gap-2 xl:w-[220px]">
                        <Link href={`/dashboard/riwayat/${item.id}`} className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-center text-[12px] font-bold uppercase text-white hover:-translate-y-0.5 hover:bg-[#b8933d] hover:shadow-md transition-all">Lihat Detail</Link>
                        <Link href="/dashboard/booking-jadwal" className="rounded-xl border border-[#cfd5e6] bg-[#f9f8fc] px-4 py-3 text-center text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]">Buka Kalender</Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} className="rounded-lg border border-[#d8deeb] bg-white px-3 py-2 text-[12px] font-bold text-[#4f5b77] disabled:opacity-40 hover:bg-[#eef1f8]">Sebelumnya</button>
                <span className="text-[13px] font-semibold text-[#6d7998]">Halaman {currentPage} dari {totalPages}</span>
                <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="rounded-lg border border-[#d8deeb] bg-white px-3 py-2 text-[12px] font-bold text-[#4f5b77] disabled:opacity-40 hover:bg-[#eef1f8]">Berikutnya</button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
