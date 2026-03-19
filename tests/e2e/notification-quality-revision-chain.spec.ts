import { expect } from "@playwright/test";
import { test } from "./support/fixtures";

async function login(page: Parameters<typeof test>[0]["page"], email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill("password123");
  await page.getByRole("button", { name: "Masuk" }).click();
}

test("notification quality: no duplicate cards, sorted by time, unread badge updates, and deep-link works", async ({
  page,
  backend,
}) => {
  backend.reset();

  backend.state.bookings.unshift(
    {
      id: "BK-NQ-01",
      school_id: "school-1",
      school_name: "SDN 1 Makale",
      topic: "Pendampingan Numerasi",
      category: "Pendampingan",
      date_iso: "2026-03-20",
      session: "08.00 - 10.00 WITA",
      status: "Disetujui",
      timeline: [],
      goal: "Penguatan numerasi",
      notes: "QA notification",
      cancel_reason: null,
      rating: null,
      feedback: null,
      supervisor_notes: null,
      created_at: "2026-03-18T08:00:00.000Z",
    },
    {
      id: "BK-NQ-02",
      school_id: "school-1",
      school_name: "SDN 1 Makale",
      topic: "Pendampingan Literasi",
      category: "Supervisi",
      date_iso: "2026-03-21",
      session: "09.00 - 12.00 WITA",
      status: "Menunggu",
      timeline: [],
      goal: "Penguatan literasi",
      notes: "QA notification",
      cancel_reason: null,
      rating: null,
      feedback: null,
      supervisor_notes: null,
      created_at: "2026-03-18T08:30:00.000Z",
    },
  );

  backend.state.histories.unshift({
    id: "RH-NQ-01",
    school_id: "school-1",
    booking_id: "BK-NQ-01",
    date_iso: "2026-03-18",
    school_name: "SDN 1 Makale",
    session: "08.00 - 10.00 WITA",
    title: "Riwayat Notifikasi QA",
    description: "Riwayat untuk verifikasi deep-link notifikasi.",
    status: "Tindak Lanjut",
    follow_up_iso: "2026-03-25",
    supervisor_notes: null,
    follow_up_done: false,
    follow_up_items: [{ id: "FU-NQ-01", text: "Lengkapi laporan", done: false }],
    created_at: "2026-03-18T09:00:00.000Z",
  });

  backend.state.documents.unshift(
    {
      id: "DOC-NQ-01",
      school_id: "school-1",
      booking_id: "BK-NQ-01",
      history_id: "RH-NQ-01",
      file_name: "Dokumen Notifikasi QA.pdf",
      storage_path: "school-1/notif-qa.pdf",
      file_size: 1000,
      mime_type: "application/pdf",
      stage: "Pelaksanaan",
      review_status: "Menunggu Review",
      reviewer_notes: null,
      version: 1,
      parent_doc_id: null,
      uploaded_at: "18 Mar 2026",
      created_at: "2026-03-18T09:01:00.000Z",
    },
    {
      id: "DOC-NQ-02",
      school_id: "school-1",
      booking_id: null,
      history_id: null,
      file_name: "Dokumen Notifikasi QA 2.pdf",
      storage_path: "school-1/notif-qa-2.pdf",
      file_size: 1100,
      mime_type: "application/pdf",
      stage: "Laporan",
      review_status: "Perlu Revisi",
      reviewer_notes: "Tambahkan catatan eviden.",
      version: 1,
      parent_doc_id: null,
      uploaded_at: "18 Mar 2026",
      created_at: "2026-03-18T09:02:00.000Z",
    },
  );
  backend.state.storagePaths.push("school-1/notif-qa.pdf", "school-1/notif-qa-2.pdf");

  backend.state.notifications.unshift(
    {
      id: "NTF-NQ-03",
      user_id: "school-1",
      title: "NTF-QA-03 Booking Rejected",
      message: "Booking ditolak.",
      type: "booking_rejected",
      reference_id: "BK-NQ-01",
      reference_type: "booking",
      is_read: false,
      created_at: "2026-03-18T09:03:00.000Z",
    },
    {
      id: "NTF-NQ-09",
      user_id: "school-1",
      title: "NTF-QA-09 Stage Advanced",
      message: "Tahap dokumen naik.",
      type: "stage_advanced",
      reference_id: "BK-NQ-02",
      reference_type: "booking",
      is_read: false,
      created_at: "2026-03-18T09:09:00.000Z",
    },
    {
      id: "NTF-NQ-06",
      user_id: "school-1",
      title: "NTF-QA-06 Doc Uploaded",
      message: "Dokumen diupload.",
      type: "doc_uploaded",
      reference_id: "DOC-NQ-01",
      reference_type: "document",
      is_read: false,
      created_at: "2026-03-18T09:06:00.000Z",
    },
    {
      id: "NTF-NQ-04",
      user_id: "school-1",
      title: "NTF-QA-04 Booking Cancelled",
      message: "Booking dibatalkan.",
      type: "booking_cancelled",
      reference_id: "BK-NQ-01",
      reference_type: "booking",
      is_read: false,
      created_at: "2026-03-18T09:04:00.000Z",
    },
    {
      id: "NTF-NQ-01",
      user_id: "school-1",
      title: "NTF-QA-01 Booking Created",
      message: "Booking dibuat.",
      type: "booking_created",
      reference_id: "BK-NQ-01",
      reference_type: "booking",
      is_read: true,
      created_at: "2026-03-18T09:01:00.000Z",
    },
    {
      id: "NTF-NQ-08",
      user_id: "school-1",
      title: "NTF-QA-08 Follow Up",
      message: "Tindak lanjut besok.",
      type: "follow_up_reminder",
      reference_id: "RH-NQ-01",
      reference_type: "history",
      is_read: false,
      created_at: "2026-03-18T09:08:00.000Z",
    },
    {
      id: "NTF-NQ-05",
      user_id: "school-1",
      title: "NTF-QA-05 Booking Completed",
      message: "Sesi selesai.",
      type: "booking_completed",
      reference_id: "BK-NQ-01",
      reference_type: "booking",
      is_read: false,
      created_at: "2026-03-18T09:05:00.000Z",
    },
    {
      id: "NTF-NQ-02",
      user_id: "school-1",
      title: "NTF-QA-02 Booking Approved",
      message: "Booking disetujui.",
      type: "booking_approved",
      reference_id: "BK-NQ-01",
      reference_type: "booking",
      is_read: false,
      created_at: "2026-03-18T09:02:00.000Z",
    },
    {
      id: "NTF-NQ-07",
      user_id: "school-1",
      title: "NTF-QA-07 Doc Review",
      message: "Dokumen direview.",
      type: "doc_review",
      reference_id: "DOC-NQ-02",
      reference_type: "document",
      is_read: false,
      created_at: "2026-03-18T09:07:00.000Z",
    },
  );

  await login(page, "school@example.com");
  await page.goto("/dashboard/ringkasan");

  const notifBell = page.getByRole("button", { name: "Notifikasi" });
  await expect(notifBell.locator("span")).toHaveText("8");
  await notifBell.click();

  const notificationButtons = page.getByRole("button").filter({ hasText: "NTF-QA-" });
  await expect(notificationButtons).toHaveCount(6);

  const renderedOrder = (await notificationButtons.allTextContents())
    .map((content) => content.match(/NTF-QA-\d{2}/)?.[0] ?? "")
    .filter(Boolean);

  expect(renderedOrder).toEqual([
    "NTF-QA-09",
    "NTF-QA-08",
    "NTF-QA-07",
    "NTF-QA-06",
    "NTF-QA-05",
    "NTF-QA-04",
  ]);

  await expect(page.getByRole("button", { name: /NTF-QA-09/ })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /NTF-QA-08/ })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /NTF-QA-07/ })).toHaveCount(1);

  await page.getByRole("button", { name: /NTF-QA-09/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/booking\/BK-NQ-02$/);
  await expect(notifBell.locator("span")).toHaveText("7");

  await page.goto("/dashboard/ringkasan");
  await notifBell.click();
  await page.getByRole("button", { name: /NTF-QA-07/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/dokumen$/);
  await expect(notifBell.locator("span")).toHaveText("6");

  await page.goto("/dashboard/ringkasan");
  await notifBell.click();
  await page.getByRole("button", { name: /NTF-QA-08/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/riwayat\/RH-NQ-01$/);
  await expect(notifBell.locator("span")).toHaveText("5");

  await page.goto("/dashboard/ringkasan");
  await page.reload();
  await notifBell.click();
  await expect(page.getByRole("button", { name: /NTF-QA-06/ })).toHaveCount(1);
});

test("document revision chain keeps parent/version/history/booking relation consistent across multiple revisions", async ({
  page,
  backend,
}) => {
  backend.reset();

  backend.state.bookings.unshift({
    id: "BK-RC-01",
    school_id: "school-1",
    school_name: "SDN 1 Makale",
    topic: "Pendampingan Revisi Dokumen",
    category: "Pendampingan",
    date_iso: "2026-03-18",
    session: "09.00 - 12.00 WITA",
    status: "Dalam Proses",
    timeline: [],
    goal: "Uji revisi berantai",
    notes: "QA chain",
    cancel_reason: null,
    rating: null,
    feedback: null,
    supervisor_notes: null,
    created_at: "2026-03-18T08:00:00.000Z",
  });

  backend.state.histories.unshift({
    id: "RH-RC-01",
    school_id: "school-1",
    booking_id: "BK-RC-01",
    date_iso: "2026-03-18",
    school_name: "SDN 1 Makale",
    session: "09.00 - 12.00 WITA",
    title: "Riwayat Revisi Dokumen",
    description: "Riwayat sesi untuk uji revisi berantai.",
    status: "Tindak Lanjut",
    follow_up_iso: "2026-03-25",
    supervisor_notes: null,
    follow_up_done: false,
    follow_up_items: [{ id: "FU-RC-01", text: "Tuntaskan revisi", done: false }],
    created_at: "2026-03-18T10:00:00.000Z",
  });

  backend.state.documents.unshift({
    id: "DOC-RC-01",
    school_id: "school-1",
    booking_id: "BK-RC-01",
    history_id: "RH-RC-01",
    file_name: "Laporan Awal.pdf",
    storage_path: "school-1/laporan-awal.pdf",
    file_size: 2048,
    mime_type: "application/pdf",
    stage: "Laporan",
    review_status: "Perlu Revisi",
    reviewer_notes: "Perlu pembaruan.",
    version: 1,
    parent_doc_id: null,
    uploaded_at: "18 Mar 2026",
    created_at: "2026-03-18T10:30:00.000Z",
  });
  backend.state.storagePaths.push("school-1/laporan-awal.pdf");

  await login(page, "school@example.com");
  await page.goto("/dashboard/dokumen");

  const initialCard = page.locator("article", { hasText: "Laporan Awal.pdf" });
  await initialCard.getByRole("button", { name: "Upload Revisi" }).click();
  await page.locator('input[type="file"]').nth(1).setInputFiles({
    name: "Laporan Revisi 1.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("revision-1"),
  });
  await expect(page.getByText('Revisi "Laporan Revisi 1.pdf" berhasil diunggah.')).toBeVisible();

  const revision1 = backend.state.documents.find((document) => document.file_name === "Laporan Revisi 1.pdf");
  expect(revision1).toBeDefined();
  if (!revision1) {
    throw new Error("First revision document was not created.");
  }

  expect(revision1.version).toBe(2);
  expect(revision1.parent_doc_id).toBe("DOC-RC-01");
  expect(revision1.booking_id).toBe("BK-RC-01");
  expect(revision1.history_id).toBe("RH-RC-01");
  expect(backend.state.documents.some((document) => document.id === "DOC-RC-01")).toBeTruthy();

  const revision1Id = revision1.id;
  revision1.review_status = "Perlu Revisi";

  await page.reload();
  const revision1Card = page.locator("article", { hasText: "Laporan Revisi 1.pdf" });
  await revision1Card.getByRole("button", { name: "Upload Revisi" }).click();
  await page.locator('input[type="file"]').nth(1).setInputFiles({
    name: "Laporan Revisi 2.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("revision-2"),
  });
  await expect(page.getByText('Revisi "Laporan Revisi 2.pdf" berhasil diunggah.')).toBeVisible();

  const revision2 = backend.state.documents.find((document) => document.file_name === "Laporan Revisi 2.pdf");
  expect(revision2).toBeDefined();
  if (!revision2) {
    throw new Error("Second revision document was not created.");
  }

  expect(revision2.version).toBe(3);
  expect(revision2.parent_doc_id).toBe(revision1Id);
  expect(revision2.booking_id).toBe("BK-RC-01");
  expect(revision2.history_id).toBe("RH-RC-01");
  expect(backend.state.documents.some((document) => document.id === revision1Id)).toBeTruthy();
  expect(backend.state.storagePaths).toHaveLength(3);
  expect(backend.state.storagePaths.some((path) => path.includes("laporan-awal.pdf"))).toBeTruthy();
  expect(backend.state.storagePaths.some((path) => path.includes("Laporan Revisi 1.pdf"))).toBeTruthy();
  expect(backend.state.storagePaths.some((path) => path.includes("Laporan Revisi 2.pdf"))).toBeTruthy();

  await page.goto("/dashboard/riwayat/RH-RC-01");
  await expect(page.getByText("Laporan Revisi 2.pdf")).toBeVisible();
  await expect(page.getByText("Laporan Revisi 1.pdf")).toHaveCount(0);
  await expect(page.getByText("Laporan Awal.pdf")).toHaveCount(0);

  await page.goto("/dashboard/booking/BK-RC-01");
  await expect(page.getByText("Laporan Revisi 2.pdf")).toBeVisible();
});
