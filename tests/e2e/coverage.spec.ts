import { expect } from "@playwright/test";
import { test } from "./support/fixtures";

async function login(page: Parameters<typeof test>[0]["page"], email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill("password123");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(
    email === "admin@example.com"
      ? /\/dashboard-admin(?:\?.*)?$/
      : /\/dashboard\/ringkasan(?:\?.*)?$/,
  );
}

async function logout(page: Parameters<typeof test>[0]["page"]) {
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
}

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

  await login(page, "school@example.com");
  await page.goto("/dashboard/booking");

  const bookingArticle = page.locator("article", { hasText: "Pendampingan Kurikulum" });
  await expect(bookingArticle).toContainText("Menunggu");
  await bookingArticle.getByRole("button", { name: "Batalkan" }).click();
  await page.getByPlaceholder("Jelaskan alasan pembatalan...").fill("Jadwal kepala sekolah bentrok.");
  await page.getByRole("button", { name: "Ya, Batalkan" }).click();
  await expect(page.getByText("Booking BK-301 dibatalkan.")).toBeVisible();
  await expect(bookingArticle).toContainText("Dibatalkan");

  await logout(page);

  await login(page, "admin@example.com");
  await page.getByRole("button", { name: "Notifikasi" }).click();
  await expect(page.getByRole("button", { name: "Booking Dibatalkan" })).toBeVisible();
  await page.getByRole("button", { name: "Tandai semua dibaca" }).click();
  await expect(page.getByRole("button", { name: "Tandai semua dibaca" })).toHaveCount(0);
});

test("school can upload and delete a document from the document workspace", async ({ page, backend }) => {
  backend.reset();

  await login(page, "school@example.com");
  await page.goto("/dashboard/dokumen");
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

test("route guards redirect unauthenticated and wrong-role users to the correct area", async ({ page, backend }) => {
  backend.reset();

  await page.goto("/dashboard/booking");
  await expect(page).toHaveURL(/\/login$/);

  await login(page, "school@example.com");
  await page.goto("/dashboard-admin");
  await expect(page).toHaveURL(/\/dashboard\/ringkasan$/);

  await logout(page);

  await login(page, "admin@example.com");
  await page.goto("/dashboard/booking");
  await expect(page).toHaveURL(/\/dashboard-admin$/);
});
