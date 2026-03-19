# QA / UAT Checklist

Gunakan checklist ini saat testing manual sebelum aplikasi dipakai client. Fokusnya adalah flow sekolah, flow admin, dan boundary auth yang paling berisiko.

## Sekolah

- Login dengan akun sekolah berhasil dan masuk ke `/dashboard/ringkasan`.
- Redirect login tetap benar saat masuk dari route terlindungi seperti `/dashboard/booking-baru?date=...`.
- Buat booking baru dengan data valid lalu pastikan booking muncul di daftar booking.
- Batalkan booking berstatus `Menunggu` atau `Disetujui`, lalu cek status berubah ke `Dibatalkan`.
- Buka detail booking, pastikan catatan pengawas tampil bila admin sudah menyimpan catatan.
- Upload dokumen per tahap, lalu cek file muncul di halaman dokumen.
- Upload revisi untuk dokumen `Perlu Revisi`, lalu cek file versi baru tampil.
- Hapus dokumen, lalu cek file hilang dari daftar.
- Buka riwayat, tandai checklist follow-up, lalu cek status tersimpan setelah refresh.
- Kirim rating dan feedback setelah sesi selesai, lalu cek data tetap ada setelah refresh.
- Edit profil sekolah, simpan, lalu cek data baru tetap tampil setelah reload.
- Buka notifikasi sekolah dan klik salah satu item, lalu pastikan diarahkan ke halaman terkait.

## Admin

- Login dengan akun admin berhasil dan masuk ke `/dashboard-admin`.
- Booking baru dari sekolah muncul di dashboard admin atau halaman booking admin.
- Admin bisa menyetujui booking, memulai sesi, menyimpan catatan, dan menyelesaikan sesi.
- Dokumen baru dari sekolah muncul di halaman dokumen admin.
- Admin bisa meminta revisi dokumen dan sekolah menerima efeknya di sisi user.
- Admin bisa menyetujui dokumen revisi.
- Halaman daftar sekolah menampilkan data sekolah, statistik, dan dokumen terkait.
- Klik notifikasi admin mengarahkan ke booking atau detail dokumen yang benar.
- Tombol `Tandai semua dibaca` menghapus badge unread setelah notifikasi ditandai dibaca.

## Auth Boundary

- User yang belum login diarahkan ke `/login` saat membuka route `/dashboard/*`.
- User sekolah yang membuka `/dashboard-admin` diarahkan kembali ke dashboard sekolah.
- User admin yang membuka `/dashboard/*` diarahkan kembali ke dashboard admin.
- Logout dari sekolah dan admin selalu kembali ke halaman login.

## Data Integrity

- Dua sekolah tidak bisa booking slot aktif yang sama pada tanggal dan sesi yang sama.
- Satu booking selesai hanya menghasilkan satu riwayat.
- Dokumen yang terhubung ke `historyId` tetap muncul di arsip sesi dan detail sekolah admin.
- Notifikasi lintas role muncul sesuai event bisnis yang diharapkan.

## Regression Commands

Jalankan verifikasi lokal berikut sebelum demo atau release:

```bash
npm run lint
npm run test
npm run test:e2e
```

## Real Supabase Validation (Staging)

Gunakan suite ini untuk verifikasi langsung ke Supabase nyata (bukan mock):

```bash
REAL_SUPABASE_TEST_MODE=1 npm run test:real-supabase
```

PowerShell:

```powershell
$env:REAL_SUPABASE_TEST_MODE="1"; npm run test:real-supabase
```

Environment variable yang wajib tersedia:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_TEST_SCHOOL_EMAIL`
- `SUPABASE_TEST_SCHOOL_PASSWORD`
- `SUPABASE_TEST_ADMIN_EMAIL`
- `SUPABASE_TEST_ADMIN_PASSWORD`

Suite ini memvalidasi:

- RLS sekolah vs admin pada tabel `bookings`.
- Trigger notifikasi `booking_created`, `booking_cancelled`, dan `doc_uploaded`.
- Signed URL storage (`school-documents`) untuk owner, admin, dan cross-school deny.
- Konflik race booking slot aktif (satu insert sukses, satu gagal unique constraint).
- Session longevity: refresh token + invalidasi session multi-tab setelah global logout.

## Remaining Risk

- E2E saat ini memakai mock backend, jadi staging dengan Supabase nyata tetap wajib diuji.
- Trigger, RLS, signed URL storage, dan perilaku concurrency perlu divalidasi di environment nyata.
