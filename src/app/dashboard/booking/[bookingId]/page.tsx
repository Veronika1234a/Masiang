"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useDashboard } from "@/lib/DashboardContext";
import { openBookingPrintReport } from "@/lib/bookingPrint";
import { formatLongDateID, type BookingStatus } from "@/lib/userDashboardData";

function getStatusBadgeClasses(status: BookingStatus) {
  if (status === "Disetujui") return "bg-[#d8eef0] text-[#2d7480]";
  if (status === "Dalam Proses") return "bg-[#fff2de] text-[#ad7a2c]";
  if (status === "Selesai") return "bg-[#d9e7df] text-[#205930]";
  if (status === "Ditolak") return "bg-[#ffe9e9] text-[#812f2f]";
  if (status === "Dibatalkan") return "bg-[#f0eef2] text-[#6d7998]";
  return "bg-[#dce7fb] text-[#496b9f]";
}

export default function BookingDetailPage() {
  const params = useParams<{ bookingId: string }>();
  const { bookings, documents, histories, rateBooking, uploadDocument, cancelBooking, addToast, dashboardLoading } = useDashboard();
  const booking = bookings.find((b) => b.id === params.bookingId);

  const [ratingValue, setRatingValue] = useState(0);
  const [feedbackValue, setFeedbackValue] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (dashboardLoading) {
    return (
      <main className="text-[#121d35] w-full pb-10">
        <div className="mx-auto max-w-[800px] text-center py-20">
          <h1 className="font-[var(--font-fraunces)] text-3xl font-medium text-[#121d35]">Memuat booking...</h1>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="text-[#121d35] w-full pb-10">
        <div className="mx-auto max-w-[800px] text-center py-20">
          <h1 className="font-[var(--font-fraunces)] text-3xl font-medium text-[#121d35]">Booking tidak ditemukan</h1>
          <p className="mt-3 text-[15px] text-[#4f5b77]">Booking dengan ID {params.bookingId} tidak tersedia.</p>
          <Link href="/dashboard/booking" className="mt-6 inline-block rounded-xl bg-[#d2ac50] px-6 py-3 text-[13px] font-bold text-white hover:bg-[#b8933d]">Kembali ke Booking</Link>
        </div>
      </main>
    );
  }

  const relatedDocs = documents.filter((d) => d.bookingId === booking.id);
  const linkedHistoryId = histories.find((h) => h.bookingId === booking.id)?.id ?? null;
  const canRate = booking.status === "Selesai" && !booking.rating && !ratingSubmitted;
  const canCancel = booking.status === "Menunggu" || booking.status === "Disetujui";
  const activeTimelineItem = booking.timeline.find((item) => item.status === "active") ?? null;

  const handleRate = async () => {
    if (ratingValue > 0) {
      try {
        await rateBooking(booking.id, ratingValue, feedbackValue.trim());
        setRatingSubmitted(true);
      } catch {
        // Error toast is handled in context.
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) {
      e.target.value = "";
      return;
    }

    setIsUploadingDoc(true);
    try {
      for (const file of files) {
        try {
          await uploadDocument(file.name, "Pelaksanaan", file.size, file.type, booking.id, file);
        } catch {
          // Error toast is handled in context.
        }
      }
    } finally {
      setIsUploadingDoc(false);
    }
    e.target.value = "";
  };

  return (
    <main className="text-[#121d35] w-full pb-10">
      <div className="mx-auto max-w-[800px]">

        <nav className="mb-8 flex items-center gap-2 text-[12px] font-bold text-[#6d7998]">
          <Link href="/dashboard/booking" className="transition-colors hover:text-[#25365f]">Booking</Link>
          <span>/</span>
          <span className="text-[#25365f]">{booking.id}</span>
        </nav>

        <header className="mb-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center rounded-md px-3 py-1.5 text-[11px] font-bold ${getStatusBadgeClasses(booking.status)}`}>
              {booking.status.toUpperCase()}
            </span>
            {booking.rating && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#fff7e8] px-3 py-1.5 text-[11px] font-bold text-[#ad7a2c]">
                {"★".repeat(booking.rating)}{"☆".repeat(5 - booking.rating)}
              </span>
            )}
          </div>
          <h1 className="m-0 font-[var(--font-fraunces)] text-[clamp(28px,3vw,42px)] font-medium leading-[1.2] text-[#121d35]">
            {booking.topic}
          </h1>
        </header>

        {/* Info Grid */}
        <section className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 rounded-2xl border border-[#e1dce8] bg-[#f9f8fc] p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Sekolah / Instansi</span>
            <p className="text-[15px] font-semibold text-[#25365f]">{booking.school}</p>
          </div>
          <div className="flex flex-col gap-1.5 md:border-l md:border-[#cfd5e6] md:pl-6">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Kategori Layanan</span>
            <p className="text-[14px] font-semibold text-[#25365f]">{booking.category ?? "—"}</p>
          </div>
          <div className="flex flex-col gap-1.5 md:border-l md:border-[#cfd5e6] md:pl-6">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Tanggal Sesi</span>
            <p className="text-[14px] font-semibold text-[#25365f]">{formatLongDateID(booking.dateISO)}</p>
          </div>
          <div className="flex flex-col gap-1.5 md:border-l md:border-[#cfd5e6] md:pl-6">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Waktu</span>
            <p className="text-[14px] font-semibold text-[#25365f]">{booking.session}</p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-[#e1dce8] bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Status Sesi</p>
              <p className="mt-2 text-[15px] font-semibold text-[#25365f]">{booking.status}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Tahap Aktif</p>
              <p className="mt-2 text-[15px] font-semibold text-[#25365f]">{activeTimelineItem?.title ?? "Menunggu pembaruan admin"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Upload Terkait</p>
              <p className="mt-2 text-[15px] font-semibold text-[#25365f]">Tahap Pelaksanaan</p>
            </div>
          </div>
        </section>

        {/* Cancel reason or supervisor notes */}
        {booking.cancelReason && (
          <section className="mb-8 rounded-xl border border-[#f0b8b8] bg-[#ffe9e9] p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#812f2f] mb-2">
              {booking.status === "Ditolak" ? "Alasan Penolakan" : "Alasan Pembatalan"}
            </p>
            <p className="text-[14px] leading-[1.6] text-[#6b2020]">{booking.cancelReason}</p>
          </section>
        )}

        {booking.supervisorNotes && (
          <section className="mb-8 rounded-xl border border-[#d5dff0] bg-[#eef3ff] p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#2d4a7a] mb-2">Catatan Pengawas</p>
            <p className="text-[14px] leading-[1.6] text-[#2d4a7a]">{booking.supervisorNotes}</p>
          </section>
        )}

        {/* Goal & Notes */}
        {(booking.goal || booking.notes) && (
          <section className="mb-12 grid gap-4 md:grid-cols-2">
            {booking.goal && (
              <div className="rounded-xl border border-[#e1dce8] bg-white p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998] mb-2">Tujuan</p>
                <p className="text-[14px] leading-[1.6] text-[#25365f]">{booking.goal}</p>
              </div>
            )}
            {booking.notes && (
              <div className="rounded-xl border border-[#e1dce8] bg-white p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998] mb-2">Catatan</p>
                <p className="text-[14px] leading-[1.6] text-[#25365f]">{booking.notes}</p>
              </div>
            )}
          </section>
        )}

        {/* Timeline */}
        <section className="mb-12">
          <h2 className="mb-6 text-[14px] font-bold text-[#2d3e67] border-b border-[#e1dce8] pb-3">Timeline Aktivitas</h2>
          <div className="pl-2">
            <ol className="relative border-l-2 border-[#e1dce8]">
              {booking.timeline.map((item, idx) => {
                const isLast = idx === booking.timeline.length - 1;
                let dotClass = "bg-[#f3f2f8] border-[#cfd5e6]";
                if (item.status === "done") dotClass = "bg-[#25365f] border-[#25365f]";
                else if (item.status === "active") dotClass = "bg-[#d4a95c] border-[#d4a95c] ring-4 ring-[#fff2de]";
                return (
                  <li key={item.title} className={`${isLast ? "" : "mb-8"} pl-8 relative`}>
                    <span className={`absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 ${dotClass}`} />
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div>
                        <h3 className={`text-[15px] font-bold ${item.status !== "pending" ? "text-[#25365f]" : "text-[#6d7998]"}`}>{item.title}</h3>
                        <p className={`mt-1 text-[13px] ${item.status !== "pending" ? "text-[#4f5b77]" : "text-[#a3adc2]"}`}>{item.note}</p>
                      </div>
                      <span className={`text-[12px] font-bold ${item.status !== "pending" ? "text-[#313f61]" : "text-[#a3adc2]"}`}>{item.time}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Documents */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 border-b border-[#e1dce8] pb-3">
            <h2 className="text-[14px] font-bold text-[#2d3e67]">Dokumen Terkait</h2>
            {(booking.status === "Dalam Proses" || booking.status === "Disetujui") && (
              <>
                <input ref={fileRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={isUploadingDoc} className="rounded-lg border border-[#c79a3c] bg-[#d2ac50] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:bg-[#b8933d] disabled:cursor-not-allowed disabled:opacity-60">
                  {isUploadingDoc ? "Mengunggah..." : "Upload"}
                </button>
              </>
            )}
          </div>
          {(booking.status === "Dalam Proses" || booking.status === "Disetujui") && (
            <p className="mb-4 text-[12px] text-[#6d7998]">
              Dokumen dari halaman ini otomatis disimpan ke tahap <span className="font-bold text-[#25365f]">Pelaksanaan</span> untuk sesi {booking.session}.
            </p>
          )}
          {relatedDocs.length > 0 ? (
            <div className="flex flex-col rounded-xl border border-[#e1dce8] bg-white overflow-hidden shadow-sm">
              {relatedDocs.map((doc, i) => (
                <div key={doc.id} className={`flex items-center justify-between p-4 transition-colors hover:bg-[#f9f8fc] ${i !== relatedDocs.length - 1 ? "border-b border-[#e1dce8]" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f3f2f8] text-[#4a5f8e]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[14px] font-semibold text-[#25365f] truncate block">{doc.fileName}</span>
                      <span className="text-[11px] text-[#6d7998]">{doc.uploadedAt}</span>
                    </div>
                  </div>
                  {doc.reviewStatus && (
                    <span className={`text-[10px] font-bold uppercase rounded-md px-2 py-1 ${
                      doc.reviewStatus === "Disetujui" ? "bg-[#d9e7df] text-[#205930]" :
                      doc.reviewStatus === "Perlu Revisi" ? "bg-[#ffe9e9] text-[#812f2f]" :
                      "bg-[#eef3ff] text-[#2d4a7a]"
                    }`}>{doc.reviewStatus}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-[#e1dce8] bg-[#f9f8fc] p-6 text-center text-[14px] text-[#6d7998]">
              Belum ada dokumen terkait booking ini.
              {(booking.status === "Dalam Proses" || booking.status === "Disetujui") && " Klik Upload untuk menambahkan."}
            </p>
          )}
        </section>

        {/* Rating */}
        {canRate && (
          <section className="mb-12 rounded-2xl border border-[#e8dec1] bg-[#fff7e8] p-6 shadow-sm">
            <h2 className="text-[14px] font-bold text-[#8a5e1a] mb-4">Berikan Rating & Feedback</h2>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRatingValue(star)} className={`text-[28px] transition-transform hover:scale-110 ${ratingValue >= star ? "text-[#d2ac50]" : "text-[#d5dbea]"}`}>
                  ★
                </button>
              ))}
            </div>
            <textarea rows={3} value={feedbackValue} onChange={(e) => setFeedbackValue(e.target.value)} placeholder="Bagikan pengalaman Anda selama sesi..." className="w-full rounded-xl border border-[#e8dec1] bg-white px-4 py-3 text-[14px] text-[#313f61] outline-none focus:border-[#d2ac50] mb-4" />
            <button type="button" onClick={handleRate} disabled={ratingValue === 0} className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-40 hover:bg-[#b8933d]">
              Kirim Rating
            </button>
          </section>
        )}

        {ratingSubmitted && (
          <section className="mb-12 rounded-xl border border-[#d9e7df] bg-[#eef8f2] p-5">
            <p className="text-[14px] font-semibold text-[#205930]">Terima kasih! Rating dan feedback berhasil disimpan.</p>
          </section>
        )}

        {booking.feedback && !canRate && !ratingSubmitted && (
          <section className="mb-12 rounded-xl border border-[#e8dec1] bg-[#fff7e8] p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a5e1a] mb-2">Feedback Anda</p>
            <p className="text-[14px] leading-[1.6] text-[#6b4f1a]">{booking.feedback}</p>
          </section>
        )}

        {/* Actions */}
        <section className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/dashboard/booking" className="flex-1 rounded-lg border border-[#cfd5e6] bg-[#f9f8fc] px-4 py-3 text-center text-[13px] font-bold text-[#4f5b77] transition-colors hover:bg-[#eef1f8] hover:text-[#25365f]">
            Kembali
          </Link>
          {canCancel && (
            <button type="button" onClick={() => setCancelOpen(true)} className="flex-1 rounded-lg border border-[#e8c4c4] bg-[#fff5f5] px-4 py-3 text-center text-[13px] font-bold text-[#a13636] transition-colors hover:bg-[#ffe9e9]">
              Batalkan Booking
            </button>
          )}
          <Link href={linkedHistoryId ? `/dashboard/riwayat/${linkedHistoryId}` : "/dashboard/riwayat"} className="flex-1 rounded-lg bg-[#d2ac50] px-4 py-3 text-center text-[13px] font-bold text-white transition-colors hover:bg-[#b8933d]">
            Lihat Riwayat Sesi
          </Link>
          <button type="button" onClick={() => {
            const opened = openBookingPrintReport({
              booking,
              documents: relatedDocs,
              history: histories.find((item) => item.bookingId === booking.id) ?? null,
            });

            if (!opened) {
              addToast("Popup cetak diblokir browser. Izinkan popup lalu coba lagi.", "error");
            }
          }} className="flex-1 rounded-lg border border-[#cfd5e6] bg-white px-4 py-3 text-center text-[13px] font-bold text-[#4f5b77] transition-colors hover:bg-[#eef1f8]">
            Cetak
          </button>
        </section>
      </div>

      <Modal open={cancelOpen} onClose={() => { setCancelOpen(false); setCancelReason(""); }} title="Batalkan Booking" footer={
        <>
          <button type="button" onClick={() => setCancelOpen(false)} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-2.5 text-[12px] font-bold text-[#4f5b77] hover:bg-[#eef1f8]">Kembali</button>
          <button type="button" onClick={async () => {
            try {
              await cancelBooking(booking.id, cancelReason.trim());
              setCancelOpen(false);
            } catch {
              // Error toast is handled in context.
            }
          }} disabled={!cancelReason.trim()} className="rounded-xl bg-[#c44444] px-4 py-2.5 text-[12px] font-bold text-white disabled:opacity-40 hover:bg-[#a13636]">Ya, Batalkan</button>
        </>
      }>
        <p className="text-[14px] leading-[1.6] text-[#4f5b77] mb-4">Masukkan alasan pembatalan:</p>
        <textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Alasan pembatalan..." className="w-full rounded-xl border border-[#d7deef] bg-white px-3 py-3 text-[14px] text-[#313f61] outline-none focus:border-[#b7c4df]" />
      </Modal>
    </main>
  );
}
