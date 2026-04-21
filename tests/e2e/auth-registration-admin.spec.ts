import { expect } from "@playwright/test";
import { test } from "./support/fixtures";
import {
  gotoPath,
  loginAdmin,
  loginSchool,
  logout,
  openSchoolBookingPage,
  registerSchool,
  submitLoginForm,
} from "./support/app";

function dateOffsetIso(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

test("school registration, admin approval, and NPSN login stay functional end-to-end", async ({
  page,
  backend,
}) => {
  backend.reset();

  const schoolPassword = "password123";
  const schoolName = "SMP Negeri Registrasi";
  const schoolNpsn = "99887766";

  await registerSchool(page, {
    schoolName,
    npsn: schoolNpsn,
    contactName: "Rina Operator",
    phone: "081233344455",
    address: "Jl. Poros Pendidikan No. 9",
    password: schoolPassword,
  });

  await expect(page.getByText("Registrasi berhasil!")).toBeVisible();
  expect(
    backend.state.accounts.some(
      (account) => account.npsn === schoolNpsn && account.approval_status === "pending",
    ),
  ).toBeTruthy();

  await gotoPath(page, "/login?redirectTo=%2Fdashboard%2Fbooking-baru");
  await submitLoginForm(page, schoolNpsn, schoolPassword);
  await expect(page.getByText("Akun menunggu verifikasi operator sekolah.")).toBeVisible();

  await loginAdmin(page);
  await gotoPath(page, "/dashboard-admin/sekolah");
  const schoolCard = page.locator("article", { hasText: schoolName });
  await expect(schoolCard).toContainText("Pending");
  await schoolCard.getByRole("button", { name: "Setujui Akun" }).click();
  await expect(page.getByText("Akun sekolah berhasil diaktifkan.")).toBeVisible();
  await expect(schoolCard).toContainText("Aktif");

  await logout(page);

  await gotoPath(page, "/login?redirectTo=%2Fdashboard%2Fbooking-baru");
  await submitLoginForm(page, schoolNpsn, schoolPassword);
  await expect(page).toHaveURL(/\/dashboard\/ringkasan$/);
  await gotoPath(page, "/dashboard/booking-baru");
  await expect(page.getByLabel("Topik Pendampingan")).toBeVisible();

  const bookingDate = dateOffsetIso(7);
  await page.getByLabel("Topik Pendampingan").fill("Pendampingan Program Kerja Tahunan");
  await page.getByLabel("Kategori Layanan").selectOption("Pendampingan");
  await page.getByLabel("Tanggal").fill(bookingDate);
  await page.getByLabel("Sesi").selectOption("09.00 - 12.00 WITA");
  await page
    .getByLabel("Tujuan Pendampingan")
    .fill("Menyelaraskan program kerja sekolah dengan target semester.");
  await page
    .getByLabel("Catatan Tambahan")
    .fill("Butuh review prioritas program dan indikator keberhasilan.");
  await page.getByRole("button", { name: "Kirim Booking" }).click();
  await page.getByRole("button", { name: "Ya, Kirim Booking" }).click();

  const successSection = page
    .locator("section")
    .filter({ hasText: "Booking Berhasil Diajukan" });
  await expect(successSection).toBeVisible();
  const successText = await successSection.textContent();
  const bookingId = successText?.match(/Booking\s+(BK-[A-Z0-9]+)/)?.[1];
  expect(bookingId).toBeTruthy();

  await openSchoolBookingPage(page);
  const schoolBookingCard = page.locator("article", { hasText: bookingId! });
  await expect(schoolBookingCard).toContainText("Menunggu");

  await logout(page);

  await loginAdmin(page);
  await gotoPath(page, "/dashboard-admin/booking");
  const adminBookingRow = page.locator("tr", { hasText: bookingId! });
  await expect(adminBookingRow).toContainText("Pendampingan Program Kerja Tahunan");
  await expect(adminBookingRow).toContainText(schoolName);
  await adminBookingRow.getByRole("button", { name: "Setujui" }).click();
  await expect(adminBookingRow).toContainText("Disetujui");
  await adminBookingRow.getByRole("button", { name: "Mulai Sesi" }).click();
  await expect(adminBookingRow).toContainText("Dalam Proses");

  await logout(page);

  await loginSchool(page, schoolNpsn, schoolPassword);
  await gotoPath(page, `/dashboard/booking/${bookingId}`);
  await expect(page.getByText("DALAM PROSES", { exact: true })).toBeVisible();
  await expect(page.getByText("Pendampingan Program Kerja Tahunan")).toBeVisible();
});

test("rejected school account remains blocked until operator changes status", async ({
  page,
  backend,
}) => {
  backend.reset();

  const schoolPassword = "password123";
  const schoolName = "SMP Negeri Ditolak";
  const schoolNpsn = "88776655";

  await registerSchool(page, {
    schoolName,
    npsn: schoolNpsn,
    contactName: "Dina Operator",
    phone: "081277788899",
    address: "Jl. Penolakan No. 7",
    password: schoolPassword,
  });
  await expect(page.getByText("Registrasi berhasil!")).toBeVisible();

  await loginAdmin(page);
  await gotoPath(page, "/dashboard-admin/sekolah");
  const schoolCard = page.locator("article", { hasText: schoolName });
  await schoolCard.getByRole("button", { name: "Tolak Akun" }).click();
  await page
    .getByPlaceholder("Contoh: NPSN tidak sesuai data sekolah.")
    .fill("Data sekolah belum sesuai dengan verifikasi operator.");
  await page.getByRole("button", { name: "Konfirmasi Tolak" }).click();
  await expect(page.getByText("Akun sekolah ditandai ditolak.")).toBeVisible();
  await expect(schoolCard).toContainText("Ditolak");

  await logout(page);

  await gotoPath(page, "/login");
  await submitLoginForm(page, schoolNpsn, schoolPassword);
  await expect(
    page.getByText("Akun ditolak. Hubungi admin atau operator sekolah."),
  ).toBeVisible();
});

test("admin login keeps route guard and main review actions working", async ({
  page,
  backend,
}) => {
  backend.reset();

  backend.state.bookings.unshift({
    id: "BK-REG-001",
    school_id: "school-1",
    school_name: "SDN 1 Makale",
    topic: "Verifikasi Program Literasi",
    category: "Supervisi",
    date_iso: "2026-04-12",
    session: "08.00 - 10.00 WITA",
    status: "Menunggu",
    timeline: [],
    goal: "Meninjau implementasi literasi sekolah.",
    notes: "Mohon cek kesiapan dokumen.",
    cancel_reason: null,
    rating: null,
    feedback: null,
    supervisor_notes: null,
    created_at: "2026-04-05T08:00:00.000Z",
  });

  backend.state.documents.unshift({
    id: "DOC-REG-001",
    school_id: "school-1",
    booking_id: "BK-REG-001",
    history_id: null,
    file_name: "Dokumen Program Literasi.pdf",
    storage_path: "school-1/dokumen-program-literasi.pdf",
    file_size: 12400,
    mime_type: "application/pdf",
    stage: "Melayani",
    review_status: "Menunggu Review",
    reviewer_notes: null,
    version: 1,
    parent_doc_id: null,
    uploaded_at: "5 Apr 2026",
    created_at: "2026-04-05T08:05:00.000Z",
  });
  backend.state.storagePaths.push("school-1/dokumen-program-literasi.pdf");

  await gotoPath(page, "/dashboard-admin");
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

  await loginAdmin(page);
  await expect(page).toHaveURL(/\/dashboard-admin$/);
  await expect(page.getByText("Dashboard admin,")).toBeVisible();

  await gotoPath(page, "/dashboard-admin/booking");
  const bookingRow = page.locator("tr", { hasText: "BK-REG-001" });
  await bookingRow.getByRole("button", { name: "Setujui" }).click();
  await expect(bookingRow).toContainText("Disetujui");

  await gotoPath(page, "/dashboard-admin/dokumen");
  const documentRow = page.locator("tr", { hasText: "DOC-REG-001" });
  await documentRow.getByRole("button", { name: "Minta Revisi" }).click();
  await page
    .getByPlaceholder("Jelaskan bagian yang perlu direvisi...")
    .fill("Lengkapi indikator capaian program literasi semester ini.");
  await page.getByRole("button", { name: "Konfirmasi Minta Revisi" }).click();
  await expect(page.getByText(/Dokumen .* ditandai perlu revisi\./)).toBeVisible();
});
