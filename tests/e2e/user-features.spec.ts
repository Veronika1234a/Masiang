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

test("school booking page supports search, status/date filter, sort, pagination, and reset", async ({
  page,
  backend,
}) => {
  backend.reset();

  const bookingRows = [
    {
      id: "BK-U601",
      school_id: "school-1",
      school_name: "SDN 1 Makale",
      topic: "Topik 01",
      category: "Pendampingan",
      date_iso: "2026-03-01",
      session: "08.00 - 10.00 WITA",
      status: "Menunggu",
      timeline: [],
      goal: "Goal 1",
      notes: "Notes 1",
      cancel_reason: null,
      rating: null,
      feedback: null,
      supervisor_notes: null,
      created_at: "2026-03-01T08:00:00.000Z",
    },
    {
      id: "BK-U602",
      school_id: "school-1",
      school_name: "SDN 1 Makale",
      topic: "Topik 02",
      category: "Supervisi",
      date_iso: "2026-03-02",
      session: "09.00 - 11.00 WITA",
      status: "Disetujui",
      timeline: [],
      goal: "Goal 2",
      notes: "Notes 2",
      cancel_reason: null,
      rating: null,
      feedback: null,
      supervisor_notes: null,
      created_at: "2026-03-02T08:00:00.000Z",
    },
    {
      id: "BK-U603",
      school_id: "school-1",
      school_name: "SDN 1 Makale",
      topic: "Topik 03",
      category: "Workshop",
      date_iso: "2026-03-03",
      session: "10.00 - 12.00 WITA",
      status: "Dalam Proses",
      timeline: [],
      goal: "Goal 3",
      notes: "Notes 3",
      cancel_reason: null,
      rating: null,
      feedback: null,
      supervisor_notes: null,
      created_at: "2026-03-03T08:00:00.000Z",
    },
    {
      id: "BK-U604",
      school_id: "school-1",
      school_name: "SDN 1 Makale",
      topic: "Topik 04",
      category: "Seminar",
      date_iso: "2026-03-04",
      session: "13.00 - 15.00 WITA",
      status: "Selesai",
      timeline: [],
      goal: "Goal 4",
      notes: "Notes 4",
      cancel_reason: null,
      rating: 4,
      feedback: "Bagus",
      supervisor_notes: "Catatan",
      created_at: "2026-03-04T08:00:00.000Z",
    },
    {
      id: "BK-U605",
      school_id: "school-1",
      school_name: "SDN 1 Makale",
      topic: "Topik 05",
      category: "Pendampingan",
      date_iso: "2026-03-05",
      session: "08.00 - 10.00 WITA",
      status: "Ditolak",
      timeline: [],
      goal: "Goal 5",
      notes: "Notes 5",
      cancel_reason: "Bentrok",
      rating: null,
      feedback: null,
      supervisor_notes: null,
      created_at: "2026-03-05T08:00:00.000Z",
    },
    {
      id: "BK-U606",
      school_id: "school-1",
      school_name: "SDN 1 Makale",
      topic: "Topik 06",
      category: "Pendampingan",
      date_iso: "2026-03-06",
      session: "08.00 - 10.00 WITA",
      status: "Dibatalkan",
      timeline: [],
      goal: "Goal 6",
      notes: "Notes 6",
      cancel_reason: "Internal",
      rating: null,
      feedback: null,
      supervisor_notes: null,
      created_at: "2026-03-06T08:00:00.000Z",
    },
  ];

  backend.state.bookings.unshift(...bookingRows);

  await login(page, "school@example.com");
  await page.goto("/dashboard/booking");

  await expect(page.getByText("Halaman 1 dari 2")).toBeVisible();
  await page.getByRole("button", { name: "Berikutnya" }).click();
  await expect(page.getByText("Halaman 2 dari 2")).toBeVisible();
  await expect(page.getByText("BK-U601")).toBeVisible();

  await page.getByRole("button", { name: "Sebelumnya" }).click();
  await page.getByPlaceholder("Cari sekolah, topik, atau ID").fill("BK-U603");
  await expect(page.locator("article", { hasText: "BK-U603" })).toContainText("Topik 03");
  await expect(page.locator("article", { hasText: "BK-U604" })).toHaveCount(0);

  await page.locator("select").first().selectOption("Dalam Proses");
  await expect(page.locator("article", { hasText: "BK-U603" })).toBeVisible();
  await expect(page.getByText("BK-U602")).toHaveCount(0);

  await page.locator("input[type='date']").first().fill("2026-03-03");
  await expect(page.locator("article", { hasText: "BK-U603" })).toBeVisible();

  await page.locator("select").nth(1).selectOption("date-asc");
  await expect(page.locator("article", { hasText: "BK-U603" })).toBeVisible();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByText("Halaman 1 dari 2")).toBeVisible();
  await expect(page.getByText("BK-U601")).toBeVisible();
});

test("school can cancel booking from booking detail page", async ({ page, backend }) => {
  backend.reset();

  backend.state.bookings.unshift({
    id: "BK-U701",
    school_id: "school-1",
    school_name: "SDN 1 Makale",
    topic: "Pendampingan RPP",
    category: "Pendampingan",
    date_iso: "2026-03-20",
    session: "09.00 - 12.00 WITA",
    status: "Menunggu",
    timeline: [
      { title: "Pengajuan diterima", note: "Masuk sistem", time: "08.00 WITA", status: "done" },
      { title: "Verifikasi admin", note: "Menunggu verifikasi", time: "Dalam antrean", status: "active" },
      { title: "Sesi pendampingan", note: "Belum dijadwalkan", time: "Belum tersedia", status: "pending" },
    ],
    goal: "Menyamakan format RPP",
    notes: "Fokus implementasi",
    cancel_reason: null,
    rating: null,
    feedback: null,
    supervisor_notes: null,
    created_at: "2026-03-19T08:00:00.000Z",
  });

  await login(page, "school@example.com");
  await page.goto("/dashboard/booking/BK-U701");

  await expect(page.getByRole("button", { name: "Batalkan Booking" })).toBeVisible();
  await page.getByRole("button", { name: "Batalkan Booking" }).click();
  await page.getByPlaceholder("Alasan pembatalan...").fill("Jadwal sekolah bentrok dengan agenda internal.");
  await page.getByRole("button", { name: "Ya, Batalkan" }).click();

  await expect(page.getByText("Booking BK-U701 dibatalkan.")).toBeVisible();
  await expect(page.getByText("DIBATALKAN", { exact: true })).toBeVisible();
});

test("school can use booking calendar status filter and open detail from event panel", async ({
  page,
  backend,
}) => {
  backend.reset();

  backend.state.bookings.unshift(
    {
      id: "BK-U801",
      school_id: "school-1",
      school_name: "SDN 1 Makale",
      topic: "Pendampingan Numerasi",
      category: "Pendampingan",
      date_iso: "2026-03-17",
      session: "08.00 - 10.00 WITA",
      status: "Disetujui",
      timeline: [
        { title: "Pengajuan diterima", note: "Masuk sistem", time: "08.00 WITA", status: "done" },
        { title: "Verifikasi admin", note: "Disetujui", time: "09.00 WITA", status: "done" },
        { title: "Sesi pendampingan", note: "Siap dimulai", time: "10.00 WITA", status: "active" },
      ],
      goal: "Penguatan numerasi",
      notes: "Monitoring awal",
      cancel_reason: null,
      rating: null,
      feedback: null,
      supervisor_notes: null,
      created_at: "2026-03-16T08:00:00.000Z",
    },
    {
      id: "BK-U802",
      school_id: "school-1",
      school_name: "SDN 1 Makale",
      topic: "Pendampingan Literasi",
      category: "Pendampingan",
      date_iso: "2026-03-18",
      session: "10.00 - 12.00 WITA",
      status: "Menunggu",
      timeline: [
        { title: "Pengajuan diterima", note: "Masuk sistem", time: "08.00 WITA", status: "done" },
        { title: "Verifikasi admin", note: "Menunggu", time: "Dalam antrean", status: "active" },
      ],
      goal: "Penguatan literasi",
      notes: "Monitoring",
      cancel_reason: null,
      rating: null,
      feedback: null,
      supervisor_notes: null,
      created_at: "2026-03-16T09:00:00.000Z",
    },
  );

  await login(page, "school@example.com");
  await page.goto("/dashboard/booking-jadwal");

  await page.getByRole("button", { name: "Disetujui" }).click();
  await expect(page.getByRole("button", { name: /08\.00 - 10\.00 WITA/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /10\.00 - 12\.00 WITA/ })).toHaveCount(0);

  await page.getByRole("button", { name: /08\.00 - 10\.00 WITA/ }).click();
  await expect(page.getByRole("link", { name: "Detail Penuh" })).toBeVisible();
  await page.getByRole("link", { name: "Detail Penuh" }).click();

  await expect(page).toHaveURL(/\/dashboard\/booking\/BK-U801$/);
  await expect(page.getByText("Pendampingan Numerasi")).toBeVisible();
});
