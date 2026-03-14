"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardDataState } from "@/components/dashboard/DashboardDataState";
import { Modal } from "@/components/ui/Modal";
import { useDashboard } from "@/lib/DashboardContext";
import {
  formatLongDateID,
  getBookingReminder,
  getBookingSummary,
  type BookingItem,
  type BookingStatus,
} from "@/lib/userDashboardData";

type SortOption = "date-desc" | "date-asc" | "status";
const ITEMS_PER_PAGE = 5;

function getStatusClasses(status: BookingStatus) {
  if (status === "Disetujui") return "bg-[#d8eef0] text-[#2d7480]";
  if (status === "Dalam Proses") return "bg-[#fff2de] text-[#ad7a2c]";
  if (status === "Selesai") return "bg-[#d9e7df] text-[#205930]";
  if (status === "Ditolak") return "bg-[#ffe9e9] text-[#812f2f]";
  if (status === "Dibatalkan") return "bg-[#f0eef2] text-[#6d7998]";
  return "bg-[#dce7fb] text-[#496b9f]";
}

function getActiveStage(booking: BookingItem) {
  return (
    booking.timeline.find((item) => item.status === "active")?.title ??
    booking.timeline.at(-1)?.title ??
    "Menunggu pembaruan"
  );
}

const ALL_STATUSES: Array<BookingStatus | "Semua"> = [
  "Semua", "Menunggu", "Disetujui", "Dalam Proses", "Selesai", "Ditolak", "Dibatalkan",
];

export default function DashboardBookingPage() {
  const { bookings, cancelBooking } = useDashboard();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "Semua">("Semua");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(bookings[0]?.id ?? null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const filteredBookings = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    const filtered = bookings.filter((booking) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        booking.school.toLowerCase().includes(normalizedKeyword) ||
        booking.topic.toLowerCase().includes(normalizedKeyword) ||
        booking.id.toLowerCase().includes(normalizedKeyword);
      const matchesStatus = statusFilter === "Semua" || booking.status === statusFilter;
      const matchesDate = !dateFilter || booking.dateISO === dateFilter;
      return matchesKeyword && matchesStatus && matchesDate;
    });

    filtered.sort((a, b) => {
      if (sortBy === "date-asc") return a.dateISO.localeCompare(b.dateISO);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return b.dateISO.localeCompare(a.dateISO);
    });

    return filtered;
  }, [bookings, dateFilter, keyword, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const summary = useMemo(() => getBookingSummary(bookings), [bookings]);
  const selectedBooking =
    filteredBookings.find((item) => item.id === selectedBookingId) ??
    filteredBookings[0] ?? null;

  const selectedReminder = selectedBooking ? getBookingReminder(selectedBooking.dateISO) : null;

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter("Semua");
    setDateFilter("");
    setCurrentPage(1);
  };

  const openCancelModal = (id: string) => {
    setCancelTargetId(id);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const confirmCancel = () => {
    if (cancelTargetId && cancelReason.trim()) {
      void (async () => {
        try {
          await cancelBooking(cancelTargetId, cancelReason.trim());
          setCancelModalOpen(false);
          setCancelTargetId(null);
          setCancelReason("");
        } catch {
          // Error toast is handled in context.
        }
      })();
    }
  };

  return (
    <main className="w-full pb-12 text-[#121d35]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
        <nav className="text-[12px] font-bold text-[#6d7998]">
          <span className="text-[#25365f]">Booking</span>
        </nav>
        <header className="grid gap-8 border-b border-[#e5dfeb] pb-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">Booking Desk</p>
            <h1 className="mt-4 font-[var(--font-fraunces)] text-[clamp(36px,4vw,56px)] font-medium leading-[0.98] tracking-[-0.03em] text-[#121d35]">
              Booking pendampingan,<br />dibaca dengan tenang.
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-[1.8] text-[#4f5b77]">
              Pilih sesi yang aktif, cek urgensi jadwal, lalu buka detail booking tanpa tenggelam dalam layout yang terlalu ramai.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 xl:border-l xl:border-[#e5dfeb] xl:pl-8">
            <article>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Total</p>
              <p className="mt-3 font-[var(--font-fraunces)] text-[36px] font-medium text-[#121d35]">{summary.total}</p>
            </article>
            <article>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Disetujui</p>
              <p className="mt-3 font-[var(--font-fraunces)] text-[36px] font-medium text-[#121d35]">{summary.approved}</p>
            </article>
            <article>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Proses</p>
              <p className="mt-3 font-[var(--font-fraunces)] text-[36px] font-medium text-[#121d35]">{summary.progress}</p>
            </article>
          </div>
        </header>

        {/* Filters */}
        <section className="rounded-[28px] border border-[#e2dde8] bg-[#f9f8fc] p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Kata Kunci</span>
                <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }} placeholder="Cari sekolah, topik, atau ID" className="min-h-11 rounded-xl border border-[#d8deeb] bg-white px-3 text-[14px] text-[#313f61] outline-none transition-colors focus:border-[#b9c7de]" />
              </label>
              <label className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Status</span>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as BookingStatus | "Semua"); setCurrentPage(1); }} className="min-h-11 rounded-xl border border-[#d8deeb] bg-white px-3 text-[14px] text-[#313f61] outline-none transition-colors focus:border-[#b9c7de]">
                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Tanggal</span>
                <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className="min-h-11 rounded-xl border border-[#d8deeb] bg-white px-3 text-[14px] text-[#313f61] outline-none transition-colors focus:border-[#b9c7de]" />
              </label>
              <label className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Urutkan</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="min-h-11 rounded-xl border border-[#d8deeb] bg-white px-3 text-[14px] text-[#313f61] outline-none transition-colors focus:border-[#b9c7de]">
                  <option value="date-desc">Terbaru</option>
                  <option value="date-asc">Terlama</option>
                  <option value="status">Status</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <Link href="/dashboard/booking-jadwal" className="rounded-xl border border-[#cfd5e6] bg-white px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] transition-colors duration-300 hover:bg-[#eef1f8] hover:text-[#25365f]">Buka Kalender</Link>
              <Link href="/dashboard/booking-baru" className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b8933d] hover:shadow-md">+ Booking Baru</Link>
              <button type="button" onClick={resetFilters} className="rounded-xl border border-[#d8deeb] bg-[#f3f2f8] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] transition-colors duration-300 hover:bg-[#e9edf5] hover:text-[#25365f]">Reset</button>
            </div>
          </div>
        </section>

        {filteredBookings.length === 0 ? (
          <DashboardDataState variant="empty" />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-[28px] border border-[#e2dde8] bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-[#ece6f1] px-6 py-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">Daftar Booking</p>
                  <h2 className="mt-2 font-[var(--font-fraunces)] text-[30px] font-medium text-[#121d35]">Sesi yang sedang berjalan.</h2>
                </div>
                <p className="text-[13px] leading-[1.6] text-[#6d7998]">{filteredBookings.length} hasil ditemukan</p>
              </div>

              <div className="divide-y divide-[#ece6f1]">
                {paginatedBookings.map((booking) => {
                  const reminder = getBookingReminder(booking.dateISO);
                  const isSelected = selectedBooking?.id === booking.id;
                  const canCancel = booking.status === "Menunggu" || booking.status === "Disetujui";

                  return (
                    <article key={booking.id} className={`px-6 py-6 transition-colors duration-300 ${isSelected ? "bg-[#fffaf1]" : "bg-white hover:bg-[#fcfbfd]"}`}>
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa6c4]">{booking.id}</span>
                            <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${getStatusClasses(booking.status)}`}>{booking.status}</span>
                            {reminder && <span className="inline-flex rounded-md border border-[#f1d9a8] bg-[#fff7e8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#ad7a2c]">{reminder.label}</span>}
                          </div>
                          <h3 className="mt-4 font-[var(--font-fraunces)] text-[28px] font-medium leading-[1.08] tracking-[-0.02em] text-[#121d35]">{booking.topic}</h3>
                          <p className="mt-2 text-[15px] leading-[1.75] text-[#4f5b77]">
                            {booking.school}
                            {booking.category && <span className="ml-2 inline-flex rounded-md bg-[#f3f2f8] px-2 py-0.5 text-[10px] font-bold uppercase text-[#4a5f8e]">{booking.category}</span>}
                          </p>
                          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-[#4f5b77]">
                            <div>
                              <span className="font-bold uppercase tracking-[0.14em] text-[#9aa6c4]">Tanggal</span>
                              <p className="mt-1 font-medium text-[#25365f]">{formatLongDateID(booking.dateISO)}</p>
                            </div>
                            <div>
                              <span className="font-bold uppercase tracking-[0.14em] text-[#9aa6c4]">Sesi</span>
                              <p className="mt-1 font-medium text-[#25365f]">{booking.session}</p>
                            </div>
                            <div>
                              <span className="font-bold uppercase tracking-[0.14em] text-[#9aa6c4]">Tahap Aktif</span>
                              <p className="mt-1 font-medium text-[#25365f]">{getActiveStage(booking)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 lg:w-[190px]">
                          <button type="button" onClick={() => setSelectedBookingId(booking.id)} className={`rounded-xl border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-300 ${isSelected ? "border-[#d5bb82] bg-[#fff2de] text-[#ad7a2c]" : "border-[#d5dbea] bg-[#f9f8fc] text-[#4f5b77] hover:bg-[#eef1f8] hover:text-[#25365f]"}`}>
                            {isSelected ? "Sedang Dipilih" : "Pilih Booking"}
                          </button>
                          <Link href={`/dashboard/booking/${booking.id}`} className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b8933d] hover:shadow-md">
                            Buka Detail
                          </Link>
                          {canCancel && (
                            <button type="button" onClick={() => openCancelModal(booking.id)} className="rounded-xl border border-[#e8c4c4] bg-[#fff5f5] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a13636] transition-colors hover:bg-[#ffe9e9]">
                              Batalkan
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#ece6f1] px-6 py-4">
                  <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} className="rounded-lg border border-[#d8deeb] bg-white px-3 py-2 text-[12px] font-bold text-[#4f5b77] disabled:opacity-40 hover:bg-[#eef1f8]">
                    Sebelumnya
                  </button>
                  <span className="text-[13px] font-semibold text-[#6d7998]">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="rounded-lg border border-[#d8deeb] bg-white px-3 py-2 text-[12px] font-bold text-[#4f5b77] disabled:opacity-40 hover:bg-[#eef1f8]">
                    Berikutnya
                  </button>
                </div>
              )}
            </section>

            {/* Sidebar */}
            <aside className="xl:sticky xl:top-6 xl:self-start">
              <section className="rounded-[28px] border border-[#e2dde8] bg-[#f9f8fc] p-6 shadow-sm">
                {selectedBooking ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">Booking Terpilih</span>
                      <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${getStatusClasses(selectedBooking.status)}`}>{selectedBooking.status}</span>
                      {selectedReminder && <span className="inline-flex rounded-md border border-[#f1d9a8] bg-[#fff7e8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#ad7a2c]">{selectedReminder.label}</span>}
                    </div>
                    <h3 className="mt-5 font-[var(--font-fraunces)] text-[34px] font-medium leading-[1.05] tracking-[-0.03em] text-[#121d35]">{selectedBooking.topic}</h3>
                    <p className="mt-4 text-[15px] leading-[1.8] text-[#4f5b77]">
                      {selectedBooking.school} dijadwalkan pada{" "}
                      <span className="font-semibold text-[#25365f]">{formatLongDateID(selectedBooking.dateISO)}</span>{" "}
                      dengan sesi {selectedBooking.session}.
                    </p>
                    <div className="mt-6 space-y-4 border-t border-[#e5dfeb] pt-5">
                      {selectedBooking.timeline.map((item) => (
                        <div key={item.title} className="flex gap-3">
                          <span className={`mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full ${item.status === "done" ? "bg-[#304878]" : item.status === "active" ? "bg-[#d2ac50]" : "bg-[#d5dbea]"}`} />
                          <div>
                            <p className="text-[14px] font-semibold text-[#25365f]">{item.title}</p>
                            <p className="mt-1 text-[13px] leading-[1.6] text-[#6d7998]">{item.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 grid gap-2">
                      <Link href={`/dashboard/booking/${selectedBooking.id}`} className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-center text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b8933d] hover:shadow-md">Detail Booking</Link>
                      <Link href="/dashboard/booking-jadwal" className="rounded-xl border border-[#d5dbea] bg-white px-4 py-3 text-center text-[12px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] transition-colors duration-300 hover:bg-[#eef1f8] hover:text-[#25365f]">Lihat di Kalender</Link>
                    </div>
                  </>
                ) : null}
              </section>
            </aside>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Batalkan Booking"
        footer={
          <>
            <button type="button" onClick={() => setCancelModalOpen(false)} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] hover:bg-[#eef1f8]">
              Kembali
            </button>
            <button type="button" onClick={confirmCancel} disabled={!cancelReason.trim()} className="rounded-xl border border-[#a13636] bg-[#c44444] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-40 hover:bg-[#a13636]">
              Ya, Batalkan
            </button>
          </>
        }
      >
        <p className="text-[14px] leading-[1.6] text-[#4f5b77] mb-4">
          Apakah Anda yakin ingin membatalkan booking <strong className="text-[#25365f]">{cancelTargetId}</strong>? Aksi ini tidak dapat diurungkan.
        </p>
        <label className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d7998]">Alasan Pembatalan</span>
          <textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Jelaskan alasan pembatalan..." className="rounded-xl border border-[#d7deef] bg-white px-3 py-3 text-[14px] text-[#313f61] outline-none transition-colors focus:border-[#b7c4df]" />
        </label>
      </Modal>
    </main>
  );
}
