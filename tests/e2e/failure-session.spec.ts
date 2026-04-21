import { expect } from "@playwright/test";
import { test } from "./support/fixtures";
import { gotoPath, loginSchool, openSchoolBookingPage } from "./support/app";

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

  await loginSchool(page);
  await openSchoolBookingPage(page);

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
  await loginSchool(page);
  await gotoPath(page, "/dashboard/dokumen");

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
  await loginSchool(page);
  await gotoPath(page, "/dashboard/profil");

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
  await loginSchool(page);
  await expect(page).toHaveURL(/\/dashboard\/ringkasan$/);
  await expect(page.getByText("Halo, SDN 1 Makale.")).toBeVisible();

  await page.waitForTimeout(6000);
  await page.reload();

  await expect(page).toHaveURL(/\/dashboard\/ringkasan$/);
  await openSchoolBookingPage(page);
});

test("session longevity: logout from one tab invalidates user state in another tab after refresh", async ({
  page,
  backend,
}) => {
  backend.reset();
  await loginSchool(page);
  await expect(page).toHaveURL(/\/dashboard\/ringkasan$/);

  const secondTab = await page.context().newPage();
  await gotoPath(secondTab, "/dashboard/ringkasan");
  await expect(secondTab).toHaveURL(/\/dashboard\/ringkasan$/);

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

  await secondTab.reload();
  await expect(secondTab).toHaveURL(/\/login(?:\?.*)?$/);
  await secondTab.close();
});
