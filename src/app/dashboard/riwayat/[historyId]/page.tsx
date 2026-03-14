"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useDashboard } from "@/lib/DashboardContext";
import { getSignedUrl } from "@/lib/supabase/services/storage";
import {
  formatLongDateID,
  getDateDiffFromToday,
  type RiwayatDocumentCategory,
  type RiwayatStatus,
} from "@/lib/userDashboardData";

function getStatusClasses(status: RiwayatStatus) {
  if (status === "Selesai") return "bg-[#d8eef0] text-[#2d7480]";
  if (status === "Laporan") return "bg-[#dce7fb] text-[#496b9f]";
  return "bg-[#fff2de] text-[#ad7a2c]";
}

function getCategoryClasses(category: RiwayatDocumentCategory) {
  if (category === "Laporan") return "bg-[#eef4ff] text-[#496b9f]";
  if (category === "Lampiran") return "bg-[#eaf6f7] text-[#2d7480]";
  return "bg-[#fff2de] text-[#ad7a2c]";
}

function getFollowUpLabel(dateISO?: string) {
  if (!dateISO) return null;
  const diff = getDateDiffFromToday(dateISO);
  if (diff < 0) return { text: "Follow-up terlewat", tone: "danger" as const };
  if (diff === 0) return { text: "Follow-up hari ini", tone: "danger" as const };
  if (diff === 1) return { text: "Follow-up besok", tone: "warning" as const };
  if (diff > 1) return { text: `Follow-up ${diff} hari lagi`, tone: "warning" as const };
  return null;
}

export default function HistoryDetailPage() {
  const params = useParams<{ historyId: string }>();
  const { histories, documents, toggleFollowUpItem, markFollowUpDone, addToast } = useDashboard();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const history = histories.find((h) => h.id === params.historyId);

  if (!history) {
    return (
      <main className="text-[#121d35] w-full pb-10">
        <div className="mx-auto max-w-[800px] text-center py-20">
          <h1 className="font-[var(--font-fraunces)] text-3xl font-medium">Riwayat tidak ditemukan</h1>
          <p className="mt-3 text-[15px] text-[#4f5b77]">Riwayat dengan ID {params.historyId} tidak tersedia.</p>
          <Link href="/dashboard/riwayat" className="mt-6 inline-block rounded-xl bg-[#d2ac50] px-6 py-3 text-[13px] font-bold text-white hover:bg-[#b8933d]">Kembali ke Riwayat</Link>
        </div>
      </main>
    );
  }

  const followUpLabel = getFollowUpLabel(history.followUpISO);
  const allFollowUpsDone = history.followUpItems?.every((fi) => fi.done) ?? false;

  const handleDownload = async (documentId: string, fileName: string) => {
    const fullDocument = documents.find((item) => item.id === documentId);
    if (!fullDocument?.storagePath) {
      addToast(`Dokumen "${fileName}" belum tersedia untuk diunduh.`, "info");
      return;
    }

    setDownloadingId(documentId);
    try {
      const signedUrl = await getSignedUrl(fullDocument.storagePath);
      if (!signedUrl) {
        addToast(`Gagal membuat link unduhan untuk "${fileName}".`, "error");
        return;
      }

      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <main className="w-full pb-10 text-[#121d35]">
      <div className="mx-auto flex max-w-[980px] flex-col gap-8">
        <nav className="flex items-center gap-2 text-[12px] font-bold text-[#6d7998]">
          <Link href="/dashboard/riwayat" className="transition-colors hover:text-[#25365f]">Riwayat</Link>
          <span>/</span>
          <span className="text-[#25365f]">{history.id}</span>
        </nav>

        <header className="rounded-[28px] border border-[#e1dce8] bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-md px-3 py-1.5 text-[11px] font-bold uppercase ${getStatusClasses(history.status)}`}>{history.status}</span>
                {followUpLabel && (
                  <span className={`inline-flex rounded-md border px-3 py-1.5 text-[11px] font-bold uppercase ${
                    followUpLabel.tone === "danger" ? "border-[#f0b8b8] bg-[#ffe9e9] text-[#812f2f]" : "border-[#f1d9a8] bg-[#fff7e8] text-[#ad7a2c]"
                  }`}>{followUpLabel.text}</span>
                )}
                {history.followUpDone && <span className="inline-flex rounded-md bg-[#d9e7df] px-3 py-1.5 text-[11px] font-bold uppercase text-[#205930]">Tindak Lanjut Selesai</span>}
              </div>
              <h1 className="mt-5 font-[var(--font-fraunces)] text-[clamp(28px,3vw,42px)] font-medium leading-[1.15] text-[#121d35]">{history.title}</h1>
              <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-[#4f5b77]">{history.description}</p>
            </div>
            <div className="flex w-full flex-col gap-2 xl:w-[240px]">
              <Link href="/dashboard/riwayat" className="rounded-xl border border-[#cfd5e6] bg-[#f9f8fc] px-4 py-3 text-center text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]">Kembali ke Riwayat</Link>
              {history.bookingId && (
                <Link href={`/dashboard/booking/${history.bookingId}`} className="rounded-xl border border-[#cfd5e6] bg-white px-4 py-3 text-center text-[12px] font-bold uppercase text-[#4a6baf] hover:bg-[#eef1f8]">Lihat Booking {history.bookingId}</Link>
              )}
              <Link href="/dashboard/booking-jadwal" className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-center text-[12px] font-bold uppercase text-white hover:bg-[#b8933d]">Buka Kalender</Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#e1dce8] bg-[#fbfaf8] p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Sekolah</p>
            <p className="mt-3 text-[15px] font-semibold text-[#25365f]">{history.school}</p>
          </article>
          <article className="rounded-2xl border border-[#e1dce8] bg-[#fbfaf8] p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Tanggal Sesi</p>
            <p className="mt-3 text-[15px] font-semibold text-[#25365f]">{formatLongDateID(history.dateISO)}</p>
          </article>
          <article className="rounded-2xl border border-[#e1dce8] bg-[#fbfaf8] p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Sesi</p>
            <p className="mt-3 text-[15px] font-semibold text-[#25365f]">{history.session}</p>
          </article>
        </section>

        {/* Supervisor Notes */}
        {history.supervisorNotes && (
          <section className="rounded-xl border border-[#d5dff0] bg-[#eef3ff] p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#2d4a7a] mb-2">Catatan Pengawas</p>
            <p className="text-[14px] leading-[1.6] text-[#2d4a7a]">{history.supervisorNotes}</p>
          </section>
        )}

        {/* Follow-up Checklist */}
        {history.followUpItems && history.followUpItems.length > 0 && (
          <section className="rounded-[28px] border border-[#e1dce8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e1dce8] pb-4 mb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Tindak Lanjut</p>
                <h2 className="mt-2 font-[var(--font-fraunces)] text-[24px] font-medium text-[#121d35]">Checklist</h2>
              </div>
              {!allFollowUpsDone && !history.followUpDone && (
                <button type="button" onClick={() => markFollowUpDone(history.id)} className="rounded-xl border border-[#2d7480] bg-[#2d7480] px-4 py-2.5 text-[11px] font-bold uppercase text-white hover:bg-[#246168]">
                  Tandai Semua Selesai
                </button>
              )}
            </div>
            <div className="space-y-3">
              {history.followUpItems.map((fi) => (
                <label key={fi.id} className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${fi.done ? "border-[#d9e7df] bg-[#f5faf7]" : "border-[#e1dce8] bg-[#fbfaf8] hover:bg-[#f5f3f7]"}`}>
                  <input type="checkbox" checked={fi.done} onChange={() => toggleFollowUpItem(history.id, fi.id)} className="mt-0.5 h-4 w-4 rounded border-[#cfd5e6] accent-[#2d7480]" />
                  <span className={`text-[14px] leading-[1.5] ${fi.done ? "text-[#6d7998] line-through" : "text-[#25365f] font-medium"}`}>{fi.text}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        {/* Documents */}
        <section className="rounded-[28px] border border-[#e1dce8] bg-[#f9f8fc] p-6 shadow-sm">
          <div className="flex items-end justify-between border-b border-[#e1dce8] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Dokumen Terkait</p>
              <h2 className="mt-2 font-[var(--font-fraunces)] text-[28px] font-medium text-[#121d35]">Arsip sesi {history.id}</h2>
            </div>
            <p className="text-[13px] text-[#6d7998]">{history.documents.length} file</p>
          </div>
          {history.documents.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-[#e1dce8] bg-white p-8 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c5cee0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              <p className="text-[13px] text-[#6d7998]">Belum ada dokumen untuk sesi ini.</p>
            </div>
          ) : (
            <div className="mt-5 flex flex-col overflow-hidden rounded-2xl border border-[#e1dce8] bg-white">
              {history.documents.map((doc, index) => {
                const linkedDocument = documents.find((item) => item.id === doc.id);

                return (
                  <article key={doc.id} className={`flex flex-col gap-4 p-5 transition-colors hover:bg-[#fcfbff] md:flex-row md:items-center md:justify-between ${index < history.documents.length - 1 ? "border-b border-[#e9e3ee]" : ""}`}>
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dde3f0] bg-[#f3f2f8] text-[#4f5b77]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold text-[#25365f]">{doc.fileName}</h3>
                        <p className="mt-1 text-[13px] text-[#6d7998]">Diunggah {doc.uploadedAt}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex rounded-md px-3 py-1.5 text-[11px] font-bold uppercase ${getCategoryClasses(doc.category)}`}>{doc.category}</span>
                      <button type="button" disabled={!linkedDocument?.storagePath || downloadingId === doc.id} onClick={() => void handleDownload(doc.id, doc.fileName)} className="rounded-lg border border-[#cfd5e6] bg-[#f9f8fc] px-3 py-2 text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8] disabled:cursor-not-allowed disabled:opacity-50">
                        {downloadingId === doc.id ? "Memuat..." : linkedDocument?.storagePath ? "Unduh" : "Tidak Tersedia"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
