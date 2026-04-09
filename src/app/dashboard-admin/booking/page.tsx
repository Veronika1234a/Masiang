"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useDashboard } from "@/lib/DashboardContext";
import { formatShortDateID, type BookingStatus } from "@/lib/userDashboardData";

const ALL_STATUSES: Array<BookingStatus | "Semua"> = [
  "Semua",
  "Menunggu",
  "Disetujui",
  "Dalam Proses",
  "Selesai",
  "Ditolak",
  "Dibatalkan",
];
const ITEMS_PER_PAGE = 8;
const FILTER_INPUT_CLASS_NAME =
  "min-h-12 w-full rounded-2xl border border-[#d5dceb] bg-white px-4 text-[14px] font-medium text-[#25365f] placeholder:text-[#8f9ab3] shadow-[0_8px_24px_-20px_rgba(37,54,95,0.35)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#4a6baf] focus:shadow-[0_10px_28px_-18px_rgba(74,107,175,0.45)]";
const ACTION_BUTTON_CLASS_NAME =
  "rounded-xl px-3.5 py-2 text-[12px] font-bold transition-colors disabled:opacity-50";

function getStatusClasses(status: string) {
  switch (status) {
    case "Menunggu":
      return "bg-[#fff6e6] text-[#9b6a1d]";
    case "Disetujui":
      return "bg-[#e8f3ee] text-[#2b5f52]";
    case "Dalam Proses":
      return "bg-[#eef4fb] text-[#35557c]";
    case "Selesai":
      return "bg-[#edf3ef] text-[#2f5a4b]";
    case "Ditolak":
      return "bg-[#fdf0ef] text-[#9b4b45]";
    case "Dibatalkan":
      return "bg-[#f0eef2] text-[#6d7998]";
    default:
      return "bg-[#f0eef2] text-[#6d7998]";
  }
}

export default function AdminBookingPage() {
  const {
    bookings,
    approveBooking,
    rejectBooking,
    startSession,
    confirmBookingDone,
    addSupervisorNotes,
  } = useDashboard();

  const [filterStatus, setFilterStatus] = useState<BookingStatus | "Semua">("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);

  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notesModal, setNotesModal] = useState<string | null>(null);
  const [supervisorNotes, setSupervisorNotes] = useState("");

  const filtered = useMemo(() => {
    let result = [...bookings];

    if (filterStatus !== "Semua") {
      result = result.filter((booking) => booking.status === filterStatus);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (booking) =>
          booking.school.toLowerCase().includes(query) ||
          booking.topic.toLowerCase().includes(query) ||
          booking.id.toLowerCase().includes(query),
      );
    }

    return result;
  }, [bookings, filterStatus, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const summaryCards = [
    {
      label: "Perlu Keputusan",
      value: bookings.filter((booking) => booking.status === "Menunggu").length,
      accent: "text-[#9b6a1d]",
    },
    {
      label: "Sudah Disetujui",
      value: bookings.filter((booking) => booking.status === "Disetujui").length,
      accent: "text-[#35557c]",
    },
    {
      label: "Sedang Berjalan",
      value: bookings.filter((booking) => booking.status === "Dalam Proses").length,
      accent: "text-[#2f5a4b]",
    },
    {
      label: "Tampil Saat Ini",
      value: filtered.length,
      accent: "text-[#25365f]",
    },
  ];

  const runAction = async (actionKey: string, action: () => Promise<unknown>) => {
    if (busyActionKey === actionKey) return false;
    setBusyActionKey(actionKey);

    try {
      await action();
      return true;
    } catch {
      return false;
    } finally {
      setBusyActionKey((current) => (current === actionKey ? null : current));
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;

    const didReject = await runAction(`reject-${rejectModal}`, () =>
      rejectBooking(rejectModal, rejectReason.trim()),
    );

    if (didReject) {
      setRejectModal(null);
      setRejectReason("");
    }
  };

  const handleSaveNotes = async () => {
    if (!notesModal || !supervisorNotes.trim()) return;

    const didSave = await runAction(`notes-${notesModal}`, () =>
      addSupervisorNotes(notesModal, supervisorNotes.trim()),
    );

    if (didSave) {
      setNotesModal(null);
      setSupervisorNotes("");
    }
  };

  const openNotesModal = (bookingId: string) => {
    const booking = bookings.find((item) => item.id === bookingId);
    setSupervisorNotes(booking?.supervisorNotes ?? "");
    setNotesModal(bookingId);
  };

  return (
    <div className="space-y-6 text-[#25365f]">
      <header className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6d7998]">
          Dashboard Admin &rsaquo; Kelola Booking
        </p>
        <h2 className="font-[family-name:var(--font-fraunces)] text-[24px] font-bold text-[#25365f]">
          Kelola Booking
        </h2>
        <p className="max-w-[700px] text-[14px] leading-7 text-[#5d6780]">
          Fokuskan antrean admin pada booking yang benar-benar perlu keputusan,
          lalu lanjutkan ke sesi aktif tanpa harus membaca tabel yang terlalu rapat.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[24px] border border-[#e2dde8] bg-white px-5 py-4 shadow-[0_18px_40px_-32px_rgba(37,54,95,0.4)]"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b879f]">
              {card.label}
            </p>
            <p className={`mt-3 font-[var(--font-fraunces)] text-[34px] font-medium leading-none ${card.accent}`}>
              {card.value}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[28px] border border-[#e2dde8] bg-[#f8f7fb] p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,340px)_1fr] xl:items-start">
          <label className="grid gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b879f]">
              Cari Booking
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Cari sekolah, topik, atau ID booking"
              className={FILTER_INPUT_CLASS_NAME}
            />
          </label>

          <div className="grid gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b879f]">
              Filter Status
            </span>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((status) => {
                const count =
                  status === "Semua"
                    ? bookings.length
                    : bookings.filter((booking) => booking.status === status).length;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setFilterStatus(status);
                      setPage(1);
                    }}
                    className={`rounded-full border px-4 py-2.5 text-[12px] font-bold transition-colors ${
                      filterStatus === status
                        ? "border-[#25365f] bg-[#25365f] text-white"
                        : "border-[#d8deeb] bg-white text-[#4f5b77] hover:bg-[#eef2f8]"
                    }`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#e1dce8] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-[#e8e2ec]">
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">ID</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Sekolah</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Topik</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Kategori</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Tanggal</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Sesi</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Status</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((booking) => (
                  <tr key={booking.id} className="border-b border-[#f3f1f5] last:border-0 hover:bg-[#fcfbfd]">
                    <td className="px-5 py-4 font-semibold">
                      <Link
                        href={`/dashboard-admin/booking/${booking.id}`}
                        className="text-[#4a6baf] hover:text-[#25365f] hover:underline"
                      >
                        {booking.id}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-medium text-[#4f5b77]">{booking.school}</td>
                    <td className="px-5 py-4 max-w-[240px] truncate text-[#4f5b77]">{booking.topic}</td>
                    <td className="px-5 py-4 text-[#6d7998]">{booking.category ?? "-"}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#6d7998]">
                      {formatShortDateID(booking.dateISO)}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[#6d7998]">{booking.session}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block rounded-full px-3 py-1.5 text-[11px] font-bold ${getStatusClasses(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {booking.status === "Menunggu" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                void runAction(`approve-${booking.id}`, () => approveBooking(booking.id));
                              }}
                              disabled={busyActionKey === `approve-${booking.id}`}
                              className={`${ACTION_BUTTON_CLASS_NAME} bg-[#d2ac50] text-white hover:bg-[#b8933d]`}
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectModal(booking.id);
                                setRejectReason("");
                              }}
                              className={`${ACTION_BUTTON_CLASS_NAME} bg-[#b86b63] text-white hover:bg-[#9f5a53]`}
                            >
                              Tolak
                            </button>
                          </>
                        ) : null}

                        {booking.status === "Disetujui" ? (
                          <button
                            type="button"
                            onClick={() => {
                              void runAction(`start-${booking.id}`, () => startSession(booking.id));
                            }}
                            disabled={busyActionKey === `start-${booking.id}`}
                            className={`${ACTION_BUTTON_CLASS_NAME} bg-[#304878] text-white hover:bg-[#25365f]`}
                          >
                            Mulai Sesi
                          </button>
                        ) : null}

                        {booking.status === "Dalam Proses" ? (
                          <button
                            type="button"
                            onClick={() => {
                              void runAction(`complete-${booking.id}`, () => confirmBookingDone(booking.id));
                            }}
                            disabled={busyActionKey === `complete-${booking.id}`}
                            className={`${ACTION_BUTTON_CLASS_NAME} bg-[#2f5a4b] text-white hover:bg-[#25463a]`}
                          >
                            Selesai
                          </button>
                        ) : null}

                        {booking.status === "Dalam Proses" || booking.status === "Selesai" ? (
                          <button
                            type="button"
                            onClick={() => openNotesModal(booking.id)}
                            className={`${ACTION_BUTTON_CLASS_NAME} border border-[#d8deeb] bg-white text-[#4f5b77] hover:bg-[#f5f3f7]`}
                          >
                            Catatan
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-[14px] text-[#6d7998]">
                    Tidak ada booking yang cocok dengan pencarian ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[#e8e2ec] px-5 py-4">
            <span className="text-[13px] text-[#6d7998]">
              Hal {page} dari {totalPages} ({filtered.length} data)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-xl border border-[#d8deeb] px-4 py-2 text-[12px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7] disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-xl border border-[#d8deeb] px-4 py-2 text-[12px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7] disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <Modal
        open={rejectModal !== null}
        onClose={() => setRejectModal(null)}
        title="Tolak Booking"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectModal(null)}
              className="rounded-xl border border-[#d8deeb] px-4 py-2.5 text-[13px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={!rejectReason.trim() || busyActionKey === `reject-${rejectModal}`}
              className="rounded-xl bg-[#b86b63] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#9f5a53] disabled:opacity-40"
            >
              Konfirmasi Tolak
            </button>
          </>
        }
      >
        <p className="mb-3 text-[14px] leading-7 text-[#4f5b77]">
          Berikan alasan penolakan untuk booking <strong>{rejectModal}</strong>.
          Pesan ini juga akan dibaca sekolah pada detail booking mereka.
        </p>
        <textarea
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Contoh: Jadwal bentrok dengan kegiatan dinas..."
          rows={4}
          className={`${FILTER_INPUT_CLASS_NAME} min-h-[132px] px-4 py-3`}
        />
      </Modal>

      <Modal
        open={notesModal !== null}
        onClose={() => setNotesModal(null)}
        title="Catatan Pengawas"
        footer={
          <>
            <button
              type="button"
              onClick={() => setNotesModal(null)}
              className="rounded-xl border border-[#d8deeb] px-4 py-2.5 text-[13px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={!supervisorNotes.trim() || busyActionKey === `notes-${notesModal}`}
              className="rounded-xl bg-[#25365f] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#1d2741] disabled:opacity-40"
            >
              Simpan Catatan
            </button>
          </>
        }
      >
        <p className="mb-3 text-[14px] leading-7 text-[#4f5b77]">
          Ringkas hasil observasi, rekomendasi, atau catatan tindak lanjut untuk
          booking <strong>{notesModal}</strong>.
        </p>
        <textarea
          value={supervisorNotes}
          onChange={(event) => setSupervisorNotes(event.target.value)}
          placeholder="Tulis catatan hasil observasi, rekomendasi, atau langkah tindak lanjut..."
          rows={5}
          className={`${FILTER_INPUT_CLASS_NAME} min-h-[150px] px-4 py-3`}
        />
      </Modal>
    </div>
  );
}
