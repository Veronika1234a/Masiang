"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useDashboard } from "@/lib/DashboardContext";
import { ALL_STAGES, type DocumentReviewStatus, type SchoolDocument } from "@/lib/userDashboardData";
import {
  getSeedDocumentDownloadUrl,
  getSignedUrl,
  isDirectDownloadPath,
} from "@/lib/supabase/services/storage";

const ALL_REVIEW_STATUSES: DocumentReviewStatus[] = [
  "Menunggu Review",
  "Disetujui",
  "Perlu Revisi",
];
const FILTER_PILL_CLASS_NAME =
  "rounded-full border px-4 py-2.5 text-[12px] font-bold transition-colors";
const INPUT_CLASS_NAME =
  "min-h-12 w-full rounded-2xl border border-[#d5dceb] bg-white px-4 text-[14px] font-medium text-[#25365f] placeholder:text-[#8f9ab3] shadow-[0_8px_24px_-20px_rgba(37,54,95,0.35)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#35557c] focus:shadow-[0_10px_28px_-18px_rgba(53,85,124,0.35)]";

function getReviewClasses(status: string) {
  switch (status) {
    case "Disetujui":
      return "bg-[#e8f3ee] text-[#2b5f52]";
    case "Perlu Revisi":
      return "bg-[#fff6e6] text-[#9b6a1d]";
    default:
      return "bg-[#eef4fb] text-[#35557c]";
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentActionLabel(document: SchoolDocument): string {
  if (document.mimeType === "text/uri-list") {
    return "Buka Link";
  }

  if (document.storagePath && /^https?:\/\//i.test(document.storagePath)) {
    return "Buka Link";
  }

  return "Unduh";
}

export default function AdminDokumenPage() {
  const { documents, reviewDocument, addToast } = useDashboard();

  const [filterReview, setFilterReview] = useState<string>("Semua");
  const [filterStage, setFilterStage] = useState<string>("Semua");

  const [reviewModalId, setReviewModalId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"Disetujui" | "Perlu Revisi">("Disetujui");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (doc: SchoolDocument) => {
    const seedDownloadUrl = getSeedDocumentDownloadUrl(doc.id, doc.storagePath);
    if (!doc.storagePath && !seedDownloadUrl) {
      addToast(`Dokumen "${doc.fileName}" belum memiliki file yang bisa dibuka.`, "info");
      return;
    }

    if (doc.storagePath && isDirectDownloadPath(doc.storagePath)) {
      window.open(doc.storagePath, "_blank", "noopener,noreferrer");
      return;
    }

    setDownloadingId(doc.id);
    try {
      const signedUrl = doc.storagePath
        ? await getSignedUrl(doc.storagePath)
        : null;
      const downloadUrl = signedUrl ?? seedDownloadUrl;

      if (!downloadUrl) {
        addToast(`Gagal membuat tautan untuk "${doc.fileName}".`, "error");
        return;
      }

      if (doc.mimeType === "text/uri-list" || /^https?:\/\//i.test(downloadUrl)) {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const a = window.document.createElement("a");
      a.href = downloadUrl;
      a.download = doc.fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (error) {
      console.error("handleDownload error:", error);
      addToast(`Gagal membuka dokumen "${doc.fileName}".`, "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = useMemo(() => {
    let result = [...documents];

    if (filterReview !== "Semua") {
      result = result.filter((document) => document.reviewStatus === filterReview);
    }

    if (filterStage !== "Semua") {
      result = result.filter((document) => document.stage === filterStage);
    }

    return result;
  }, [documents, filterReview, filterStage]);

  const summaryCards = [
    {
      label: "Menunggu Review",
      value: documents.filter((document) => document.reviewStatus === "Menunggu Review").length,
      accent: "text-[#4b74b8]",
    },
    {
      label: "Perlu Revisi",
      value: documents.filter((document) => document.reviewStatus === "Perlu Revisi").length,
      accent: "text-[#cf6b12]",
    },
    {
      label: "Sudah Disetujui",
      value: documents.filter((document) => document.reviewStatus === "Disetujui").length,
      accent: "text-[#2f5a4b]",
    },
    {
      label: "Tampil Saat Ini",
      value: filtered.length,
      accent: "text-[#25365f]",
    },
  ];

  const openReviewModal = (id: string, action: "Disetujui" | "Perlu Revisi") => {
    const document = documents.find((item) => item.id === id);
    setReviewModalId(id);
    setReviewAction(action);
    setReviewNotes(action === "Perlu Revisi" ? (document?.reviewerNotes ?? "") : "");
  };

  const handleReview = async () => {
    if (!reviewModalId) return;

    setIsSubmittingReview(true);
    try {
      await reviewDocument(reviewModalId, reviewAction, reviewNotes.trim() || undefined);
      setReviewModalId(null);
      setReviewNotes("");
    } catch {
      // Error toast is handled in context.
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const reviewModalDoc = reviewModalId
    ? documents.find((document) => document.id === reviewModalId)
    : null;

  return (
    <div className="space-y-6 text-[#25365f]">
      <header className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6d7998]">
          Dashboard Admin &rsaquo; Review Dokumen
        </p>
        <h2 className="font-[family-name:var(--font-fraunces)] text-[24px] font-bold text-[#25365f]">
          Review Dokumen
        </h2>
        <p className="max-w-[700px] text-[14px] leading-7 text-[#5d6780]">
          Lihat dokumen yang perlu keputusan, identifikasi revisi yang menumpuk,
          lalu beri respons tanpa harus membaca tabel yang terlalu padat. Gunakan aksi
          <span className="font-semibold text-[#35557c]"> Unduh</span> atau
          <span className="font-semibold text-[#35557c]"> Buka Link</span> langsung dari tabel.
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
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b879f]">
              Status Review
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterReview("Semua")}
                className={`${FILTER_PILL_CLASS_NAME} ${
                  filterReview === "Semua"
                    ? "border-[#25365f] bg-[#25365f] text-white"
                    : "border-[#d8deeb] bg-white text-[#4f5b77] hover:bg-[#eef2f8]"
                }`}
              >
                Semua
              </button>
              {ALL_REVIEW_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterReview(status)}
                  className={`${FILTER_PILL_CLASS_NAME} ${
                    filterReview === status
                      ? "border-[#25365f] bg-[#25365f] text-white"
                      : "border-[#d8deeb] bg-white text-[#4f5b77] hover:bg-[#eef2f8]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b879f]">
              Tahap Dokumen
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterStage("Semua")}
                className={`${FILTER_PILL_CLASS_NAME} ${
                  filterStage === "Semua"
                    ? "border-[#25365f] bg-[#25365f] text-white"
                    : "border-[#d8deeb] bg-white text-[#4f5b77] hover:bg-[#eef2f8]"
                }`}
              >
                Semua
              </button>
              {ALL_STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setFilterStage(stage)}
                  className={`${FILTER_PILL_CLASS_NAME} ${
                    filterStage === stage
                      ? "border-[#25365f] bg-[#25365f] text-white"
                      : "border-[#d8deeb] bg-white text-[#4f5b77] hover:bg-[#eef2f8]"
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#e1dce8] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-[#e8e2ec]">
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">ID</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Nama File</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Tahap</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Ukuran</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Upload</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Versi</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Status</th>
                <th className="px-5 py-3.5 font-bold text-[#6d7998]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((document) => (
                  <tr key={document.id} className="border-b border-[#f3f1f5] last:border-0 hover:bg-[#fcfbfd]">
                    <td className="px-5 py-4 font-semibold text-[#35557c]">{document.id}</td>
                    <td className="px-5 py-4 max-w-[260px] text-[#4f5b77]">
                      <p className="truncate font-medium">{document.fileName}</p>
                      {document.reviewerNotes ? (
                        <p className="mt-1 text-[12px] leading-6 text-[#9b6a1d]">
                          Catatan: {document.reviewerNotes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-[#6d7998]">{document.stage}</td>
                    <td className="px-5 py-4 text-[13px] text-[#6d7998]">
                      {formatFileSize(document.fileSize)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-[13px] text-[#6d7998]">
                      {document.uploadedAt}
                    </td>
                    <td className="px-5 py-4 text-center text-[#6d7998]">v{document.version ?? 1}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block rounded-full px-3 py-1.5 text-[11px] font-bold ${getReviewClasses(document.reviewStatus ?? "")}`}>
                        {document.reviewStatus ?? "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {document.reviewStatus !== "Disetujui" ? (
                          <button
                            type="button"
                            onClick={() => openReviewModal(document.id, "Disetujui")}
                            className="rounded-xl bg-[#d2ac50] px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#b8933d]"
                          >
                            Setujui
                          </button>
                        ) : null}
                        {document.reviewStatus !== "Perlu Revisi" ? (
                          <button
                            type="button"
                            onClick={() => openReviewModal(document.id, "Perlu Revisi")}
                            className="rounded-xl border border-[#ead7b0] bg-[#fff8ed] px-3.5 py-2 text-[12px] font-bold text-[#9b6a1d] transition-colors hover:bg-[#fff3e1]"
                          >
                            Minta Revisi
                          </button>
                        ) : null}
                        {document.storagePath || getSeedDocumentDownloadUrl(document.id, document.storagePath) ? (
                          <button
                            type="button"
                            onClick={() => handleDownload(document)}
                            disabled={downloadingId === document.id}
                            className="rounded-xl border border-[#cfd5e6] bg-white px-3.5 py-2 text-[12px] font-bold text-[#4f5b77] transition-colors hover:bg-[#eef1f8] disabled:opacity-50"
                          >
                            {downloadingId === document.id ? "Membuka..." : getDocumentActionLabel(document)}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-[14px] text-[#6d7998]">
                    Tidak ada dokumen yang cocok dengan filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={reviewModalId !== null}
        onClose={() => setReviewModalId(null)}
        title={reviewAction === "Disetujui" ? "Setujui Dokumen" : "Minta Revisi Dokumen"}
        footer={
          <>
            <button
              type="button"
              onClick={() => setReviewModalId(null)}
              className="rounded-xl border border-[#d8deeb] px-4 py-2.5 text-[13px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleReview}
              disabled={isSubmittingReview || (reviewAction === "Perlu Revisi" && !reviewNotes.trim())}
              className={`rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition-colors disabled:opacity-40 ${
                reviewAction === "Disetujui"
                  ? "bg-[#d2ac50] hover:bg-[#b8933d]"
                  : "bg-[#b86b63] hover:bg-[#9f5a53]"
              }`}
            >
              {reviewAction === "Disetujui" ? "Konfirmasi Setujui" : "Konfirmasi Minta Revisi"}
            </button>
          </>
        }
      >
        {reviewModalDoc ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#ece6f1] bg-[#f8f7fb] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b879f]">Dokumen</p>
              <p className="mt-2 text-[15px] font-semibold text-[#25365f]">{reviewModalDoc.fileName}</p>
              <p className="mt-2 text-[13px] leading-6 text-[#6d7998]">
                Tahap {reviewModalDoc.stage} • diunggah {reviewModalDoc.uploadedAt}
              </p>
            </div>

            <label className="grid gap-2">
              <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7b879f]">
                Catatan {reviewAction === "Perlu Revisi" ? "(wajib)" : "(opsional)"}
              </span>
              <textarea
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder={
                  reviewAction === "Perlu Revisi"
                    ? "Jelaskan bagian yang perlu direvisi..."
                    : "Catatan tambahan (opsional)..."
                }
                rows={4}
                className={`${INPUT_CLASS_NAME} min-h-[132px] px-4 py-3`}
              />
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
