"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDashboard } from "@/lib/DashboardContext";
import { Modal } from "@/components/ui/Modal";
import { formatShortDateID, type BookingStatus } from "@/lib/userDashboardData";

const ALL_STATUSES: BookingStatus[] = ["Menunggu", "Disetujui", "Dalam Proses", "Selesai", "Ditolak", "Dibatalkan"];
const ITEMS_PER_PAGE = 8;

function getStatusClasses(status: string) {
  switch (status) {
    case "Menunggu": return "bg-[#fef3c7] text-[#92400e]";
    case "Disetujui": return "bg-[#d1fae5] text-[#065f46]";
    case "Dalam Proses": return "bg-[#dbeafe] text-[#1e40af]";
    case "Selesai": return "bg-[#e8e0f0] text-[#5b21b6]";
    case "Ditolak": return "bg-[#fee2e2] text-[#991b1b]";
    case "Dibatalkan": return "bg-[#f3f4f6] text-[#6b7280]";
    default: return "bg-[#f3f4f6] text-[#6b7280]";
  }
}

export default function AdminBookingPage() {
  const { bookings, approveBooking, rejectBooking, startSession, confirmBookingDone, addSupervisorNotes } = useDashboard();

  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);

  // Modals
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notesModal, setNotesModal] = useState<string | null>(null);
  const [supervisorNotes, setSupervisorNotes] = useState("");

  const filtered = useMemo(() => {
    let result = [...bookings];
    if (filterStatus !== "Semua") {
      result = result.filter((b) => b.status === filterStatus);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (b) => b.school.toLowerCase().includes(q) || b.topic.toLowerCase().includes(q) || b.id.toLowerCase().includes(q),
      );
    }
    return result;
  }, [bookings, filterStatus, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
    const booking = bookings.find((b) => b.id === bookingId);
    setSupervisorNotes(booking?.supervisorNotes ?? "");
    setNotesModal(bookingId);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6d7998]">Dashboard Admin &rsaquo; Kelola Booking</p>
        <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-[22px] font-bold text-[#25365f]">
          Kelola Booking
        </h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          placeholder="Cari sekolah, topik, atau ID..."
          className="h-10 w-full max-w-xs rounded-xl border border-[#d8deeb] bg-white px-4 text-[13px] text-[#25365f] placeholder:text-[#a3adc2] focus:border-[#4a6baf] focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setFilterStatus("Semua"); setPage(1); }}
            className={`rounded-full px-4 py-2 text-[11px] font-bold transition-colors ${filterStatus === "Semua" ? "bg-[#25365f] text-white" : "bg-white border border-[#e1dce8] text-[#4f5b77] hover:bg-[#f5f3f7]"}`}
          >
            Semua ({bookings.length})
          </button>
          {ALL_STATUSES.map((s) => {
            const count = bookings.filter((b) => b.status === s).length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => { setFilterStatus(s); setPage(1); }}
                className={`rounded-full px-4 py-2 text-[11px] font-bold transition-colors ${filterStatus === s ? "bg-[#25365f] text-white" : "bg-white border border-[#e1dce8] text-[#4f5b77] hover:bg-[#f5f3f7]"}`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#e1dce8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e1dce8]">
                <th className="px-5 py-3 font-bold text-[#6d7998]">ID</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Sekolah</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Topik</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Kategori</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Tanggal</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Sesi</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Status</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((b) => (
                <tr key={b.id} className="border-b border-[#f3f1f5] last:border-0 hover:bg-[#faf9fc]">
                  <td className="px-5 py-3 font-semibold">
                    <Link href={`/dashboard-admin/booking/${b.id}`} className="text-[#4a6baf] hover:text-[#25365f] hover:underline">{b.id}</Link>
                  </td>
                  <td className="px-5 py-3 text-[#4f5b77] font-medium">{b.school}</td>
                  <td className="px-5 py-3 text-[#4f5b77] max-w-[200px] truncate">{b.topic}</td>
                  <td className="px-5 py-3 text-[#6d7998]">{b.category ?? "-"}</td>
                  <td className="px-5 py-3 text-[#6d7998] whitespace-nowrap">{formatShortDateID(b.dateISO)}</td>
                  <td className="px-5 py-3 text-[#6d7998] text-[12px]">{b.session}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold ${getStatusClasses(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      {b.status === "Menunggu" && (
                        <>
                          <button
                            type="button"
                            onClick={() => { void runAction(`approve-${b.id}`, () => approveBooking(b.id)); }}
                            disabled={busyActionKey === `approve-${b.id}`}
                            className="rounded-lg bg-[#065f46] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#047857] transition-colors"
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectModal(b.id); setRejectReason(""); }}
                            className="rounded-lg bg-[#991b1b] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#b91c1c] transition-colors"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      {b.status === "Disetujui" && (
                        <button
                          type="button"
                          onClick={() => { void runAction(`start-${b.id}`, () => startSession(b.id)); }}
                          disabled={busyActionKey === `start-${b.id}`}
                          className="rounded-lg bg-[#1e40af] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#1d4ed8] transition-colors"
                        >
                          Mulai Sesi
                        </button>
                      )}
                      {b.status === "Dalam Proses" && (
                        <button
                          type="button"
                          onClick={() => { void runAction(`complete-${b.id}`, () => confirmBookingDone(b.id)); }}
                          disabled={busyActionKey === `complete-${b.id}`}
                          className="rounded-lg bg-[#5b21b6] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#6d28d9] transition-colors"
                        >
                          Selesai
                        </button>
                      )}
                      {(b.status === "Dalam Proses" || b.status === "Selesai") && (
                        <button
                          type="button"
                          onClick={() => openNotesModal(b.id)}
                          className="rounded-lg border border-[#d8deeb] bg-white px-3 py-1.5 text-[11px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7] transition-colors"
                        >
                          Catatan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[13px] text-[#6d7998]">
                    Tidak ada booking ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#e1dce8] px-5 py-3">
            <span className="text-[12px] text-[#6d7998]">
              Hal {page} dari {totalPages} ({filtered.length} data)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-[#d8deeb] px-3 py-1.5 text-[12px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7] disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-[#d8deeb] px-3 py-1.5 text-[12px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7] disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        open={rejectModal !== null}
        onClose={() => setRejectModal(null)}
        title="Tolak Booking"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectModal(null)}
              className="rounded-xl border border-[#d8deeb] px-4 py-2 text-[13px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={!rejectReason.trim() || busyActionKey === `reject-${rejectModal}`}
              className="rounded-xl bg-[#991b1b] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#b91c1c] disabled:opacity-40"
            >
              Konfirmasi Tolak
            </button>
          </>
        }
      >
        <p className="text-[13px] text-[#4f5b77] mb-3">
          Berikan alasan penolakan untuk booking <strong>{rejectModal}</strong>:
        </p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Contoh: Jadwal bentrok dengan kegiatan dinas..."
          rows={3}
          className="w-full rounded-xl border border-[#d8deeb] px-4 py-3 text-[13px] text-[#25365f] placeholder:text-[#a3adc2] focus:border-[#4a6baf] focus:outline-none"
        />
      </Modal>

      {/* Supervisor Notes Modal */}
      <Modal
        open={notesModal !== null}
        onClose={() => setNotesModal(null)}
        title="Catatan Pengawas"
        footer={
          <>
            <button
              type="button"
              onClick={() => setNotesModal(null)}
              className="rounded-xl border border-[#d8deeb] px-4 py-2 text-[13px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={!supervisorNotes.trim() || busyActionKey === `notes-${notesModal}`}
              className="rounded-xl bg-[#25365f] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#1d2741] disabled:opacity-40"
            >
              Simpan Catatan
            </button>
          </>
        }
      >
        <p className="text-[13px] text-[#4f5b77] mb-3">
          Catatan pengawas untuk booking <strong>{notesModal}</strong>:
        </p>
        <textarea
          value={supervisorNotes}
          onChange={(e) => setSupervisorNotes(e.target.value)}
          placeholder="Tulis catatan hasil observasi, rekomendasi, dll..."
          rows={4}
          className="w-full rounded-xl border border-[#d8deeb] px-4 py-3 text-[13px] text-[#25365f] placeholder:text-[#a3adc2] focus:border-[#4a6baf] focus:outline-none"
        />
      </Modal>
    </div>
  );
}
