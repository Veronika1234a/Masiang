"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useDashboard } from "@/lib/DashboardContext";
import {
  isDirectDownloadPath,
  resolveDownloadUrl,
} from "@/lib/supabase/services/storage";
import { type RiwayatItem, type SchoolDocument } from "@/lib/userDashboardData";

function resolveSchoolName(
  document: SchoolDocument,
  registeredSchools: ReturnType<typeof useAuth>["registeredSchools"],
  bookings: ReturnType<typeof useDashboard>["bookings"],
  histories: RiwayatItem[],
) {
  const registeredSchool = document.schoolId
    ? registeredSchools.find((school) => school.id === document.schoolId)
    : null;
  if (registeredSchool) return registeredSchool.schoolName;

  const bookingSchool = document.bookingId
    ? bookings.find((booking) => booking.id === document.bookingId)?.school
    : document.schoolId
      ? bookings.find((booking) => booking.schoolId === document.schoolId)?.school
      : null;
  if (bookingSchool) return bookingSchool;

  const historySchool = document.historyId
    ? histories.find((history) => history.id === document.historyId)?.school
    : document.schoolId
      ? histories.find((history) => history.schoolId === document.schoolId)?.school
      : null;
  return historySchool ?? "Sekolah belum teridentifikasi";
}

function getReviewTone(status?: string) {
  switch (status) {
    case "Disetujui":
      return "bg-[#e8f3ee] text-[#2b5f52]";
    case "Perlu Revisi":
      return "bg-[#fff3e4] text-[#c56400]";
    default:
      return "bg-[#eef4fb] text-[#35557c]";
  }
}

function getDocumentKind(document: SchoolDocument) {
  if (document.mimeType === "text/uri-list") return "Link";
  if ((document.mimeType ?? "").startsWith("image/")) return "Foto";
  if ((document.mimeType ?? "").startsWith("video/")) return "Video";
  if (document.storagePath && /^https?:\/\//i.test(document.storagePath)) return "Link";
  return "Dokumen";
}

function getActionLabel(document: SchoolDocument) {
  return getDocumentKind(document) === "Link" ? "Buka Link" : "Unduh";
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDetailDokumenPage() {
  const searchParams = useSearchParams();
  const { registeredSchools } = useAuth();
  const { documents, bookings, histories, addToast, dashboardLoading } = useDashboard();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const documentId = searchParams.get("documentId");
  const selectedDocument = documentId
    ? documents.find((document) => document.id === documentId) ?? null
    : null;

  const selectedSchoolId = selectedDocument?.schoolId
    ?? (selectedDocument?.bookingId
      ? bookings.find((booking) => booking.id === selectedDocument.bookingId)?.schoolId
      : undefined)
    ?? (selectedDocument?.historyId
      ? histories.find((history) => history.id === selectedDocument.historyId)?.schoolId
      : undefined);

  const selectedSchoolName = selectedDocument
    ? resolveSchoolName(selectedDocument, registeredSchools, bookings, histories)
    : null;
  const shouldWaitForData = dashboardLoading && Boolean(documentId);

  const relatedDocuments = useMemo(() => {
    if (!selectedDocument) return [];

    return documents.filter((document) => {
      if (selectedSchoolId && document.schoolId) {
        return document.schoolId === selectedSchoolId;
      }

      if (selectedDocument.bookingId && document.bookingId) {
        return document.bookingId === selectedDocument.bookingId;
      }

      if (selectedDocument.historyId && document.historyId) {
        return document.historyId === selectedDocument.historyId;
      }

      return document.id === selectedDocument.id;
    });
  }, [documents, selectedDocument, selectedSchoolId]);

  const handleOpen = async (document: SchoolDocument) => {
    if (!document.storagePath) {
      addToast(`Dokumen "${document.fileName}" belum memiliki file yang bisa dibuka.`, "info");
      return;
    }

    if (isDirectDownloadPath(document.storagePath)) {
      window.open(document.storagePath, "_blank", "noopener,noreferrer");
      return;
    }

    setDownloadingId(document.id);
    try {
      const downloadUrl = await resolveDownloadUrl(document.storagePath);
      if (!downloadUrl) {
        addToast(`Gagal membuat tautan untuk "${document.fileName}".`, "error");
        return;
      }

      if (document.mimeType === "text/uri-list" || /^https?:\/\//i.test(downloadUrl)) {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const link = window.document.createElement("a");
      link.href = downloadUrl;
      link.download = document.fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <main className="w-full pb-10 text-[#25365f]">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
        <nav className="flex items-center gap-2 text-[12px] font-bold text-[#6d7998]">
          <Link href="/dashboard-admin/dokumen" className="transition-colors hover:text-[#25365f]">
            Review Dokumen
          </Link>
          <span>/</span>
          <span className="text-[#25365f]">{selectedDocument?.id ?? "Detail"}</span>
        </nav>

        <header className="rounded-[32px] border border-[#e2dde8] bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">
                Dokumen Sekolah
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-fraunces)] text-[clamp(28px,3.2vw,44px)] leading-[1.05] text-[#25365f]">
                {selectedDocument ? selectedDocument.fileName : "Detail dokumen tidak ditemukan"}
              </h1>
              <p className="mt-4 text-[15px] leading-[1.75] text-[#5d6780]">
                {selectedDocument
                  ? `Lihat konteks dokumen, status review, lalu buka file atau tautan terkait dari sekolah ${selectedSchoolName}.`
                  : "Pilih dokumen dari halaman review dokumen atau semua dokumen untuk melihat detailnya."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard-admin/dokumen"
                className="rounded-xl border border-[#d8deeb] bg-white px-4 py-3 text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]"
              >
                Kembali ke Review
              </Link>
              <Link
                href="/dashboard-admin/semua-dokumen"
                className="rounded-xl border border-[#d8deeb] bg-[#f8f7fb] px-4 py-3 text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]"
              >
                Semua Dokumen
              </Link>
            </div>
          </div>
        </header>

        {shouldWaitForData ? (
          <section className="rounded-[28px] border border-[#e2dde8] bg-white px-6 py-12 text-center text-[15px] text-[#6d7998] shadow-sm">
            Memuat detail dokumen...
          </section>
        ) : selectedDocument ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[24px] border border-[#e2dde8] bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6d7998]">Sekolah</p>
                <p className="mt-3 text-[16px] font-semibold text-[#25365f]">{selectedSchoolName}</p>
              </article>
              <article className="rounded-[24px] border border-[#e2dde8] bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6d7998]">Tahap</p>
                <p className="mt-3 text-[16px] font-semibold text-[#25365f]">{selectedDocument.stage}</p>
              </article>
              <article className="rounded-[24px] border border-[#e2dde8] bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6d7998]">Status Review</p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold ${getReviewTone(selectedDocument.reviewStatus)}`}>
                  {selectedDocument.reviewStatus ?? "Menunggu Review"}
                </span>
              </article>
              <article className="rounded-[24px] border border-[#e2dde8] bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6d7998]">Versi & Jenis</p>
                <p className="mt-3 text-[16px] font-semibold text-[#25365f]">
                  v{selectedDocument.version ?? 1} • {getDocumentKind(selectedDocument)}
                </p>
              </article>
            </section>

            <section className="rounded-[28px] border border-[#e2dde8] bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-[#ece6f1] px-6 py-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6d7998]">
                    Arsip Terkait
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-fraunces)] text-[30px] text-[#25365f]">
                    Dokumen dari konteks yang sama.
                  </h2>
                </div>
                <p className="text-[13px] text-[#6d7998]">{relatedDocuments.length} item</p>
              </div>

              <div className="divide-y divide-[#ece6f1]">
                {relatedDocuments.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-[#fcfbfd] lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a96b1]">{item.id}</span>
                        <span className="inline-flex rounded-full bg-[#eef4fb] px-3 py-1 text-[10px] font-bold uppercase text-[#35557c]">
                          {item.stage}
                        </span>
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase ${getReviewTone(item.reviewStatus)}`}>
                          {item.reviewStatus ?? "Menunggu Review"}
                        </span>
                      </div>
                      <h3 className="mt-3 truncate text-[18px] font-semibold text-[#25365f]">{item.fileName}</h3>
                      <p className="mt-2 text-[14px] leading-[1.7] text-[#5d6780]">
                        {item.uploadedAt} • {formatFileSize(item.fileSize)} • {getDocumentKind(item)}
                      </p>
                      {item.reviewerNotes ? (
                        <p className="mt-2 text-[13px] leading-[1.7] text-[#c56400]">
                          Catatan review: {item.reviewerNotes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.bookingId ? (
                        <Link
                          href={`/dashboard-admin/booking/${item.bookingId}`}
                          className="rounded-xl border border-[#d8deeb] bg-white px-4 py-3 text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]"
                        >
                          Lihat Booking
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        disabled={!item.storagePath || downloadingId === item.id}
                        onClick={() => void handleOpen(item)}
                        className="rounded-xl border border-[#ffb660] bg-[#fff3e2] px-4 py-3 text-[12px] font-bold uppercase text-[#d96f05] hover:bg-[#ffe7c9] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {downloadingId === item.id ? "Membuka..." : item.storagePath ? getActionLabel(item) : "Tidak Tersedia"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-[28px] border border-[#e2dde8] bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="font-[family-name:var(--font-fraunces)] text-[28px] text-[#25365f]">
              Dokumen yang dipilih tidak tersedia
            </h2>
            <p className="mt-3 text-[15px] leading-[1.7] text-[#6d7998]">
              Dokumen mungkin sudah dihapus atau belum pernah diunggah.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
