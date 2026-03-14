import assert from "node:assert/strict";
import test from "node:test";
import type {
  BookingItem,
  Notification,
  RiwayatItem,
  SchoolDocument,
} from "../src/lib/userDashboardData";
import {
  buildProtectedRedirectTarget,
  getNotificationHref,
  getSchoolDocumentsForAdmin,
  resolvePostLoginRedirect,
} from "../src/lib/userFlow";

test("buildProtectedRedirectTarget preserves query strings for protected routes", () => {
  assert.equal(
    buildProtectedRedirectTarget("/dashboard/booking-baru", "?date=2026-03-20"),
    "/dashboard/booking-baru?date=2026-03-20",
  );
  assert.equal(
    buildProtectedRedirectTarget("/dashboard/ringkasan", ""),
    "/dashboard/ringkasan",
  );
});

test("resolvePostLoginRedirect only accepts safe internal paths", () => {
  assert.equal(
    resolvePostLoginRedirect("/dashboard/booking/BK-002", "/dashboard/ringkasan"),
    "/dashboard/booking/BK-002",
  );
  assert.equal(
    resolvePostLoginRedirect("https://evil.example", "/dashboard/ringkasan"),
    "/dashboard/ringkasan",
  );
  assert.equal(
    resolvePostLoginRedirect("//evil.example", "/dashboard/ringkasan"),
    "/dashboard/ringkasan",
  );
});

test("getNotificationHref maps notifications to actionable destinations", () => {
  const bookingNotification: Pick<Notification, "referenceId" | "referenceType"> = {
    referenceId: "BK-101",
    referenceType: "booking",
  };
  const documentNotification: Pick<Notification, "referenceId" | "referenceType"> = {
    referenceId: "DOC-201",
    referenceType: "document",
  };
  const historyNotification: Pick<Notification, "referenceId" | "referenceType"> = {
    referenceId: "RH-301",
    referenceType: "history",
  };

  assert.equal(
    getNotificationHref("school", bookingNotification),
    "/dashboard/booking/BK-101",
  );
  assert.equal(
    getNotificationHref("admin", documentNotification),
    "/dashboard-admin/detail-dokumen?documentId=DOC-201",
  );
  assert.equal(
    getNotificationHref("school", historyNotification),
    "/dashboard/riwayat/RH-301",
  );
  assert.equal(getNotificationHref("admin", historyNotification), null);
});

test("getSchoolDocumentsForAdmin includes history-linked and booking-linked documents", () => {
  const bookings: BookingItem[] = [
    {
      id: "BK-001",
      schoolId: "school-1",
      school: "SDN 1 Makale",
      topic: "Supervisi Akademik",
      category: "Supervisi",
      dateISO: "2026-03-20",
      session: "09.00 - 12.00",
      status: "Selesai",
      timeline: [],
    },
  ];

  const histories: RiwayatItem[] = [
    {
      id: "RH-001",
      schoolId: "school-1",
      dateISO: "2026-03-20",
      school: "SDN 1 Makale",
      session: "09.00 - 12.00",
      title: "Sesi Supervisi",
      description: "Sesi selesai",
      status: "Tindak Lanjut",
      documents: [],
      bookingId: "BK-001",
    },
  ];

  const documents: SchoolDocument[] = [
    {
      id: "DOC-001",
      schoolId: "school-1",
      fileName: "Profil Sekolah.pdf",
      uploadedAt: "13 Mar 2026",
      stage: "Melayani",
    },
    {
      id: "DOC-002",
      bookingId: "BK-001",
      fileName: "Berita Acara.pdf",
      uploadedAt: "13 Mar 2026",
      stage: "Pelaksanaan",
    },
    {
      id: "DOC-003",
      historyId: "RH-001",
      fileName: "Laporan Akhir.pdf",
      uploadedAt: "13 Mar 2026",
      stage: "Laporan",
    },
    {
      id: "DOC-999",
      schoolId: "school-9",
      fileName: "Dokumen Lain.pdf",
      uploadedAt: "13 Mar 2026",
      stage: "Melayani",
    },
  ];

  const matchedDocuments = getSchoolDocumentsForAdmin({
    schoolId: "school-1",
    schoolName: "SDN 1 Makale",
    bookings,
    documents,
    histories,
  });

  assert.deepEqual(
    matchedDocuments.map((document) => document.id).sort(),
    ["DOC-001", "DOC-002", "DOC-003"],
  );
});
