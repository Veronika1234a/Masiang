"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useDashboard } from "@/lib/DashboardContext";
import { Modal } from "@/components/ui/Modal";
import { openBookingPrintReport } from "@/lib/bookingPrint";
import { formatLongDateID } from "@/lib/userDashboardData";

function getStatusClasses(status: string) {
  switch (status) {
    case "Menunggu": return "bg-[#fff6e6] text-[#9b6a1d]";
    case "Disetujui": return "bg-[#e8f3ee] text-[#2b5f52]";
    case "Dalam Proses": return "bg-[#eef4fb] text-[#35557c]";
    case "Selesai": return "bg-[#edf3ef] text-[#2f5a4b]";
    case "Ditolak": return "bg-[#fdf0ef] text-[#9b4b45]";
    case "Dibatalkan": return "bg-[#f3f4f6] text-[#6b7280]";
    default: return "bg-[#f3f4f6] text-[#6b7280]";
  }
}

export default function AdminBookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const { bookings, documents, histories, approveBooking, rejectBooking, startSession, confirmBookingDone, addSupervisorNotes, addToast, dashboardLoading } = useDashboard();

  const booking = bookings.find((b) => b.id === bookingId);
  const relatedDocs = documents.filter((d) => d.bookingId === bookingId);

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [notesModal, setNotesModal] = useState(false);
  const [supervisorNotes, setSupervisorNotes] = useState(booking?.supervisorNotes ?? "");
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);

  if (dashboardLoading) {
    return (
      <div className="space-y-4">
        <nav className="text-[12px] font-bold text-[#6d7998]">
          <Link href="/dashboard-admin/booking" className="hover:text-[#25365f]">Kelola Booking</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[#25365f]">{bookingId}</span>
        </nav>
        <div className="rounded-2xl border border-[#e1dce8] bg-white p-12 text-center">
          <p className="text-[15px] text-[#6d7998]">Memuat booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <nav className="text-[12px] font-bold text-[#6d7998]">
          <Link href="/dashboard-admin/booking" className="hover:text-[#25365f]">Kelola Booking</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[#25365f]">{bookingId}</span>
        </nav>
        <div className="rounded-2xl border border-[#e1dce8] bg-white p-12 text-center">
          <p className="text-[15px] text-[#6d7998]">Booking tidak ditemukan.</p>
          <Link href="/dashboard-admin/booking" className="mt-4 inline-block text-[13px] font-bold text-[#35557c] hover:text-[#25365f]">
            Kembali ke daftar booking
          </Link>
        </div>
      </div>
    );
  }

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
    if (!rejectReason.trim()) return;
    const didReject = await runAction(`reject-${bookingId}`, () =>
      rejectBooking(bookingId, rejectReason.trim()),
    );
    if (didReject) {
      setRejectModal(false);
      setRejectReason("");
    }
  };

  const handleSaveNotes = async () => {
    if (!supervisorNotes.trim()) return;
    const didSave = await runAction(`notes-${bookingId}`, () =>
      addSupervisorNotes(bookingId, supervisorNotes.trim()),
    );
    if (didSave) {
      setNotesModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <nav className="text-[12px] font-bold text-[#6d7998]">
        <Link href="/dashboard-admin/booking" className="hover:text-[#25365f]">Kelola Booking</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#25365f]">{booking.id}</span>
      </nav>

      {/* Header + Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-[family-name:var(--font-fraunces)] text-[22px] font-bold text-[#25365f]">{booking.topic}</h2>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${getStatusClasses(booking.status)}`}>{booking.status}</span>
          </div>
          <p className="mt-1 text-[13px] text-[#6d7998]">{booking.school} &bull; {booking.id} &bull; {booking.category ?? "-"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {booking.status === "Menunggu" && (
            <>
              <button type="button" onClick={() => { void runAction(`approve-${booking.id}`, () => approveBooking(booking.id)); }} disabled={busyActionKey === `approve-${booking.id}`} className="rounded-xl bg-[#d2ac50] px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#b8933d]">Setujui</button>
              <button type="button" onClick={() => { setRejectModal(true); setRejectReason(""); }} className="rounded-xl bg-[#b86b63] px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#9f5a53]">Tolak</button>
            </>
          )}
          {booking.status === "Disetujui" && (
            <button type="button" onClick={() => { void runAction(`start-${booking.id}`, () => startSession(booking.id)); }} disabled={busyActionKey === `start-${booking.id}`} className="rounded-xl bg-[#304878] px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#25365f]">Mulai Sesi</button>
          )}
          {booking.status === "Dalam Proses" && (
            <button type="button" onClick={() => { void runAction(`complete-${booking.id}`, () => confirmBookingDone(booking.id)); }} disabled={busyActionKey === `complete-${booking.id}`} className="rounded-xl bg-[#2f5a4b] px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#25463a]">Tandai Selesai</button>
          )}
          {(booking.status === "Dalam Proses" || booking.status === "Selesai") && (
            <button type="button" onClick={() => { setSupervisorNotes(booking.supervisorNotes ?? ""); setNotesModal(true); }} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-2.5 text-[12px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7]">Catatan Pengawas</button>
          )}
          <button
            type="button"
            onClick={() => {
              const opened = openBookingPrintReport({
                booking,
                documents: relatedDocs,
                history: histories.find((item) => item.bookingId === booking.id) ?? null,
              });

              if (!opened) {
                addToast("Popup cetak diblokir browser. Izinkan popup lalu coba lagi.", "error");
              }
            }}
            className="rounded-xl border border-[#ffb660] bg-[#fff3e2] px-4 py-2.5 text-[12px] font-bold text-[#d96f05] transition-colors hover:bg-[#ffe7c9]"
          >
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#e1dce8] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6d7998]">Tanggal</p>
          <p className="mt-1 text-[14px] font-bold text-[#25365f]">{formatLongDateID(booking.dateISO)}</p>
        </div>
        <div className="rounded-2xl border border-[#e1dce8] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6d7998]">Sesi</p>
          <p className="mt-1 text-[14px] font-bold text-[#25365f]">{booking.session}</p>
        </div>
        <div className="rounded-2xl border border-[#e1dce8] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6d7998]">Tujuan</p>
          <p className="mt-1 text-[13px] text-[#4f5b77]">{booking.goal || "-"}</p>
        </div>
        <div className="rounded-2xl border border-[#e1dce8] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6d7998]">Catatan Sekolah</p>
          <p className="mt-1 text-[13px] text-[#4f5b77]">{booking.notes || "-"}</p>
        </div>
      </div>

      {/* Supervisor Notes + Cancel Reason */}
      {booking.supervisorNotes && (
        <div className="rounded-2xl border border-[#d6dfef] bg-[#eef4fb] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#35557c]">Catatan Pengawas</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#304878]">{booking.supervisorNotes}</p>
        </div>
      )}
      {booking.cancelReason && (
        <div className="rounded-2xl border border-[#efd6d3] bg-[#fdf0ef] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9b4b45]">Alasan {booking.status === "Ditolak" ? "Penolakan" : "Pembatalan"}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#8b544f]">{booking.cancelReason}</p>
        </div>
      )}

      {/* Rating */}
      {booking.rating && (
        <div className="rounded-2xl border border-[#ead7b0] bg-[#fff8ed] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9b6a1d]">Rating & Feedback</p>
          <p className="mt-1 text-[14px] font-bold text-[#9b6a1d]">{"★".repeat(booking.rating)}{"☆".repeat(5 - booking.rating)}</p>
          {booking.feedback && <p className="mt-1 text-[13px] text-[#4f5b77]">{booking.feedback}</p>}
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-2xl border border-[#e1dce8] bg-white p-6">
        <h3 className="mb-4 text-[14px] font-bold text-[#25365f]">Timeline</h3>
        <div className="space-y-0">
          {booking.timeline.map((t, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                  t.status === "done" ? "border-[#25365f] bg-[#25365f]" :
                  t.status === "active" ? "border-[#d4a95c] bg-white" :
                  "border-[#e1dce8] bg-[#faf9fc]"
                }`}>
                  {t.status === "done" && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  {t.status === "active" && <div className="h-2 w-2 rounded-full bg-[#d4a95c]" />}
                </div>
                {i < booking.timeline.length - 1 && <div className={`w-0.5 flex-1 ${t.status === "done" ? "bg-[#25365f]" : "bg-[#e1dce8]"}`} />}
              </div>
              <div className="pb-6">
                <p className="text-[13px] font-bold text-[#25365f]">{t.title}</p>
                <p className="text-[12px] text-[#6d7998]">{t.note}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#a3adc2]">{t.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Documents */}
      <div className="rounded-2xl border border-[#e1dce8] bg-white p-6">
        <h3 className="mb-4 text-[14px] font-bold text-[#25365f]">Dokumen Terkait ({relatedDocs.length})</h3>
        {relatedDocs.length > 0 ? (
          <div className="space-y-2">
            {relatedDocs.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl bg-[#faf9fc] p-3">
                <div>
                  <p className="text-[13px] font-medium text-[#25365f]">{d.fileName}</p>
                  <p className="text-[11px] text-[#6d7998]">{d.id} &bull; {d.uploadedAt} &bull; v{d.version ?? 1}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                  d.reviewStatus === "Disetujui" ? "bg-[#e8f3ee] text-[#2b5f52]" :
                  d.reviewStatus === "Perlu Revisi" ? "bg-[#fff6e6] text-[#9b6a1d]" :
                  "bg-[#eef4fb] text-[#35557c]"
                }`}>{d.reviewStatus ?? "—"}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[13px] text-[#6d7998] py-4">Belum ada dokumen terkait.</p>
        )}
      </div>

      {/* Reject Modal */}
      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Tolak Booking" footer={
        <>
          <button type="button" onClick={() => setRejectModal(false)} className="rounded-xl border border-[#d8deeb] px-4 py-2 text-[13px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7]">Batal</button>
          <button type="button" onClick={handleReject} disabled={!rejectReason.trim() || busyActionKey === `reject-${bookingId}`} className="rounded-xl bg-[#b86b63] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#9f5a53] disabled:opacity-40">Konfirmasi Tolak</button>
        </>
      }>
        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Alasan penolakan..." rows={3} className="w-full rounded-xl border border-[#d8deeb] px-4 py-3 text-[13px] text-[#25365f] placeholder:text-[#a3adc2] focus:border-[#35557c] focus:outline-none" />
      </Modal>

      {/* Notes Modal */}
      <Modal open={notesModal} onClose={() => setNotesModal(false)} title="Catatan Pengawas" footer={
        <>
          <button type="button" onClick={() => setNotesModal(false)} className="rounded-xl border border-[#d8deeb] px-4 py-2 text-[13px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7]">Batal</button>
          <button type="button" onClick={handleSaveNotes} disabled={!supervisorNotes.trim() || busyActionKey === `notes-${bookingId}`} className="rounded-xl bg-[#25365f] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#1d2741] disabled:opacity-40">Simpan</button>
        </>
      }>
        <textarea value={supervisorNotes} onChange={(e) => setSupervisorNotes(e.target.value)} placeholder="Catatan hasil observasi, rekomendasi..." rows={4} className="w-full rounded-xl border border-[#d8deeb] px-4 py-3 text-[13px] text-[#25365f] placeholder:text-[#a3adc2] focus:border-[#35557c] focus:outline-none" />
      </Modal>
    </div>
  );
}
