import { expect } from "@playwright/test";
import { test } from "./support/fixtures";
import { gotoPath, loginAdmin, loginSchool, logout, openSchoolBookingPage } from "./support/app";

test("admin can reject a booking and school sees the rejected result", async ({ page, backend }) => {
  backend.reset();

  backend.state.bookings.unshift({
    id: "BK-401",
    school_id: "school-1",
    school_name: "SDN 1 Makale",
    topic: "Pendampingan Asesmen Diagnostik",
    category: "Pendampingan",
    date_iso: "2026-03-22",
    session: "09.00 - 11.00 WITA",
    status: "Menunggu",
    timeline: [],
    goal: "Merapikan asesmen awal.",
    notes: "Perlu validasi instrumen.",
    cancel_reason: null,
    rating: null,
    feedback: null,
    supervisor_notes: null,
    created_at: "2026-03-15T08:00:00.000Z",
  });

  await loginAdmin(page);
  await gotoPath(page, "/dashboard-admin/booking");
  await page.getByPlaceholder("Cari sekolah, topik, atau ID booking").fill("BK-401");

  const bookingRow = page.locator("tr", { hasText: "BK-401" });
  await expect(bookingRow).toContainText("Pendampingan Asesmen Diagnostik");
  await bookingRow.getByRole("button", { name: "Tolak" }).click();
  await expect(page.getByRole("button", { name: "Konfirmasi Tolak" })).toBeDisabled();
  await page.getByPlaceholder("Contoh: Jadwal bentrok dengan kegiatan dinas...").fill("Jadwal pengawas bentrok dengan rapat dinas.");
  await page.getByRole("button", { name: "Konfirmasi Tolak" }).click();
  await expect(page.getByText("Booking BK-401 ditolak.")).toBeVisible();

  await page.getByRole("button", { name: /Ditolak/ }).first().click();
  await expect(page.locator("tr", { hasText: "BK-401" })).toContainText("Ditolak");

  await logout(page);

  await loginSchool(page);
  await openSchoolBookingPage(page);
  await page.getByLabel("Kata Kunci").fill("BK-401");
  const schoolArticle = page.locator("article", { hasText: "BK-401" });
  await expect(schoolArticle).toContainText("Ditolak");
});

test("admin can request document revision with filters and the result persists after reload", async ({ page, backend }) => {
  backend.reset();

  backend.state.documents.unshift(
    {
      id: "DOC-401",
      school_id: "school-1",
      booking_id: "BK-401",
      history_id: null,
      file_name: "Laporan Pelaksanaan Tahap 1.pdf",
      storage_path: "school-1/laporan-pelaksanaan-1.pdf",
      file_size: 204800,
      mime_type: "application/pdf",
      stage: "Pelaksanaan",
      review_status: "Menunggu Review",
      reviewer_notes: null,
      version: 1,
      parent_doc_id: null,
      uploaded_at: "15 Mar 2026",
      created_at: "2026-03-15T08:30:00.000Z",
    },
    {
      id: "DOC-402",
      school_id: "school-1",
      booking_id: null,
      history_id: null,
      file_name: "Profil Sekolah Final.pdf",
      storage_path: "school-1/profil-final.pdf",
      file_size: 102400,
      mime_type: "application/pdf",
      stage: "Melayani",
      review_status: "Disetujui",
      reviewer_notes: null,
      version: 1,
      parent_doc_id: null,
      uploaded_at: "14 Mar 2026",
      created_at: "2026-03-14T08:30:00.000Z",
    },
  );

  await loginAdmin(page);
  await gotoPath(page, "/dashboard-admin/dokumen");
  await page.getByRole("button", { name: "Menunggu Review" }).click();
  await page.getByRole("button", { name: "Pelaksanaan" }).click();

  const pelaksanaanRow = page.locator("tr", { hasText: "DOC-401" });
  await expect(pelaksanaanRow).toContainText("Laporan Pelaksanaan Tahap 1.pdf");
  await expect(page.locator("tr", { hasText: "DOC-402" })).toHaveCount(0);

  await pelaksanaanRow.getByRole("button", { name: "Minta Revisi" }).click();
  await expect(page.getByRole("button", { name: "Konfirmasi Minta Revisi" })).toBeDisabled();
  await page.getByPlaceholder("Jelaskan bagian yang perlu direvisi...").fill("Tambahkan indikator ketercapaian yang lebih rinci.");
  await page.getByRole("button", { name: "Konfirmasi Minta Revisi" }).click();
  await expect(page.getByText("Dokumen DOC-401 ditandai perlu revisi.")).toBeVisible();

  await page.getByRole("button", { name: "Perlu Revisi" }).first().click();
  await expect(page.locator("tr", { hasText: "DOC-401" })).toContainText("Catatan: Tambahkan indikator ketercapaian yang lebih rinci.");

  await page.reload();
  await page.getByRole("button", { name: "Perlu Revisi" }).first().click();
  await page.getByRole("button", { name: "Pelaksanaan" }).click();
  await expect(page.locator("tr", { hasText: "DOC-401" })).toContainText("Perlu Revisi");
});

test("school can filter riwayat, paginate results, and keep notification read state after reload", async ({ page, backend }) => {
  backend.reset();

  backend.state.histories.unshift(
    {
      id: "RH-601",
      school_id: "school-1",
      booking_id: "BK-601",
      date_iso: "2026-03-15",
      school_name: "SDN 1 Makale",
      session: "09.00 - 11.00 WITA",
      title: "Pendampingan Literasi 6",
      description: "Riwayat keenam untuk uji pagination.",
      status: "Tindak Lanjut",
      follow_up_iso: "2026-03-20",
      supervisor_notes: null,
      follow_up_done: false,
      follow_up_items: [],
      created_at: "2026-03-15T08:00:00.000Z",
    },
    {
      id: "RH-602",
      school_id: "school-1",
      booking_id: "BK-602",
      date_iso: "2026-03-14",
      school_name: "SDN 1 Makale",
      session: "09.00 - 11.00 WITA",
      title: "Pendampingan Literasi 5",
      description: "Riwayat kelima.",
      status: "Laporan",
      follow_up_iso: null,
      supervisor_notes: null,
      follow_up_done: false,
      follow_up_items: [],
      created_at: "2026-03-14T08:00:00.000Z",
    },
    {
      id: "RH-603",
      school_id: "school-1",
      booking_id: "BK-603",
      date_iso: "2026-03-13",
      school_name: "SDN 1 Makale",
      session: "09.00 - 11.00 WITA",
      title: "Pendampingan Literasi 4",
      description: "Riwayat keempat.",
      status: "Selesai",
      follow_up_iso: null,
      supervisor_notes: null,
      follow_up_done: true,
      follow_up_items: [],
      created_at: "2026-03-13T08:00:00.000Z",
    },
    {
      id: "RH-604",
      school_id: "school-1",
      booking_id: "BK-604",
      date_iso: "2026-03-12",
      school_name: "SDN 1 Makale",
      session: "09.00 - 11.00 WITA",
      title: "Pendampingan Literasi 3",
      description: "Riwayat ketiga.",
      status: "Tindak Lanjut",
      follow_up_iso: "2026-03-18",
      supervisor_notes: null,
      follow_up_done: false,
      follow_up_items: [],
      created_at: "2026-03-12T08:00:00.000Z",
    },
    {
      id: "RH-605",
      school_id: "school-1",
      booking_id: "BK-605",
      date_iso: "2026-03-11",
      school_name: "SDN 1 Makale",
      session: "09.00 - 11.00 WITA",
      title: "Pendampingan Literasi 2",
      description: "Riwayat kedua.",
      status: "Laporan",
      follow_up_iso: null,
      supervisor_notes: null,
      follow_up_done: false,
      follow_up_items: [],
      created_at: "2026-03-11T08:00:00.000Z",
    },
    {
      id: "RH-606",
      school_id: "school-1",
      booking_id: "BK-606",
      date_iso: "2026-03-10",
      school_name: "SDN 1 Makale",
      session: "09.00 - 11.00 WITA",
      title: "Pendampingan Literasi 1",
      description: "Riwayat pertama.",
      status: "Selesai",
      follow_up_iso: null,
      supervisor_notes: null,
      follow_up_done: true,
      follow_up_items: [],
      created_at: "2026-03-10T08:00:00.000Z",
    },
  );
  backend.state.notifications.unshift(
    {
      id: "NTF-701",
      user_id: "school-1",
      title: "Riwayat Baru",
      message: "Riwayat RH-601 siap dibuka.",
      type: "booking_completed",
      reference_id: "RH-601",
      reference_type: "history",
      is_read: false,
      created_at: "2026-03-15T09:00:00.000Z",
    },
    {
      id: "NTF-702",
      user_id: "school-1",
      title: "Dokumen Direview",
      message: "Dokumen terbaru sudah diperiksa.",
      type: "doc_review",
      reference_id: "DOC-401",
      reference_type: "document",
      is_read: false,
      created_at: "2026-03-15T09:05:00.000Z",
    },
  );

  await loginSchool(page);
  await gotoPath(page, "/dashboard/riwayat");
  await expect(page.getByText("Halaman 1 dari 2")).toBeVisible();
  await page.getByRole("button", { name: "Berikutnya" }).click();
  await expect(page.getByText("Halaman 2 dari 2")).toBeVisible();
  await expect(page.getByText("Pendampingan Literasi 1")).toBeVisible();

  await page.getByRole("button", { name: "Sebelumnya" }).click();
  await page.getByLabel("Kata Kunci").fill("Literasi 6");
  await expect(page.getByRole("heading", { name: "Pendampingan Literasi 6" })).toBeVisible();
  await page.locator("select").nth(0).selectOption("Tindak Lanjut");
  await page.locator("select").nth(1).selectOption("date-asc");
  await page.getByLabel("Tanggal").fill("2026-03-15");
  await expect(page.getByRole("heading", { name: "Pendampingan Literasi 6" })).toBeVisible();

  await page.goto("/dashboard/ringkasan");
  await page.getByRole("button", { name: "Notifikasi" }).click();
  await expect(page.getByRole("button", { name: "Tandai semua dibaca" })).toBeVisible();
  await page.getByRole("button", { name: "Tandai semua dibaca" }).click();
  await expect(page.getByRole("button", { name: "Tandai semua dibaca" })).toHaveCount(0);

  await page.reload();
  await page.getByRole("button", { name: "Notifikasi" }).click();
  await expect(page.getByRole("button", { name: "Tandai semua dibaca" })).toHaveCount(0);
});
