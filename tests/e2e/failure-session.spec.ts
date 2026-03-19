import { expect } from "@playwright/test";
import { test } from "./support/fixtures";

async function login(page: Parameters<typeof test>[0]["page"], email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill("password123");
  await page.getByRole("button", { name: "Masuk" }).click();
}

test("failure path: cancel booking rolls back when booking update API fails", async ({
  page,
  backend,
}) => {
  backend.reset();
  backend.state.bookings.unshift({
    id: "BK-F501",
    school_id: "school-1",
    school_name: "SDN 1 Makale",
    topic: "Pendampingan KOSP",
    category: "Pendampingan",
    date_iso: "2026-03-24",
    session: "08.00 - 10.00 WITA",
    status: "Menunggu",
    timeline: [],
    goal: "Sinkronisasi KOSP",
    notes: "Agenda kepala sekolah",
    cancel_reason: null,
    rating: null,
    feedback: null,
    supervisor_notes: null,
    created_at: "2026-03-23T08:00:00.000Z",
  });

  await login(page, "school@example.com");
  await page.goto("/dashboard/booking");

  const bookingCard = page.locator("article", { hasText: "BK-F501" });
  await expect(bookingCard).toContainText("Menunggu");

  backend.failNextRequest({
    method: "PATCH",
    pathIncludes: "/rest/v1/bookings",
    status: 500,
    body: { message: "Booking API unavailable" },
  });

  await bookingCard.getByRole("button", { name: "Batalkan" }).click();
  await page.getByPlaceholder("Jelaskan alasan pembatalan...").fill("Bentrok agenda mendadak.");
  await page.getByRole("button", { name: "Ya, Batalkan" }).click();

  await expect(page.getByText("Gagal membatalkan booking BK-F501.")).toBeVisible();
  await expect(bookingCard).toContainText("Menunggu");
});

test("failure path: upload document shows error and does not add document when storage fails", async ({
  page,
  backend,
}) => {
  backend.reset();
  await login(page, "school@example.com");
  await page.goto("/dashboard/dokumen");

  backend.failNextRequest({
    method: "POST",
    pathIncludes: "/storage/v1/object/school-documents",
    status: 500,
    body: { message: "Storage unavailable" },
  });

  await page.getByRole("button", { name: "Melayani" }).click();
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "Dokumen Gagal.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("mock failed upload"),
  });

  await expect(page.getByText(/Storage unavailable|Gagal mengunggah dokumen/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dokumen Gagal.pdf" })).toHaveCount(0);
});

test("failure path: session-expired style error on profile save keeps edit mode and shows error", async ({
  page,
  backend,
}) => {
  backend.reset();
  await login(page, "school@example.com");
  await page.goto("/dashboard/profil");

  await page.getByRole("button", { name: "Edit Profil" }).click();
  await page.locator('input[value="Makale"]').fill("Makale Timur");

  backend.failNextRequest({
    method: "PATCH",
    pathIncludes: "/rest/v1/profiles",
    status: 401,
    body: { message: "JWT expired" },
  });

  await page.getByRole("button", { name: "Simpan Profil" }).click();

  await expect(page.getByText("Gagal menyimpan profil.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Simpan Profil" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Batal" })).toBeVisible();
});

test("session longevity: school remains authenticated after idle period and refresh", async ({
  page,
  backend,
}) => {
  backend.reset();
  await login(page, "school@example.com");
  await expect(page).toHaveURL(/\/dashboard\/ringkasan$/);
  await expect(page.getByText("Halo, SDN 1 Makale.")).toBeVisible();

  await page.waitForTimeout(6000);
  await page.reload();

  await expect(page).toHaveURL(/\/dashboard\/ringkasan$/);
  await page.goto("/dashboard/booking");
  await expect(page).toHaveURL(/\/dashboard\/booking$/);
});

test("session longevity: logout from one tab invalidates user state in another tab after refresh", async ({
  page,
  backend,
}) => {
  backend.reset();
  await login(page, "school@example.com");
  await expect(page).toHaveURL(/\/dashboard\/ringkasan$/);

  const secondTab = await page.context().newPage();
  await secondTab.goto("/dashboard/booking");
  await expect(secondTab).toHaveURL(/\/dashboard\/booking$/);

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

  await secondTab.reload();
  await expect(secondTab).toHaveURL(/\/login(?:\?.*)?$/);
  await secondTab.close();
});
