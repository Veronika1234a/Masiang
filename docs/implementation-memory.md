# MASIANG Implementation Memory

Terakhir diperbarui: 15 April 2026

## Ringkasan Status
Project saat ini sudah memiliki:
- Landing page marketing
- Halaman login dan registrasi sekolah berbasis Supabase + verifikasi operator
- User dashboard (ringkasan, booking, dokumen, riwayat, profil)
- Admin dashboard (ringkasan dashboard, semua dokumen, detail dokumen)
- Shared UI components untuk konsistensi visual

## Route yang Sudah Diimplementasi
- `/`
- `/login`
- `/daftar-sekolah`
- `/dashboard` (redirect ke `/dashboard/ringkasan`)
- `/dashboard/ringkasan`
- `/dashboard/booking`
- `/dashboard/booking-baru`
- `/dashboard/booking-jadwal`
- `/dashboard/booking/[bookingId]`
- `/dashboard/dokumen`
- `/dashboard/profil`
- `/dashboard/riwayat`
- `/dashboard/riwayat/[historyId]`
- `/dashboard-admin`
- `/dashboard-admin/semua-dokumen`
- `/dashboard-admin/detail-dokumen`

## Komponen Utama yang Sudah Ada
- `src/components/ui/Button.tsx`
- `src/components/layout/MarketingHeader.tsx`
- `src/components/layout/MarketingFooter.tsx`
- `src/components/dashboard/DashboardShell.tsx`

## Yang Sudah Diimplementasi (Detail)
1. Landing Page
- Hero section, layanan/tahapan, tentang pengawas, CTA, dan footer.
- Header responsif dengan mobile menu.

2. Login & Registrasi
- Form state management client-side.
- Validasi input (required, format email, panjang minimal, format nomor).
- Registrasi memakai `/api/register-school`, membuat akun Supabase dan profil sekolah berstatus `pending`.
- Login memakai `/api/auth/login`, memblokir akun sekolah `pending`/`rejected`, dan hanya mengizinkan sekolah `approved`.

3. User Dashboard
- Sidebar + topbar layout reusable.
- Halaman ringkasan dengan KPI cards, status tahapan pendampingan, dan booking selanjutnya.
- Halaman booking dengan:
  - Filter + search (status, tanggal, kata kunci).
  - Reminder jadwal (badge Hari Ini/Besok).
  - Inline selected booking panel, bukan modal overlay.
  - State loading, empty, dan error yang konsisten.
- Halaman booking jadwal (`/dashboard/booking-jadwal`) dengan:
  - Panel tahapan pendampingan.
  - Kalender bulanan (prev/next month).
  - Filter status event.
  - Panel detail jadwal yang muncul relatif terhadap item kalender yang diklik.
- Halaman booking baru (`/dashboard/booking-baru`) untuk pengajuan sesi pendampingan.
- Halaman detail booking (`/dashboard/booking/[bookingId]`) dengan metadata sesi, timeline aktivitas, dan dokumen terkait.
- Halaman riwayat dengan:
  - Filter + search (status, tanggal, kata kunci).
  - Reminder follow-up (Hari Ini/Besok) pada item terkait.
  - State loading, empty, dan error yang konsisten.
  - Tampilan kartu yang konsisten dengan Booking dan Ringkasan.
- Halaman dokumen (`/dashboard/dokumen`) dengan:
  - Filter tahap dan pencarian dokumen.
  - Upload dokumen/foto/video/link ke Supabase Storage dan tabel `documents`.
  - Tautan langsung ke arsip riwayat bila dokumen terhubung dengan sesi lama.
- Halaman profil (`/dashboard/profil`) dengan:
  - Ringkasan identitas sekolah.
  - Edit profil, update foto profil, update email aman, dan ganti password via Supabase.
  - Statistik booking, riwayat, dan dokumen dalam panel samping.
- Halaman detail riwayat/dokumen user (`/dashboard/riwayat/[historyId]`) untuk melihat arsip dokumen sesi tanpa masuk ke dashboard admin.
- Mayoritas halaman user dashboard kini memakai Tailwind utility classes untuk menjaga konsistensi visual baru.
- `ringkasan`, `booking`, `booking-jadwal`, dan `booking/[bookingId]` sekarang berbagi sumber data booking yang sama dari `src/lib/userDashboardData.ts`.

4. Admin Dashboard
- Ringkasan admin (KPI + booking masuk).
- Semua dokumen (daftar dokumen dari Supabase).
- Detail dokumen (review, signed URL download, dan link dokumen).
- Verifikasi akun sekolah pending/approved/rejected pada halaman sekolah.

5. Typography Pass
- Proporsi font dashboard user/admin sudah disesuaikan ulang agar lebih seimbang.
- Heading, body, label, dan table typography sudah diturunkan dari versi awal yang terlalu besar.

## Style System / Tech
- Framework: Next.js App Router (React + TypeScript)
- Styling: CSS Modules
- Font: Plus Jakarta Sans + Fraunces
- Assets: Lokal pada `public/assets/masiang`

## Keterbatasan Saat Ini
- Browser print report masih basic dan belum menjadi export PDF resmi.
- Real Supabase validation tetap wajib setelah perubahan migrasi/env/auth.
- Production readiness bergantung pada Vercel env dan Supabase migration yang sinkron.

## Backlog Prioritas (Next)
1. Operasional production
- Pastikan migrasi Supabase, RLS, storage policy, dan Vercel env selalu sinkron sebelum deploy.
- Jalankan UAT production untuk register -> approval -> login, booking, dokumen, riwayat, dan admin review.

2. Laporan resmi
- Ganti browser print report dengan export PDF/report resmi jika dibutuhkan client.

3. Improvement UX User Dashboard
- Pagination/infinite load untuk list panjang.
- Notifikasi reminder lintas halaman (misalnya di topbar).
- Integrasi reminder ke data backend real-time.
- Samakan `DashboardShell` ke style system Tailwind agar shell dan page content satu bahasa visual.

4. Quality & Operasional
- Test coverage (form validation, route guard, data table interaction).
- Observability (error logging, event analytics).
- A11y audit (keyboard flow, screen reader labels, contrast pass).

## Catatan Kolaborasi Figma
- Implementasi dashboard dimulai dari konteks node Figma yang berhasil diambil.
- Sisa node Figma tidak semuanya bisa diambil saat sesi sebelumnya karena limit plan MCP.
- Struktur halaman sudah disiapkan agar mudah dipresisikan lagi ketika kuota MCP tersedia.
