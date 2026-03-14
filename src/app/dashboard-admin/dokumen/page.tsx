"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "@/lib/DashboardContext";
import { Modal } from "@/components/ui/Modal";
import { type DocumentReviewStatus, ALL_STAGES } from "@/lib/userDashboardData";

const ALL_REVIEW_STATUSES: DocumentReviewStatus[] = ["Menunggu Review", "Disetujui", "Perlu Revisi"];

function getReviewClasses(status: string) {
  switch (status) {
    case "Disetujui": return "bg-[#d1fae5] text-[#065f46]";
    case "Perlu Revisi": return "bg-[#fef3c7] text-[#92400e]";
    default: return "bg-[#dbeafe] text-[#1e40af]";
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDokumenPage() {
  const { documents, reviewDocument } = useDashboard();

  const [filterReview, setFilterReview] = useState<string>("Semua");
  const [filterStage, setFilterStage] = useState<string>("Semua");

  // Review modal
  const [reviewModalId, setReviewModalId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"Disetujui" | "Perlu Revisi">("Disetujui");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const filtered = useMemo(() => {
    let result = [...documents];
    if (filterReview !== "Semua") {
      result = result.filter((d) => d.reviewStatus === filterReview);
    }
    if (filterStage !== "Semua") {
      result = result.filter((d) => d.stage === filterStage);
    }
    return result;
  }, [documents, filterReview, filterStage]);

  const openReviewModal = (id: string, action: "Disetujui" | "Perlu Revisi") => {
    const doc = documents.find((d) => d.id === id);
    setReviewModalId(id);
    setReviewAction(action);
    setReviewNotes(action === "Perlu Revisi" ? (doc?.reviewerNotes ?? "") : "");
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

  const reviewModalDoc = reviewModalId ? documents.find((d) => d.id === reviewModalId) : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6d7998]">Dashboard Admin &rsaquo; Review Dokumen</p>
        <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-[22px] font-bold text-[#25365f]">
          Review Dokumen
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#6d7998]">
          Review dan setujui dokumen yang diunggah oleh sekolah.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#6d7998]">Status Review</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterReview("Semua")}
              className={`rounded-full px-4 py-2 text-[11px] font-bold transition-colors ${filterReview === "Semua" ? "bg-[#25365f] text-white" : "bg-white border border-[#e1dce8] text-[#4f5b77] hover:bg-[#f5f3f7]"}`}
            >
              Semua
            </button>
            {ALL_REVIEW_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterReview(s)}
                className={`rounded-full px-4 py-2 text-[11px] font-bold transition-colors ${filterReview === s ? "bg-[#25365f] text-white" : "bg-white border border-[#e1dce8] text-[#4f5b77] hover:bg-[#f5f3f7]"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#6d7998]">Tahap</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterStage("Semua")}
              className={`rounded-full px-4 py-2 text-[11px] font-bold transition-colors ${filterStage === "Semua" ? "bg-[#25365f] text-white" : "bg-white border border-[#e1dce8] text-[#4f5b77] hover:bg-[#f5f3f7]"}`}
            >
              Semua
            </button>
            {ALL_STAGES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStage(s)}
                className={`rounded-full px-4 py-2 text-[11px] font-bold transition-colors ${filterStage === s ? "bg-[#25365f] text-white" : "bg-white border border-[#e1dce8] text-[#4f5b77] hover:bg-[#f5f3f7]"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#e1dce8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e1dce8]">
                <th className="px-5 py-3 font-bold text-[#6d7998]">ID</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Nama File</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Tahap</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Ukuran</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Upload</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Versi</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Status</th>
                <th className="px-5 py-3 font-bold text-[#6d7998]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((d) => (
                <tr key={d.id} className="border-b border-[#f3f1f5] last:border-0 hover:bg-[#faf9fc]">
                  <td className="px-5 py-3 font-semibold text-[#4a6baf]">{d.id}</td>
                  <td className="px-5 py-3 text-[#4f5b77] max-w-[220px]">
                    <p className="truncate font-medium">{d.fileName}</p>
                    {d.reviewerNotes && (
                      <p className="mt-1 text-[11px] text-[#92400e] truncate">Catatan: {d.reviewerNotes}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[#6d7998]">{d.stage}</td>
                  <td className="px-5 py-3 text-[#6d7998] text-[12px]">{formatFileSize(d.fileSize)}</td>
                  <td className="px-5 py-3 text-[#6d7998] text-[12px] whitespace-nowrap">{d.uploadedAt}</td>
                  <td className="px-5 py-3 text-[#6d7998] text-center">v{d.version ?? 1}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold ${getReviewClasses(d.reviewStatus ?? "")}`}>
                      {d.reviewStatus ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      {d.reviewStatus !== "Disetujui" && (
                        <button
                          type="button"
                          onClick={() => openReviewModal(d.id, "Disetujui")}
                          className="rounded-lg bg-[#065f46] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#047857] transition-colors"
                        >
                          Setujui
                        </button>
                      )}
                      {d.reviewStatus !== "Perlu Revisi" && (
                        <button
                          type="button"
                          onClick={() => openReviewModal(d.id, "Perlu Revisi")}
                          className="rounded-lg border border-[#fbbf24] bg-[#fffbeb] px-3 py-1.5 text-[11px] font-bold text-[#92400e] hover:bg-[#fef3c7] transition-colors"
                        >
                          Minta Revisi
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[13px] text-[#6d7998]">
                    Tidak ada dokumen ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        open={reviewModalId !== null}
        onClose={() => setReviewModalId(null)}
        title={reviewAction === "Disetujui" ? "Setujui Dokumen" : "Minta Revisi Dokumen"}
        footer={
          <>
            <button
              type="button"
              onClick={() => setReviewModalId(null)}
              className="rounded-xl border border-[#d8deeb] px-4 py-2 text-[13px] font-bold text-[#4f5b77] hover:bg-[#f5f3f7]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleReview}
              disabled={isSubmittingReview || (reviewAction === "Perlu Revisi" && !reviewNotes.trim())}
              className={`rounded-xl px-4 py-2 text-[13px] font-bold text-white transition-colors disabled:opacity-40 ${
                reviewAction === "Disetujui"
                  ? "bg-[#065f46] hover:bg-[#047857]"
                  : "bg-[#92400e] hover:bg-[#a16207]"
              }`}
            >
              {reviewAction === "Disetujui" ? "Konfirmasi Setujui" : "Konfirmasi Minta Revisi"}
            </button>
          </>
        }
      >
        {reviewModalDoc && (
          <div className="space-y-3">
            <div className="rounded-xl bg-[#f5f3f7] p-3">
              <p className="text-[12px] font-bold text-[#6d7998]">Dokumen</p>
              <p className="text-[13px] font-medium text-[#25365f]">{reviewModalDoc.fileName}</p>
              <p className="text-[12px] text-[#6d7998] mt-1">Tahap: {reviewModalDoc.stage} &bull; {reviewModalDoc.uploadedAt}</p>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-bold text-[#6d7998]">
                Catatan {reviewAction === "Perlu Revisi" ? "(wajib)" : "(opsional)"}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={reviewAction === "Perlu Revisi" ? "Jelaskan bagian yang perlu direvisi..." : "Catatan tambahan (opsional)..."}
                rows={3}
                className="w-full rounded-xl border border-[#d8deeb] px-4 py-3 text-[13px] text-[#25365f] placeholder:text-[#a3adc2] focus:border-[#4a6baf] focus:outline-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
