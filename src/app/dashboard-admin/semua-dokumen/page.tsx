"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useDashboard } from "@/lib/DashboardContext";
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

export default function AdminSemuaDokumenPage() {
  const { documents, bookings, histories } = useDashboard();
  const { registeredSchools } = useAuth();

  const rows = documents.map((document) => ({
    ...document,
    schoolName: resolveSchoolName(document, registeredSchools, bookings, histories),
  }));

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h2>Semua Dokumen</h2>
        <p>
          Daftar lengkap dokumen yang diunggah sekolah, langsung terhubung ke data dashboard.
        </p>
      </section>

      <section className={styles.tableCard}>
        <div className={styles.head}>
          <span>Sekolah</span>
          <span>Nama Dokumen</span>
          <span>Tanggal Upload</span>
          <span>Aksi</span>
        </div>
        {rows.length > 0 ? rows.map((item) => (
          <div key={item.id} className={styles.row}>
            <p>{item.schoolName}</p>
            <p>{item.fileName}</p>
            <p>{item.uploadedAt}</p>
            <Link href={`/dashboard-admin/detail-dokumen?documentId=${encodeURIComponent(item.id)}`}>Detail</Link>
          </div>
        )) : (
          <p className={styles.emptyState}>Belum ada dokumen yang masuk dari sekolah.</p>
        )}
      </section>
    </main>
  );
}
