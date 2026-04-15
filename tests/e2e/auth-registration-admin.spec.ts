import { expect } from "@playwright/test";
import { test } from "./support/fixtures";

async function login(
  page: Parameters<typeof test>[0]["page"],
  email: string,
  password = "password123",
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
}

async function logout(page: Parameters<typeof test>[0]["page"]) {
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
}

function dateOffsetIso(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

test("school registration and admin flow stay functional end-to-end", async ({ page, backend }) => {
  backend.reset();

  const schoolEmail = "smp.registrasi@example.com";
  const schoolPassword = "password123";
  const schoolName = "SMP Negeri Registrasi";

  await page.goto("/daftar-sekolah");
  await page.getByLabel("Nama Sekolah").fill(schoolName);
  await page.getByLabel("NPSN").fill("99887766");
  await page.getByLabel("Nama Penanggung Jawab").fill("Rina Operator");
  await page.getByLabel("Email").fill(schoolEmail);
  await page.getByLabel("No. Telepon").fill("081233344455");
  await page.getByLabel("Alamat Sekolah").fill("Jl. Poros Pendidikan No. 9");
  await page.getByLabel("Password", { exact: true }).fill(schoolPassword);
  await page.getByLabel("Konfirmasi Password", { exact: true }).fill(schoolPassword);
  await page.getByRole("button", { name: "Daftar Sekolah" }).click();

  await expect(page.getByText("Registrasi berhasil!")).toBeVisible();
  expect(backend.state.accounts.some((account) => account.email === schoolEmail)).toBeTruthy();

  await page.goto("/login?redirectTo=%2Fdashboard%2Fbooking-baru");
  await page.getByLabel("Email").fill(schoolEmail);
  await page.getByLabel("Kata Sandi").fill(schoolPassword);
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page.getByText("Akun menunggu verifikasi operator sekolah.")).toBeVisible();

  await login(page, "admin@example.com");
  await expect(page).toHaveURL(/\/dashboard-admin$/);

  await page.goto("/dashboard-admin/sekolah");
  const schoolCard = page.locator("article", { hasText: schoolName });
  await expect(schoolCard).toContainText("Pending");
  await schoolCard.getByRole("button", { name: "Setujui Akun" }).click();
  await expect(page.getByText("Akun sekolah berhasil diaktifkan.")).toBeVisible();
  await expect(schoolCard).toContainText("Aktif");

  await logout(page);

  await page.goto("/login?redirectTo=%2Fdashboard%2Fbooking-baru");
  await page.getByLabel("Email").fill(schoolEmail);
  await page.getByLabel("Kata Sandi").fill(schoolPassword);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard\/booking-baru$/);
  await expect(page.getByLabel("Topik Pendampingan")).toBeVisible();
  await expect(page.getByLabel("Tanggal")).toBeVisible();
  const bookingDate = dateOffsetIso(7);

  await page.getByLabel("Topik Pendampingan").fill("Pendampingan Program Kerja Tahunan");
  await page.getByLabel("Kategori Layanan").selectOption("Pendampingan");
  await page.getByLabel("Tanggal").fill(bookingDate);
  await page.getByLabel("Sesi").selectOption("09.00 - 12.00 WITA");
  await page.getByLabel("Tujuan Pendampingan").fill("Menyelaraskan program kerja sekolah dengan target semester.");
  await page.getByLabel("Catatan Tambahan").fill("Butuh review prioritas program dan indikator keberhasilan.");
  await page.getByRole("button", { name: "Kirim Booking" }).click();
  await page.getByRole("button", { name: "Ya, Kirim Booking" }).click();

  const successSection = page.locator("section").filter({ hasText: "Booking Berhasil Diajukan" });
  await expect(successSection).toBeVisible();
  const successText = await successSection.textContent();
  const bookingId = successText?.match(/Booking\s+(BK-[A-Z0-9]+)/)?.[1];
  expect(bookingId).toBeTruthy();

  await page.goto("/dashboard/booking");
  const schoolBookingCard = page.locator("article", { hasText: bookingId! });
  await expect(schoolBookingCard).toContainText("Menunggu");

  await logout(page);

  await login(page, "admin@example.com");
  await expect(page).toHaveURL(/\/dashboard-admin$/);

  await page.goto("/dashboard-admin/sekolah");
  await expect(page.getByText(schoolName)).toBeVisible();

  await page.goto("/dashboard-admin/booking");
  const adminBookingRow = page.locator("tr", { hasText: bookingId! });
  await expect(adminBookingRow).toContainText("Pendampingan Program Kerja Tahunan");
  await expect(adminBookingRow).toContainText(schoolName);

  await adminBookingRow.getByRole("button", { name: "Setujui" }).click();
  await expect(adminBookingRow).toContainText("Disetujui");
  await adminBookingRow.getByRole("button", { name: "Mulai Sesi" }).click();
  await expect(adminBookingRow).toContainText("Dalam Proses");

  await logout(page);

  await login(page, schoolEmail, schoolPassword);
  await expect(page).toHaveURL(/\/dashboard\/ringkasan$/);
  await page.goto(`/dashboard/booking/${bookingId}`);
  await expect(page.getByText("DALAM PROSES", { exact: true })).toBeVisible();
  await expect(page.getByText("Pendampingan Program Kerja Tahunan")).toBeVisible();
});

test("rejected school account cannot log in until status changes", async ({ page, backend }) => {
  backend.reset();

  const schoolEmail = "smp.ditolak@example.com";
  const schoolPassword = "password123";
  const schoolName = "SMP Negeri Ditolak";

  await page.goto("/daftar-sekolah");
  await page.getByLabel("Nama Sekolah").fill(schoolName);
  await page.getByLabel("NPSN").fill("88776655");
  await page.getByLabel("Nama Penanggung Jawab").fill("Dina Operator");
  await page.getByLabel("Email").fill(schoolEmail);
  await page.getByLabel("No. Telepon").fill("081277788899");
  await page.getByLabel("Alamat Sekolah").fill("Jl. Penolakan No. 7");
  await page.getByLabel("Password", { exact: true }).fill(schoolPassword);
  await page.getByLabel("Konfirmasi Password", { exact: true }).fill(schoolPassword);
  await page.getByRole("button", { name: "Daftar Sekolah" }).click();
  await expect(page.getByText("Registrasi berhasil!")).toBeVisible();

  await login(page, "admin@example.com");
  await expect(page).toHaveURL(/\/dashboard-admin$/);
  await page.goto("/dashboard-admin/sekolah");
  const schoolCard = page.locator("article", { hasText: schoolName });
  await schoolCard.getByRole("button", { name: "Tolak Akun" }).click();
  await page.getByPlaceholder("Contoh: NPSN tidak sesuai data sekolah.").fill("Data sekolah belum sesuai dengan verifikasi operator.");
  await page.getByRole("button", { name: "Konfirmasi Tolak" }).click();
  await expect(page.getByText("Akun sekolah ditandai ditolak.")).toBeVisible();
  await expect(schoolCard).toContainText("Ditolak");
  expect(backend.state.accounts.find((account) => account.email === schoolEmail)?.approval_rejection_reason).toContain("Data sekolah");

  await logout(page);

  await page.goto("/login");
  await page.getByLabel("Email").fill(schoolEmail);
  await page.getByLabel("Kata Sandi").fill(schoolPassword);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText("Akun ditolak. Hubungi admin atau operator sekolah.")).toBeVisible();
});

test("admin login keeps route guard and main review actions working", async ({ page, backend }) => {
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

  await page.goto("/dashboard-admin");
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

  await login(page, "admin@example.com");
  await expect(page).toHaveURL(/\/dashboard-admin$/);
  await expect(page.getByText("Dashboard admin,")).toBeVisible();

  await page.goto("/dashboard-admin/booking");
  const bookingRow = page.locator("tr", { hasText: "BK-REG-001" });
  await bookingRow.getByRole("button", { name: "Setujui" }).click();
  await expect(bookingRow).toContainText("Disetujui");

  await page.goto("/dashboard-admin/dokumen");
  const documentRow = page.locator("tr", { hasText: "DOC-REG-001" });
  await documentRow.getByRole("button", { name: "Minta Revisi" }).click();
  await page.getByPlaceholder("Jelaskan bagian yang perlu direvisi...").fill("Lengkapi indikator capaian program literasi semester ini.");
  await page.getByRole("button", { name: "Konfirmasi Minta Revisi" }).click();
  await expect(page.getByText(/Dokumen .* ditandai perlu revisi\./)).toBeVisible();
});

test("admin can repair and delete orphan auth accounts", async ({ page, backend }) => {
  backend.reset();

  backend.state.orphanAccounts.push({
    ...backend.state.accounts[0],
    id: "orphan-repair-1",
    email: "orphan.repair@example.com",
    password: "password123",
    role: "school",
    approval_status: "pending",
    school_name: "SD Orphan Repair",
    npsn: "55443322",
    contact_name: "Operator Orphan",
    phone: "081233344400",
    address: "Jl. Orphan Repair No. 1",
    approval_reviewed_at: null,
    approval_reviewed_by: null,
    approval_rejection_reason: null,
  });
  backend.state.orphanAccounts.push({
    ...backend.state.accounts[0],
    id: "orphan-delete-1",
    email: "orphan.delete@example.com",
    password: "password123",
    role: "school",
    approval_status: "pending",
    school_name: "SD Orphan Delete",
    npsn: "55443323",
    contact_name: "Operator Delete",
    phone: "081233344401",
    address: "Jl. Orphan Delete No. 1",
    approval_reviewed_at: null,
    approval_reviewed_by: null,
    approval_rejection_reason: null,
  });

  await login(page, "admin@example.com");
  await expect(page).toHaveURL(/\/dashboard-admin$/);
  await page.goto("/dashboard-admin/sekolah");

  const repairRow = page.locator("article", { hasText: "SD Orphan Repair" });
  await expect(repairRow).toContainText("Bisa diperbaiki");
  await repairRow.getByRole("button", { name: "Perbaiki" }).click();
  await expect(page.getByText("Akun yatim berhasil diperbaiki.")).toBeVisible();
  expect(backend.state.accounts.some((account) => account.id === "orphan-repair-1")).toBeTruthy();

  const deleteRow = page.locator("article", { hasText: "SD Orphan Delete" });
  await deleteRow.getByRole("button", { name: "Hapus" }).click();
  await expect(page.getByText("Akun yatim berhasil dihapus.")).toBeVisible();
  expect(backend.state.orphanAccounts.some((account) => account.id === "orphan-delete-1")).toBeFalsy();
});
