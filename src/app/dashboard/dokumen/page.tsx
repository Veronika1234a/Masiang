"use client";

import Link from "next/link";
import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useDashboard } from "@/lib/DashboardContext";
import {
  ALL_STAGES,
  REQUIRED_DOCUMENTS,
  type DocumentStage,
  type SchoolDocument,
} from "@/lib/userDashboardData";

const stageTabs: Array<DocumentStage | "Semua"> = ["Semua", ...ALL_STAGES];

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
];
const MAX_SIZE = 10 * 1024 * 1024;
const FILE_EXTENSION_REGEX = /\.(pdf|docx|xlsx|zip)$/i;

function getStageClasses(stage: DocumentStage) {
  if (stage === "Melayani") return "bg-[#eef4ff] text-[#496b9f]";
  if (stage === "Adaptif") return "bg-[#fff2de] text-[#ad7a2c]";
  if (stage === "Pelaksanaan") return "bg-[#d8eef0] text-[#2d7480]";
  return "bg-[#ece9f2] text-[#5c647d]";
}

function getReviewClasses(status: string) {
  if (status === "Disetujui") return "bg-[#d9e7df] text-[#205930]";
  if (status === "Perlu Revisi") return "bg-[#ffe9e9] text-[#812f2f]";
  return "bg-[#eef3ff] text-[#2d4a7a]";
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowedFile(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type) || FILE_EXTENSION_REGEX.test(file.name);
}

export default function DashboardDokumenPage() {
  const { documents, uploadDocument, deleteDocument, replaceDocument, addToast } = useDashboard();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reviseRef = useRef<HTMLInputElement | null>(null);
  const [keyword, setKeyword] = useState("");
  const [activeStage, setActiveStage] = useState<DocumentStage | "Semua">("Semua");
  const [uploadStage, setUploadStage] = useState<DocumentStage>("Melayani");
  const [deleteTarget, setDeleteTarget] = useState<SchoolDocument | null>(null);
  const [reviseTarget, setReviseTarget] = useState<SchoolDocument | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const filteredDocuments = useMemo(() => {
    const nk = keyword.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchKey = nk.length === 0 || doc.fileName.toLowerCase().includes(nk) || doc.id.toLowerCase().includes(nk);
      const matchStage = activeStage === "Semua" || doc.stage === activeStage;
      return matchKey && matchStage;
    });
  }, [activeStage, documents, keyword]);

  const validateAndUpload = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setIsUploading(true);
    try {
      for (const file of files) {
        if (!isAllowedFile(file)) {
          addToast(`Format "${file.name}" tidak didukung. Gunakan PDF, DOCX, XLSX, atau ZIP.`, "error");
          continue;
        }
        if (file.size > MAX_SIZE) {
          addToast(`"${file.name}" melebihi batas 10MB.`, "error");
          continue;
        }
        try {
          await uploadDocument(file.name, uploadStage, file.size, file.type, undefined, file);
        } catch {
          // Error toast is handled in context.
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) validateAndUpload(files);
    e.target.value = "";
  };

  const onRevise = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && reviseTarget) {
      if (!isAllowedFile(file)) {
        addToast(`Format "${file.name}" tidak didukung. Gunakan PDF, DOCX, XLSX, atau ZIP.`, "error");
        e.target.value = "";
        return;
      }
      if (file.size > MAX_SIZE) {
        addToast(`"${file.name}" melebihi batas 10MB.`, "error");
        e.target.value = "";
        return;
      }
      try {
        await replaceDocument(reviseTarget.id, file.name, file.size, file.type, file);
        setReviseTarget(null);
      } catch {
        // Error toast is handled in context.
      }
    }
    e.target.value = "";
  };

  const checklistData = useMemo(() => {
    return ALL_STAGES.map((stage) => ({
      stage,
      required: REQUIRED_DOCUMENTS[stage],
      existing: REQUIRED_DOCUMENTS[stage].map((reqName) => ({
        name: reqName,
        found: documents.some((doc) => doc.stage === stage && doc.fileName.toLowerCase().includes(reqName.toLowerCase())),
      })),
    }));
  }, [documents]);

  return (
    <main className="w-full pb-10 text-[#121d35]">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-8">
        <nav className="text-[12px] font-bold text-[#6d7998]">
          <span className="text-[#25365f]">Dokumen</span>
        </nav>
        <header className="max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">Arsip Sekolah</p>
          <h1 className="mt-4 font-[var(--font-fraunces)] text-[clamp(30px,3vw,46px)] font-medium leading-[1.04] tracking-[-0.03em] text-[#121d35]">Dokumen yang tersusun rapi.</h1>
          <p className="mt-4 text-[15px] leading-[1.8] text-[#4f5b77]">Kelola berkas pendampingan berdasarkan tahap kerja.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <article className="rounded-2xl border border-[#e2dde8] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Total Dokumen</p>
            <p className="mt-3 font-[var(--font-fraunces)] text-[40px] font-medium text-[#121d35]">{documents.length}</p>
          </article>
          <article className="rounded-2xl border border-[#e2dde8] bg-[#f9f8fc] p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Tahap Aktif</p>
            <p className="mt-3 font-[var(--font-fraunces)] text-[40px] font-medium text-[#121d35]">{activeStage === "Semua" ? "Semua" : activeStage}</p>
          </article>
        </section>

        {/* Filters */}
        <section className="rounded-[28px] border border-[#e2dde8] bg-[#f9f8fc] p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {stageTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveStage(tab);
                    if (tab !== "Semua") {
                      setUploadStage(tab);
                    }
                  }}
                  className={`rounded-xl border px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors ${activeStage === tab ? "border-[#d5bb82] bg-[#fff2de] text-[#ad7a2c]" : "border-[#d8deeb] bg-white text-[#4f5b77] hover:bg-[#eef1f8]"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Cari Dokumen</span>
                  <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Cari nama dokumen atau ID" className="min-h-11 rounded-xl border border-[#d8deeb] bg-white px-3 text-[14px] text-[#313f61] outline-none focus:border-[#b9c7de]" />
                </label>
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Tahap Upload</span>
                  <select value={uploadStage} onChange={(e) => setUploadStage(e.target.value as DocumentStage)} className="min-h-11 rounded-xl border border-[#d8deeb] bg-white px-3 text-[14px] text-[#313f61] outline-none focus:border-[#b9c7de]">
                    {ALL_STAGES.map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.xlsx,.zip" onChange={onUpload} className="hidden" />
                <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white hover:-translate-y-0.5 hover:bg-[#b8933d] hover:shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60">
                  {isUploading ? "Mengunggah..." : "Upload Dokumen"}
                </button>
                <button type="button" onClick={() => setShowChecklist(true)} className="rounded-xl border border-[#cfd5e6] bg-white px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] hover:bg-[#eef1f8]">Checklist</button>
              </div>
            </div>
            <p className="text-[12px] text-[#6d7998]">
              Upload baru akan masuk ke tahap <span className="font-bold text-[#25365f]">{uploadStage}</span>. Filter daftar di atas tidak memblok upload.
            </p>
          </div>
        </section>

        {/* Document List */}
        <section className="rounded-[28px] border border-[#e2dde8] bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-[#ece6f1] px-6 py-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">Daftar Arsip</p>
              <h2 className="mt-2 font-[var(--font-fraunces)] text-[30px] font-medium text-[#121d35]">Dokumen sekolah.</h2>
            </div>
            <p className="text-[13px] text-[#6d7998]">{filteredDocuments.length} dokumen tampil</p>
          </div>
          <div className="divide-y divide-[#ece6f1]">
            {filteredDocuments.length > 0 ? filteredDocuments.map((doc) => (
              <article key={doc.id} className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-[#fcfbfd] md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa6c4]">{doc.id}</span>
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${getStageClasses(doc.stage)}`}>{doc.stage}</span>
                    {doc.reviewStatus && <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${getReviewClasses(doc.reviewStatus)}`}>{doc.reviewStatus}</span>}
                    {doc.version && doc.version > 1 && <span className="text-[10px] font-bold text-[#6d7998]">v{doc.version}</span>}
                  </div>
                  <h3 className="mt-3 truncate font-[var(--font-fraunces)] text-[24px] font-medium leading-[1.1] text-[#121d35]">{doc.fileName}</h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-[#4f5b77]">
                    Diunggah pada {doc.uploadedAt}
                    {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ""}
                  </p>
                  {doc.reviewerNotes && (
                    <div className="mt-3 rounded-lg border border-[#f0b8b8] bg-[#fff5f5] px-3 py-2 text-[12px] text-[#812f2f]">
                      <span className="font-bold">Catatan pengawas: </span>{doc.reviewerNotes}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {doc.historyId && (
                    <Link href={`/dashboard/riwayat/${doc.historyId}`} className="rounded-xl border border-[#d8deeb] bg-[#f9f8fc] px-4 py-3 text-[11px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]">Lihat Arsip</Link>
                  )}
                  {doc.reviewStatus === "Perlu Revisi" && (
                    <>
                      <input ref={reviseRef} type="file" accept=".pdf,.docx,.xlsx,.zip" onChange={onRevise} className="hidden" />
                      <button type="button" onClick={() => { setReviseTarget(doc); reviseRef.current?.click(); }} className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-[11px] font-bold uppercase text-white hover:bg-[#b8933d]">Upload Revisi</button>
                    </>
                  )}
                  <button type="button" onClick={() => setDeleteTarget(doc)} className="rounded-xl border border-[#e8c4c4] bg-[#fff5f5] px-4 py-3 text-[11px] font-bold uppercase text-[#a13636] hover:bg-[#ffe9e9]">Hapus</button>
                </div>
              </article>
            )) : (
              <div className="px-6 py-10 text-center">
                <p className="text-[14px] text-[#6d7998] mb-4">Tidak ada dokumen yang cocok dengan filter.</p>
                <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="rounded-xl bg-[#d2ac50] px-6 py-3 text-[12px] font-bold uppercase text-white hover:bg-[#b8933d] disabled:cursor-not-allowed disabled:opacity-60">
                  {isUploading ? "Mengunggah..." : "Upload Dokumen Pertama"}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Dokumen" footer={
        <>
          <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-2.5 text-[12px] font-bold text-[#4f5b77] hover:bg-[#eef1f8]">Batal</button>
          <button type="button" onClick={() => {
            if (!deleteTarget) return;
            void (async () => {
              try {
                await deleteDocument(deleteTarget.id);
                setDeleteTarget(null);
              } catch {
                // Error toast is handled in context.
              }
            })();
          }} className="rounded-xl bg-[#c44444] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#a13636]">Ya, Hapus</button>
        </>
      }>
        <p className="text-[14px] leading-[1.6] text-[#4f5b77]">
          Apakah Anda yakin ingin menghapus <strong className="text-[#25365f]">{deleteTarget?.fileName}</strong>? Aksi ini tidak dapat diurungkan.
        </p>
      </Modal>

      {/* Checklist Modal */}
      <Modal open={showChecklist} onClose={() => setShowChecklist(false)} title="Checklist Kelengkapan Dokumen">
        <div className="space-y-5 max-h-[400px] overflow-y-auto">
          {checklistData.map(({ stage, existing }) => (
            <div key={stage}>
              <h4 className="text-[12px] font-bold uppercase tracking-wide text-[#6d7998] mb-2">{stage}</h4>
              <div className="space-y-1.5">
                {existing.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] ${item.found ? "bg-[#d9e7df] text-[#205930]" : "bg-[#f0eef2] text-[#a3adc2]"}`}>
                      {item.found ? "✓" : "—"}
                    </span>
                    <span className={`text-[13px] ${item.found ? "text-[#25365f] font-semibold" : "text-[#6d7998]"}`}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </main>
  );
}
