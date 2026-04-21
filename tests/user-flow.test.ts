import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSchoolInternalEmail,
  isEmailIdentity,
  isNpsnIdentity,
} from "../src/lib/authIdentity";
import { isDirectDownloadPath } from "../src/lib/supabase/services/storage";
import type {
  BookingItem,
  Notification,
  RiwayatItem,
  SchoolDocument,
} from "../src/lib/userDashboardData";
import { getNextBooking, normalizeBookingSession } from "../src/lib/userDashboardData";
import {
  buildProtectedRedirectTarget,
  getNotificationHref,
  getSchoolDocumentsForAdmin,
  resolvePostLoginRedirect,
} from "../src/lib/userFlow";
import type { NotificationType } from "../src/lib/userDashboardData";

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

test("school auth identity supports NPSN-first login and internal email mapping", () => {
  assert.equal(isNpsnIdentity("10265538"), true);
  assert.equal(isEmailIdentity("admin@masiang.id"), true);
  assert.equal(isEmailIdentity("10265538"), false);
  assert.equal(buildSchoolInternalEmail("10265538"), "npsn-10265538@school.masiang.local");
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

test("getNotificationHref stays correct for admin-action notification types", () => {
  const bookingActionTypes = [
    "booking_approved",
    "booking_started",
    "booking_rejected",
    "booking_completed",
  ] as const;
  const documentActionTypes = ["doc_review"] as const;

  for (const type of bookingActionTypes) {
    const hrefSchool = getNotificationHref("school", {
      referenceId: `BK-${type}`,
      referenceType: "booking",
    });
    const hrefAdmin = getNotificationHref("admin", {
      referenceId: `BK-${type}`,
      referenceType: "booking",
    });

    assert.equal(hrefSchool, `/dashboard/booking/BK-${type}`);
    assert.equal(hrefAdmin, `/dashboard-admin/booking/BK-${type}`);
  }

  for (const type of documentActionTypes) {
    const hrefSchool = getNotificationHref("school", {
      referenceId: `DOC-${type}`,
      referenceType: "document",
    });
    const hrefAdmin = getNotificationHref("admin", {
      referenceId: `DOC-${type}`,
      referenceType: "document",
    });

    assert.equal(hrefSchool, "/dashboard/dokumen");
    assert.equal(
      hrefAdmin,
      `/dashboard-admin/detail-dokumen?documentId=${encodeURIComponent(`DOC-${type}`)}`,
    );
  }
});

test("getNotificationHref supports all notification types when reference mapping is valid", () => {
  const notificationCases: Array<{
    type: NotificationType;
    referenceType: "booking" | "document" | "history";
    referenceId: string;
    expectedSchoolHref: string | null;
    expectedAdminHref: string | null;
  }> = [
    {
      type: "booking_created",
      referenceType: "booking",
      referenceId: "BK-T1",
      expectedSchoolHref: "/dashboard/booking/BK-T1",
      expectedAdminHref: "/dashboard-admin/booking/BK-T1",
    },
    {
      type: "booking_approved",
      referenceType: "booking",
      referenceId: "BK-T2",
      expectedSchoolHref: "/dashboard/booking/BK-T2",
      expectedAdminHref: "/dashboard-admin/booking/BK-T2",
    },
    {
      type: "booking_started",
      referenceType: "booking",
      referenceId: "BK-T2B",
      expectedSchoolHref: "/dashboard/booking/BK-T2B",
      expectedAdminHref: "/dashboard-admin/booking/BK-T2B",
    },
    {
      type: "booking_rejected",
      referenceType: "booking",
      referenceId: "BK-T3",
      expectedSchoolHref: "/dashboard/booking/BK-T3",
      expectedAdminHref: "/dashboard-admin/booking/BK-T3",
    },
    {
      type: "booking_cancelled",
      referenceType: "booking",
      referenceId: "BK-T4",
      expectedSchoolHref: "/dashboard/booking/BK-T4",
      expectedAdminHref: "/dashboard-admin/booking/BK-T4",
    },
    {
      type: "booking_completed",
      referenceType: "booking",
      referenceId: "BK-T5",
      expectedSchoolHref: "/dashboard/booking/BK-T5",
      expectedAdminHref: "/dashboard-admin/booking/BK-T5",
    },
    {
      type: "doc_uploaded",
      referenceType: "document",
      referenceId: "DOC-T1",
      expectedSchoolHref: "/dashboard/dokumen",
      expectedAdminHref: "/dashboard-admin/detail-dokumen?documentId=DOC-T1",
    },
    {
      type: "doc_review",
      referenceType: "document",
      referenceId: "DOC-T2",
      expectedSchoolHref: "/dashboard/dokumen",
      expectedAdminHref: "/dashboard-admin/detail-dokumen?documentId=DOC-T2",
    },
    {
      type: "follow_up_reminder",
      referenceType: "history",
      referenceId: "RH-T1",
      expectedSchoolHref: "/dashboard/riwayat/RH-T1",
      expectedAdminHref: null,
    },
    {
      type: "stage_advanced",
      referenceType: "booking",
      referenceId: "BK-T6",
      expectedSchoolHref: "/dashboard/booking/BK-T6",
      expectedAdminHref: "/dashboard-admin/booking/BK-T6",
    },
  ];

  for (const testCase of notificationCases) {
    const baseNotification = {
      referenceId: testCase.referenceId,
      referenceType: testCase.referenceType,
    } as const;

    assert.equal(getNotificationHref("school", baseNotification), testCase.expectedSchoolHref, `Unexpected school deep-link for type ${testCase.type}`);
    assert.equal(getNotificationHref("admin", baseNotification), testCase.expectedAdminHref, `Unexpected admin deep-link for type ${testCase.type}`);
  }
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

test("normalizeBookingSession normalizes free-text slot input", () => {
  assert.equal(
    normalizeBookingSession("09:00-12:00"),
    "09.00 - 12.00 WITA",
  );
  assert.equal(
    normalizeBookingSession(" 08.30 - 11.30 WITA "),
    "08.30 - 11.30 WITA",
  );
});

test("getNextBooking ignores active bookings from past dates", () => {
  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const withOffset = (days: number) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return toDateInputValue(date);
  };

  const pastBooking: BookingItem = {
    id: "BK-PAST",
    school: "UPT SDN 1 Mappak",
    topic: "Kegiatan Lama",
    dateISO: withOffset(-30),
    session: "09.00 - 12.00 WITA",
    status: "Menunggu",
    timeline: [],
  };
  const futureBooking: BookingItem = {
    id: "BK-FUTURE",
    school: "UPT SDN 1 Mappak",
    topic: "Kegiatan Mendatang",
    dateISO: withOffset(7),
    session: "09.00 - 12.00 WITA",
    status: "Disetujui",
    timeline: [],
  };

  assert.equal(getNextBooking([pastBooking, futureBooking])?.id, "BK-FUTURE");
  assert.equal(getNextBooking([pastBooking]), null);
});

test("isDirectDownloadPath distinguishes direct links from storage object paths", () => {
  assert.equal(isDirectDownloadPath("https://example.com/file.pdf"), true);
  assert.equal(isDirectDownloadPath("/uploads/file.pdf"), true);
  assert.equal(isDirectDownloadPath("school-1/1712675300_file.pdf"), false);
  assert.equal(isDirectDownloadPath(undefined), false);
});
