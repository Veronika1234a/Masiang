"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useDashboard } from "@/lib/DashboardContext";
import { getSignedUrl } from "@/lib/supabase/services/storage";
import { type RiwayatItem, type SchoolDocument } from "@/lib/userDashboardData";
import styles from "./page.module.css";

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

export default function AdminDetailDokumenPage() {
  const searchParams = useSearchParams();
  const { registeredSchools } = useAuth();
  const { documents, bookings, histories, addToast } = useDashboard();
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

  const handleDownload = async (document: SchoolDocument) => {
    if (!document.storagePath) {
      addToast(`Dokumen "${document.fileName}" belum memiliki file yang bisa diunduh.`, "info");
      return;
    }

    setDownloadingId(document.id);
    try {
      const signedUrl = await getSignedUrl(document.storagePath);
      if (!signedUrl) {
        addToast(`Gagal membuat link unduhan untuk "${document.fileName}".`, "error");
        return;
      }

      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <main className={styles.page}>
      <Link href="/dashboard-admin/semua-dokumen" className={styles.backButton}>
        Kembali
      </Link>

      <section className={styles.hero}>
        <h2>
          {selectedDocument ? `Detail Dokumen - ${selectedSchoolName}` : "Detail Dokumen Tidak Ditemukan"}
        </h2>
        <p>
          {selectedDocument
            ? "Detail dokumen terpilih beserta berkas lain dari sekolah yang sama."
            : "Pilih dokumen dari halaman semua dokumen untuk melihat detail dan tautan unduhan."}
        </p>
      </section>

      {selectedDocument ? (
        <>
          <section className={styles.metaGrid}>
            <article className={styles.metaCard}>
              <h3>Dokumen Terpilih</h3>
              <p>{selectedDocument.fileName}</p>
            </article>
            <article className={styles.metaCard}>
              <h3>Tahap</h3>
              <p>{selectedDocument.stage}</p>
            </article>
            <article className={styles.metaCard}>
              <h3>Status Review</h3>
              <p>{selectedDocument.reviewStatus ?? "Menunggu Review"}</p>
            </article>
            <article className={styles.metaCard}>
              <h3>Versi</h3>
              <p>v{selectedDocument.version ?? 1}</p>
            </article>
          </section>

          <section className={styles.listCard}>
            {relatedDocuments.map((item) => (
              <article key={item.id} className={styles.fileRow}>
                <div>
                  <h3>{item.fileName}</h3>
                  <p>{item.uploadedAt}</p>
                </div>
                <div className={styles.actions}>
                  <span>{item.stage}</span>
                  <span>{item.reviewStatus ?? "Menunggu Review"}</span>
                  <button
                    type="button"
                    disabled={!item.storagePath || downloadingId === item.id}
                    onClick={() => void handleDownload(item)}
                  >
                    {downloadingId === item.id ? "Memuat..." : item.storagePath ? "Unduh" : "Tidak Tersedia"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : (
        <section className={styles.listCard}>
          <p className={styles.emptyState}>Dokumen yang dipilih tidak tersedia atau sudah dihapus.</p>
        </section>
      )}
    </main>
  );
}
