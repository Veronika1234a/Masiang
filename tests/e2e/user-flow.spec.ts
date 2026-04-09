import { expect } from "@playwright/test";
import { test } from "./support/fixtures";

function futureDate(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

async function login(
  page: Parameters<typeof test>[0]["page"],
  email: string,
  password = "password123",
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill(password);
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
  await expect(page.getByLabel("Email")).toBeVisible();
}

test("school and admin can complete the main lifecycle end-to-end", async ({ page, backend }) => {
  backend.reset();
  const bookingDate = futureDate(2);

  await login(page, "school@example.com");
  await expect(page.getByText("Halo, SDN 1 Makale.")).toBeVisible();

  await page.goto("/dashboard/booking-baru");
  await page.getByLabel("Topik Pendampingan").fill("Supervisi Akademik Semester Genap");
  await page.getByLabel("Kategori Layanan").selectOption("Supervisi");
  await page.getByLabel("Tanggal").fill(bookingDate);
  await page.getByLabel("Sesi").selectOption("09.00 - 12.00 WITA");
  await page.getByLabel("Tujuan Pendampingan").fill("Mendapatkan umpan balik untuk pembelajaran semester genap.");
  await page.getByLabel("Catatan Tambahan").fill("Mohon fokus pada observasi kelas dan tindak lanjut refleksi.");
  await page.getByRole("button", { name: "Kirim Booking" }).click();
  await page.getByRole("button", { name: "Ya, Kirim Booking" }).click();

  await expect(page.getByText("Booking Berhasil Diajukan")).toBeVisible();
  const successText = await page.locator("section").filter({ hasText: "Booking Berhasil Diajukan" }).textContent();
  const bookingId = successText?.match(/Booking\s+(BK-[A-Z0-9]+)/)?.[1];
  expect(bookingId).toBeTruthy();

  await page.getByRole("link", { name: "Lihat Daftar Booking" }).click();
  await expect(page).toHaveURL(/\/dashboard\/booking$/);
  await expect(page.getByText(bookingId!, { exact: true })).toBeVisible();

  await logout(page);

  await login(page, "admin@example.com");
  await expect(page).toHaveURL(/\/dashboard-admin$/);
  await expect(page.getByText("Dashboard admin,")).toBeVisible();

  await page.goto("/dashboard-admin/booking");
  const bookingRow = page.locator("tr", { hasText: bookingId! });
  await expect(bookingRow).toContainText("Supervisi Akademik Semester Genap");
  await bookingRow.getByRole("button", { name: "Setujui" }).click();
  await expect(bookingRow).toContainText("Disetujui");
  await bookingRow.getByRole("button", { name: "Mulai Sesi" }).click();
  await expect(bookingRow).toContainText("Dalam Proses");
  await bookingRow.getByRole("button", { name: "Catatan" }).click();
  await page.getByPlaceholder("Tulis catatan hasil observasi, rekomendasi, atau langkah tindak lanjut...").fill("Lanjutkan penguatan refleksi guru dan dokumentasikan hasil observasi.");
  await page.getByRole("button", { name: "Simpan Catatan" }).click();
  await expect(page.getByText("Catatan pengawas berhasil disimpan.")).toBeVisible();

  await logout(page);

  await login(page, "school@example.com");
  await page.goto(`/dashboard/booking/${bookingId}`);
  await expect(page.getByText("Catatan Pengawas")).toBeVisible();
  await expect(page.getByText("Lanjutkan penguatan refleksi guru")).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "Laporan Observasi.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("mock pdf"),
  });
  await expect(page.getByText('Dokumen "Laporan Observasi.pdf" berhasil diunggah.')).toBeVisible();
  await expect(page.getByText("Laporan Observasi.pdf", { exact: true })).toBeVisible();

  await logout(page);

  await login(page, "admin@example.com");
  await page.goto("/dashboard-admin/dokumen");
  const firstDocRow = page.locator("tr", { hasText: "Laporan Observasi.pdf" });
  await firstDocRow.getByRole("button", { name: "Minta Revisi" }).click();
  await page.getByPlaceholder("Jelaskan bagian yang perlu direvisi...").fill("Tambahkan ringkasan hasil refleksi guru.");
  await page.getByRole("button", { name: "Konfirmasi Minta Revisi" }).click();
  await expect(page.getByText(/Dokumen .* ditandai perlu revisi\./)).toBeVisible();

  await logout(page);

  await login(page, "school@example.com");
  await page.goto("/dashboard/dokumen");
  const revisedArticle = page.locator("article", { hasText: "Laporan Observasi.pdf" });
  await expect(revisedArticle).toContainText("Perlu Revisi");
  await revisedArticle.getByRole("button", { name: "Upload Revisi" }).click();
  await page.locator('input[type="file"]').nth(1).setInputFiles({
    name: "Laporan Observasi Revisi.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("mock revised pdf"),
  });
  await expect(page.getByText('Revisi "Laporan Observasi Revisi.pdf" berhasil diunggah.')).toBeVisible();

  await logout(page);

  await login(page, "admin@example.com");
  await page.goto("/dashboard-admin/dokumen");
  const revisedDocRow = page.locator("tr", { hasText: "Laporan Observasi Revisi.pdf" });
  await revisedDocRow.getByRole("button", { name: "Setujui" }).click();
  await page.getByRole("button", { name: "Konfirmasi Setujui" }).click();
  await expect(page.getByText(/ditandai disetujui\./)).toBeVisible();

  await page.goto("/dashboard-admin/booking");
  const inProgressRow = page.locator("tr", { hasText: bookingId! });
  await inProgressRow.getByRole("button", { name: "Selesai" }).click();
  await expect(page.getByText(`Sesi ${bookingId} ditandai selesai.`)).toBeVisible();

  await logout(page);

  await login(page, "school@example.com");
  await page.goto("/dashboard/riwayat");
  await expect(page.getByRole("heading", { name: "Supervisi Akademik Semester Genap" })).toBeVisible();
  const historyLink = page.getByRole("link", { name: "Lihat Detail" }).first();
  await historyLink.click();
  await expect(page.getByText("Checklist")).toBeVisible();
  await page.getByRole("button", { name: "Tandai Semua Selesai" }).click();
  await expect(page.getByText("Semua tindak lanjut ditandai selesai.")).toBeVisible();

  await page.goto(`/dashboard/booking/${bookingId}`);
  const ratingSection = page.locator("section").filter({ hasText: "Berikan Rating & Feedback" });
  await ratingSection.getByRole("button").nth(3).click();
  await ratingSection.getByPlaceholder("Bagikan pengalaman Anda selama sesi...").fill("Pendampingan sangat membantu untuk refleksi guru.");
  await page.getByRole("button", { name: "Kirim Rating" }).click();
  await expect(page.getByText("Terima kasih! Rating dan feedback berhasil disimpan.")).toBeVisible();
});

test("school can update profile and admin can inspect schools and documents", async ({ page, backend }) => {
  backend.reset();

  backend.state.bookings.unshift({
    id: "BK-201",
    school_id: "school-1",
    school_name: "SDN 1 Makale",
    topic: "Pendampingan Literasi",
    category: "Pendampingan",
    date_iso: "2026-03-18",
    session: "08.00 - 10.00 WITA",
    status: "Selesai",
    timeline: [],
    goal: "Penguatan literasi sekolah",
    notes: "Fokus pada program literasi pagi",
    cancel_reason: null,
    rating: null,
    feedback: null,
    supervisor_notes: "Pertahankan dokumentasi praktik baik.",
    created_at: "2026-03-13T08:00:00.000Z",
  });
  backend.state.histories.unshift({
    id: "RH-201",
    school_id: "school-1",
    booking_id: "BK-201",
    date_iso: "2026-03-18",
    school_name: "SDN 1 Makale",
    session: "08.00 - 10.00 WITA",
    title: "Pendampingan Literasi",
    description: "Sesi pendampingan literasi selesai dilaksanakan.",
    status: "Tindak Lanjut",
    follow_up_iso: "2026-03-25",
    supervisor_notes: "Pertahankan dokumentasi praktik baik.",
    follow_up_done: false,
    follow_up_items: [
      { id: "FU-1", text: "Upload laporan hasil sesi", done: false },
    ],
    created_at: "2026-03-18T11:00:00.000Z",
  });
  backend.state.documents.unshift({
    id: "DOC-201",
    school_id: "school-1",
    booking_id: "BK-201",
    history_id: "RH-201",
    file_name: "Laporan Literasi.pdf",
    storage_path: "school-1/laporan-literasi.pdf",
    file_size: 10240,
    mime_type: "application/pdf",
    stage: "Laporan",
    review_status: "Disetujui",
    reviewer_notes: null,
    version: 1,
    parent_doc_id: null,
    uploaded_at: "18 Mar 2026",
    created_at: "2026-03-18T12:00:00.000Z",
  });
  backend.state.storagePaths.push("school-1/laporan-literasi.pdf");
  backend.state.notifications.unshift({
    id: "NTF-201",
    user_id: "school-1",
    title: "Riwayat Tersedia",
    message: "Riwayat RH-201 siap dibuka.",
    type: "booking_completed",
    reference_id: "RH-201",
    reference_type: "history",
    is_read: false,
    created_at: "2026-03-18T12:30:00.000Z",
  });
  backend.state.notifications.unshift({
    id: "NTF-202",
    user_id: "admin-1",
    title: "Dokumen Baru",
    message: "Dokumen DOC-201 siap direview.",
    type: "doc_uploaded",
    reference_id: "DOC-201",
    reference_type: "document",
    is_read: false,
    created_at: "2026-03-18T12:31:00.000Z",
  });

  await login(page, "school@example.com");
  await page.goto("/dashboard/profil");
  await page.getByRole("button", { name: "Edit Profil" }).click();
  await page.locator('input[value="Makale"]').fill("Makale Utara");
  await page.locator('input[value="081234567890"]').fill("081299988877");
  await page.getByRole("button", { name: "Simpan Profil" }).click();
  await expect(page.getByText("Profil berhasil disimpan.")).toBeVisible();
  await expect(page.locator("div").filter({ hasText: /^Makale Utara$/ }).first()).toBeVisible();

  await page.goto("/dashboard/ringkasan");
  await page.locator("header").getByRole("button").first().click();
  await page.getByRole("button", { name: "Riwayat Tersedia" }).click();
  await expect(page).toHaveURL(/\/dashboard\/riwayat\/RH-201$/);

  await logout(page);

  await login(page, "admin@example.com");
  await page.getByRole("link", { name: "Daftar Sekolah" }).click();
  await page.getByRole("button", { name: "Lihat Detail" }).first().click();
  await expect(page.getByText("Dokumen Sekolah")).toBeVisible();
  await expect(page.getByText("Laporan Literasi.pdf")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Dokumen Sekolah")).not.toBeVisible();

  await page.getByRole("link", { name: "Ringkasan" }).click();
  await page.locator("header").getByRole("button").first().click();
  await page.getByRole("button", { name: "Dokumen Baru" }).click();
  await expect(page).toHaveURL(/\/dashboard-admin\/detail-dokumen\?documentId=DOC-201$/);
  await expect(page.getByRole("heading", { name: "Laporan Literasi.pdf" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unduh" })).toBeVisible();
});

test("school can change password, upload avatar, print reports, and download documents through storage flows", async ({ page, backend }) => {
  backend.reset();

  backend.state.bookings.unshift({
    id: "BK-301",
    school_id: "school-1",
    school_name: "SDN 1 Makale",
    topic: "Pendampingan Literasi",
    category: "Pendampingan",
    date_iso: "2026-03-18",
    session: "08.00 - 11.00 WITA",
    status: "Selesai",
    timeline: [
      { title: "Pengajuan diterima", note: "Booking masuk", time: "08.00 WITA", status: "done" },
      { title: "Verifikasi admin", note: "Admin menyetujui jadwal", time: "08.30 WITA", status: "done" },
      { title: "Sesi pendampingan", note: "Sesi selesai dilaksanakan", time: "09.00 WITA", status: "done" },
      { title: "Unggah laporan", note: "Dokumen sudah lengkap", time: "10.00 WITA", status: "done" },
    ],
    goal: "Penguatan literasi sekolah",
    notes: "Fokus pada praktik membaca pagi.",
    cancel_reason: null,
    rating: null,
    feedback: null,
    supervisor_notes: "Pertahankan dokumentasi praktik baik.",
    created_at: "2026-03-18T08:00:00.000Z",
  });
  backend.state.histories.unshift({
    id: "RH-301",
    school_id: "school-1",
    booking_id: "BK-301",
    date_iso: "2026-03-18",
    school_name: "SDN 1 Makale",
    session: "08.00 - 11.00 WITA",
    title: "Pendampingan Literasi",
    description: "Sesi pendampingan literasi selesai dilaksanakan.",
    status: "Tindak Lanjut",
    follow_up_iso: "2026-03-25",
    supervisor_notes: "Pertahankan dokumentasi praktik baik.",
    follow_up_done: false,
    follow_up_items: [
      { id: "FU-301", text: "Upload laporan hasil sesi", done: false },
    ],
    created_at: "2026-03-18T11:00:00.000Z",
  });
  backend.state.documents.unshift({
    id: "DOC-301",
    school_id: "school-1",
    booking_id: "BK-301",
    history_id: "RH-301",
    file_name: "Laporan Literasi.pdf",
    storage_path: "school-1/laporan-literasi.pdf",
    file_size: 10240,
    mime_type: "application/pdf",
    stage: "Laporan",
    review_status: "Disetujui",
    reviewer_notes: null,
    version: 1,
    parent_doc_id: null,
    uploaded_at: "18 Mar 2026",
    created_at: "2026-03-18T12:00:00.000Z",
  });
  backend.state.documents.unshift({
    id: "DOC-004",
    school_id: "school-1",
    booking_id: null,
    history_id: "RH-301",
    file_name: "Berita Acara Pendampingan.pdf",
    storage_path: "__seed__/DOC-004",
    file_size: 980000,
    mime_type: "application/pdf",
    stage: "Pelaksanaan",
    review_status: "Menunggu Review",
    reviewer_notes: null,
    version: 1,
    parent_doc_id: null,
    uploaded_at: "18 Mar 2026",
    created_at: "2026-03-18T12:05:00.000Z",
  });
  backend.state.storagePaths.push("school-1/laporan-literasi.pdf");

  await login(page, "school@example.com");
  await page.goto("/dashboard/profil");
  await page.getByRole("button", { name: "Ganti Password" }).click();
  await page.getByLabel("Password Saat Ini").fill("password123");
  await page.getByLabel("Password Baru", { exact: true }).fill("password456");
  await page.getByLabel("Konfirmasi Password Baru", { exact: true }).fill("password456");
  await page.getByRole("button", { name: "Simpan Password" }).click();
  await expect(
    page.locator("section").filter({ hasText: "Ganti Password" }).getByText("Password berhasil diubah."),
  ).toBeVisible();

  await page.locator('input[type="file"][accept="image/*"]').setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from("mock avatar"),
  });
  await expect(page.getByAltText("Foto profil SDN 1 Makale")).toBeVisible();

  await logout(page);
  await login(page, "school@example.com", "password456");
  await expect(page).toHaveURL(/\/dashboard\/ringkasan$/);

  await page.goto("/dashboard/riwayat/RH-301");
  const schoolDownloadPopupPromise = page.waitForEvent("popup");
  await page.locator("article", { hasText: "Laporan Literasi.pdf" }).getByRole("button", { name: "Unduh" }).click();
  const schoolDownloadPopup = await schoolDownloadPopupPromise;
  await schoolDownloadPopup.waitForLoadState("domcontentloaded");
  await expect(schoolDownloadPopup).toHaveURL(/\/storage\/v1\/object\/sign\/school-documents\/school-1\/laporan-literasi\.pdf/);

  await page.goto("/dashboard/booking/BK-301");
  const printPopupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Cetak" }).click();
  const printPopup = await printPopupPromise;
  expect(printPopup).toBeTruthy();
  await expect(page.getByText("Popup cetak diblokir browser. Izinkan popup lalu coba lagi.")).toHaveCount(0);

  await logout(page);
  await login(page, "admin@example.com");
  await page.goto("/dashboard-admin/detail-dokumen?documentId=DOC-301");
  const adminDownloadPopupPromise = page.waitForEvent("popup");
  await page.locator("article", { hasText: "Berita Acara Pendampingan.pdf" }).getByRole("button", { name: "Unduh" }).click();
  const adminDownloadPopup = await adminDownloadPopupPromise;
  expect(adminDownloadPopup).toBeTruthy();
  await expect(page.getByText('Dokumen "Berita Acara Pendampingan.pdf" belum memiliki file yang bisa diunduh.')).toHaveCount(0);
});

test("school registration waits for admin approval before login succeeds", async ({ page, backend }) => {
  backend.reset();

  const schoolEmail = "newschool@example.com";
  const schoolPassword = "password123";
  const schoolName = "SMP Negeri Test";

  await page.goto("/daftar-sekolah");
  await page.getByLabel("Nama Sekolah").fill(schoolName);
  await page.getByLabel("NPSN").fill("87654321");
  await page.getByLabel("Nama Penanggung Jawab").fill("Budi");
  await page.getByLabel("Email").fill(schoolEmail);
  await page.getByLabel("No. Telepon").fill("081212121212");
  await page.getByLabel("Alamat Sekolah").fill("Jl. Test No. 2");
  await page.getByLabel("Password", { exact: true }).fill(schoolPassword);
  await page.getByLabel("Konfirmasi Password", { exact: true }).fill(schoolPassword);
  await page.getByRole("button", { name: "Daftar Sekolah" }).click();
  await expect(page.getByText("Registrasi berhasil!")).toBeVisible();
  expect(backend.state.accounts.find((account) => account.email === schoolEmail)?.approval_status).toBe("pending");

  await page.goto("/login?redirectTo=%2Fdashboard%2Fbooking-baru%3Fdate%3D2026-03-24");
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

  await page.goto("/login?redirectTo=%2Fdashboard%2Fbooking-baru%3Fdate%3D2026-03-24");
  await page.getByLabel("Email").fill(schoolEmail);
  await page.getByLabel("Kata Sandi").fill(schoolPassword);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard\/booking-baru\?date=2026-03-24$/);
  await expect(page.getByLabel("Tanggal")).toHaveValue("2026-03-24");
});
