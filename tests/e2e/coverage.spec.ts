import { expect } from "@playwright/test";
import { test } from "./support/fixtures";
import { gotoPath, loginAdmin, loginSchool, logout, openSchoolBookingPage } from "./support/app";

test("school can cancel a booking and admin can clear the resulting notification", async ({ page, backend }) => {
  backend.reset();

  backend.state.bookings.unshift({
    id: "BK-301",
    school_id: "school-1",
    school_name: "SDN 1 Makale",
    topic: "Pendampingan Kurikulum",
    category: "Pendampingan",
    date_iso: "2026-03-21",
    session: "08.00 - 10.00 WITA",
    status: "Menunggu",
    timeline: [],
    goal: "Sinkronisasi rencana tindak lanjut.",
    notes: "Mohon cek kesesuaian perangkat ajar.",
    cancel_reason: null,
    rating: null,
    feedback: null,
    supervisor_notes: null,
    created_at: "2026-03-13T08:00:00.000Z",
  });

  await loginSchool(page);
  await openSchoolBookingPage(page);

  const bookingArticle = page.locator("article", { hasText: "Pendampingan Kurikulum" });
  await expect(bookingArticle).toContainText("Menunggu");
  await bookingArticle.getByRole("button", { name: "Batalkan" }).click();
  await page.getByPlaceholder("Jelaskan alasan pembatalan...").fill("Jadwal kepala sekolah bentrok.");
  await page.getByRole("button", { name: "Ya, Batalkan" }).click();
  await expect(page.getByText("Booking BK-301 dibatalkan.")).toBeVisible();
  await expect(bookingArticle).toContainText("Dibatalkan");

  await logout(page);

  await loginAdmin(page);
  await page.getByRole("button", { name: "Notifikasi" }).click();
  await expect(page.getByRole("button", { name: "Booking Dibatalkan" })).toBeVisible();
  await page.getByRole("button", { name: "Tandai semua dibaca" }).click();
  await expect(page.getByRole("button", { name: "Tandai semua dibaca" })).toHaveCount(0);
});

test("school can upload and delete a document from the document workspace", async ({ page, backend }) => {
  backend.reset();

  await loginSchool(page);
  await gotoPath(page, "/dashboard/dokumen");
  await page.getByRole("button", { name: "Melayani" }).click();
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "Dokumen Observasi.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("mock upload"),
  });

  await expect(page.getByText('Dokumen "Dokumen Observasi.pdf" berhasil diunggah.')).toBeVisible();
  const documentHeading = page.getByRole("heading", { name: "Dokumen Observasi.pdf" });
  await expect(documentHeading).toBeVisible();

  const documentArticle = page.locator("article", { hasText: "Dokumen Observasi.pdf" });
  await documentArticle.getByRole("button", { name: "Hapus" }).click();
  await page.getByRole("button", { name: "Ya, Hapus" }).click();

  await expect(page.getByText('Dokumen "Dokumen Observasi.pdf" berhasil dihapus.')).toBeVisible();
  await expect(documentHeading).toHaveCount(0);
});

test("school can add a link document and admin can open it from review", async ({ page, backend }) => {
  backend.reset();

  await loginSchool(page);
  await gotoPath(page, "/dashboard/dokumen");
  await page.getByRole("button", { name: "Laporan" }).click();
  await page.getByLabel("Judul Link").fill("Rekap Program Kerja");
  await page.getByLabel("Tautan").fill("https://example.com/rekap-program-kerja");
  await page.getByRole("button", { name: "Tambah Link" }).click();

  const linkArticle = page.locator("article", { hasText: "Rekap Program Kerja" });
  await expect(page.getByText('Dokumen "Rekap Program Kerja" berhasil diunggah.')).toBeVisible();
  await expect(linkArticle).toContainText("Link");
  await expect(linkArticle).toContainText("Laporan");

  await logout(page);

  await loginAdmin(page);
  await gotoPath(page, "/dashboard-admin/dokumen");
  const linkRow = page.locator("tr", { hasText: "Rekap Program Kerja" });
  await expect(linkRow).toContainText("Buka Link");

  const linkPopupPromise = page.waitForEvent("popup");
  await linkRow.getByRole("button", { name: "Buka Link" }).click();
  const linkPopup = await linkPopupPromise;
  await linkPopup.waitForLoadState("domcontentloaded");
  await expect(linkPopup).toHaveURL(/example\.com\/rekap-program-kerja/);
});

test("school can upload image and video documents with the correct labels", async ({ page, backend }) => {
  backend.reset();

  await loginSchool(page);
  await gotoPath(page, "/dashboard/dokumen");
  await page.getByRole("button", { name: "Pelaksanaan" }).click();
  const fileInput = page.locator('input[type="file"]').first();

  await fileInput.setInputFiles([
    {
      name: "Foto Kegiatan.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("mock image"),
    },
    {
      name: "Video Kegiatan.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from("mock video"),
    },
  ]);

  await expect(page.getByText('Dokumen "Foto Kegiatan.jpg" berhasil diunggah.')).toBeVisible();
  await expect(page.getByText('Dokumen "Video Kegiatan.mp4" berhasil diunggah.')).toBeVisible();

  const imageArticle = page.locator("article", { hasText: "Foto Kegiatan.jpg" });
  const videoArticle = page.locator("article", { hasText: "Video Kegiatan.mp4" });
  await expect(imageArticle).toContainText("Foto");
  await expect(imageArticle).toContainText("Pelaksanaan");
  await expect(videoArticle).toContainText("Video");
  await expect(videoArticle).toContainText("Pelaksanaan");
});

test("route guards redirect unauthenticated and wrong-role users to the correct area", async ({ page, backend }) => {
  backend.reset();

  await gotoPath(page, "/dashboard/ringkasan");
  await expect(page).toHaveURL(/\/login$/);

  await loginSchool(page);
  await gotoPath(page, "/dashboard-admin");
  await expect(page).toHaveURL(/\/dashboard\/ringkasan$/);

  await logout(page);

  await loginAdmin(page);
  await gotoPath(page, "/dashboard/ringkasan");
  await expect(page).toHaveURL(/\/dashboard-admin$/);
});
