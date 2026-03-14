-- ============================================================
-- MASIANG Site – Seed Data
-- Run this AFTER schema.sql in the Supabase SQL Editor.
--
-- IMPORTANT: Before running this script, you must create
-- the two auth users via the Supabase Dashboard or API:
--
--   1. Admin user:
--      Email: admin@masiang.id
--      Password: admin123
--      User metadata: { "role": "admin" }
--
--   2. School user:
--      Email: sdn1mappak@gmail.com
--      Password: sekolah123
--      User metadata: {
--        "role": "school",
--        "school_name": "UPT SDN 1 Mappak",
--        "npsn": "10265538",
--        "contact_name": "Andi Saputra",
--        "phone": "(0423) 123456",
--        "address": "Jl. Raya Mappak No. 123, Tana Toraja"
--      }
--
-- The trigger `on_auth_user_created` will auto-create rows
-- in the `profiles` table. After that, run the UPDATE below
-- to fill in the extra profile fields.
--
-- Then replace the placeholder UUIDs below with the actual
-- auth.users.id values from your Supabase project.
-- ============================================================

-- ===========================================
-- Step 1: SET THESE TO YOUR ACTUAL USER IDs
-- ===========================================
-- After creating users in Supabase Auth, get their UUIDs from
-- Authentication > Users in the Supabase Dashboard.
--
-- Usage: Find-and-replace in this file:
--   ADMIN_UUID  -> your admin user's UUID
--   SCHOOL_UUID -> your school user's UUID

-- ===========================================
-- Step 2: Update profile details
-- ===========================================

UPDATE public.profiles SET
  school_name = 'Admin MASIANG',
  role = 'admin'
WHERE email = 'admin@masiang.id';

UPDATE public.profiles SET
  school_name = 'UPT SDN 1 Mappak',
  npsn = '10265538',
  contact_name = 'Andi Saputra',
  phone = '(0423) 123456',
  address = 'Jl. Raya Mappak No. 123, Tana Toraja',
  education_level = 'Sekolah Dasar',
  principal_name = 'Dra. Siti Rahmawati',
  operator_name = 'Andi Saputra',
  district = 'Tana Toraja'
WHERE email = 'sdn1mappak@gmail.com';

-- ===========================================
-- Step 3: Seed bookings
-- ===========================================
-- Replace SCHOOL_UUID with the actual UUID of the school user.

INSERT INTO public.bookings (id, school_id, school_name, topic, category, date_iso, session, status, timeline, goal, notes, supervisor_notes, rating, feedback, cancel_reason)
VALUES
  (
    'BK-001',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'UPT SDN 1 Mappak',
    'Pendampingan Kurikulum Operasional',
    'Pendampingan',
    CURRENT_DATE,
    '09.00 - 12.00 WITA',
    'Dalam Proses',
    '[
      {"title":"Pengajuan diterima","note":"Sekolah mengirim permintaan pendampingan","time":"07.30 WITA","status":"done"},
      {"title":"Verifikasi admin","note":"Admin memvalidasi kebutuhan dokumen","time":"08.10 WITA","status":"done"},
      {"title":"Pendampingan sesi berjalan","note":"Sesi aktif bersama pengawas","time":"09.00 WITA","status":"active"},
      {"title":"Unggah laporan","note":"Dokumen hasil sesi diunggah sekolah","time":"Menunggu","status":"pending"}
    ]'::jsonb,
    'Menyusun kurikulum operasional sekolah sesuai kebijakan terbaru.',
    'Siapkan dokumen kurikulum tahun sebelumnya.',
    NULL, NULL, NULL, NULL
  ),
  (
    'BK-002',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'SMP Negeri 2 Makale',
    'Supervisi Akademik',
    'Supervisi',
    CURRENT_DATE + INTERVAL '1 day',
    '08.30 - 11.30 WITA',
    'Disetujui',
    '[
      {"title":"Pengajuan diterima","note":"Data sekolah sudah lengkap","time":"Kemarin","status":"done"},
      {"title":"Verifikasi admin","note":"Pendamping ditetapkan","time":"Kemarin","status":"done"},
      {"title":"Sesi pendampingan","note":"Dijadwalkan besok pagi","time":"Besok, 08.30 WITA","status":"active"},
      {"title":"Unggah laporan","note":"Dibuka setelah sesi selesai","time":"Belum tersedia","status":"pending"}
    ]'::jsonb,
    'Melakukan supervisi akademik terhadap guru mata pelajaran.',
    'Koordinasi dengan wakil kepala sekolah bidang kurikulum.',
    NULL, NULL, NULL, NULL
  ),
  (
    'BK-003',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'SMK Negeri 1 Rantepao',
    'Monitoring Implementasi Projek',
    'Workshop',
    CURRENT_DATE + INTERVAL '5 days',
    '10.00 - 13.00 WITA',
    'Menunggu',
    '[
      {"title":"Pengajuan diterima","note":"Pengajuan baru masuk","time":"Hari ini","status":"done"},
      {"title":"Verifikasi admin","note":"Menunggu verifikasi data","time":"Dalam antrean","status":"active"},
      {"title":"Sesi pendampingan","note":"Menunggu persetujuan jadwal","time":"Belum dijadwalkan","status":"pending"},
      {"title":"Unggah laporan","note":"Dibuka setelah sesi berjalan","time":"Belum tersedia","status":"pending"}
    ]'::jsonb,
    'Memantau progres implementasi projek P5 di sekolah.',
    NULL, NULL, NULL, NULL, NULL
  ),
  (
    'BK-004',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'UPT SDN 1 Mappak',
    'Evaluasi Program Literasi Sekolah',
    'Training Class',
    CURRENT_DATE - INTERVAL '10 days',
    '08.00 - 11.00 WITA',
    'Selesai',
    '[
      {"title":"Pengajuan diterima","note":"Data lengkap","time":"2 minggu lalu","status":"done"},
      {"title":"Verifikasi admin","note":"Diverifikasi","time":"2 minggu lalu","status":"done"},
      {"title":"Sesi pendampingan","note":"Sesi selesai dilaksanakan","time":"10 hari lalu","status":"done"},
      {"title":"Unggah laporan","note":"Laporan sudah diunggah","time":"9 hari lalu","status":"done"}
    ]'::jsonb,
    'Mengevaluasi efektivitas program literasi di sekolah.',
    NULL,
    'Sekolah menunjukkan progres literasi yang baik. Perlu peningkatan di area menulis kreatif.',
    5,
    'Sesi sangat membantu, pengawas memberikan rekomendasi yang actionable.',
    NULL
  ),
  (
    'BK-005',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'SMP Negeri 2 Makale',
    'Pelatihan Penilaian Formatif',
    'Seminar',
    CURRENT_DATE - INTERVAL '15 days',
    '13.00 - 16.00 WITA',
    'Ditolak',
    '[
      {"title":"Pengajuan diterima","note":"Data diterima","time":"3 minggu lalu","status":"done"},
      {"title":"Verifikasi admin","note":"Ditolak — jadwal tidak tersedia","time":"3 minggu lalu","status":"done"},
      {"title":"Sesi pendampingan","note":"Dibatalkan","time":"—","status":"pending"},
      {"title":"Unggah laporan","note":"—","time":"—","status":"pending"}
    ]'::jsonb,
    NULL, NULL, NULL, NULL, NULL,
    'Jadwal bentrok dengan kegiatan dinas. Silakan ajukan ulang untuk minggu berikutnya.'
  );

-- ===========================================
-- Step 4: Seed histories (riwayat)
-- ===========================================

INSERT INTO public.histories (id, school_id, booking_id, date_iso, school_name, session, title, description, status, follow_up_iso, supervisor_notes, follow_up_done, follow_up_items)
VALUES
  (
    'RH-001',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'BK-004',
    CURRENT_DATE - INTERVAL '6 days',
    'UPT SDN 1 Mappak',
    '09.00 - 12.00 WITA',
    'Pendampingan Kurikulum Operasional Sekolah',
    'Dokumen asesmen awal, rencana tindak lanjut, dan berita acara telah diunggah.',
    'Selesai',
    CURRENT_DATE + INTERVAL '1 day',
    'Sekolah menunjukkan progres yang baik dalam penyusunan kurikulum. Perlu follow-up terkait implementasi modul ajar.',
    false,
    '[
      {"id":"FU-001","text":"Finalisasi modul ajar kelas 4-6","done":true},
      {"id":"FU-002","text":"Koordinasi dengan guru mapel untuk jadwal implementasi","done":false},
      {"id":"FU-003","text":"Siapkan instrumen evaluasi kurikulum","done":false}
    ]'::jsonb
  ),
  (
    'RH-002',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    NULL,
    CURRENT_DATE - INTERVAL '12 days',
    'SMP Negeri 2 Makale',
    '08.30 - 11.30 WITA',
    'Monitoring Implementasi Projek Penguatan Profil Pelajar Pancasila',
    'Rekaman aktivitas kelas dan laporan refleksi guru tersimpan pada sistem.',
    'Laporan',
    CURRENT_DATE,
    'Projek P5 berjalan sesuai rencana. Dokumentasi perlu diperkuat.',
    false,
    '[
      {"id":"FU-004","text":"Lengkapi dokumentasi foto kegiatan projek","done":false},
      {"id":"FU-005","text":"Upload laporan refleksi guru","done":true}
    ]'::jsonb
  ),
  (
    'RH-003',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'BK-003',
    CURRENT_DATE - INTERVAL '20 days',
    'SMK Negeri 1 Rantepao',
    '10.00 - 13.00 WITA',
    'Pendampingan Supervisi Akademik',
    'Penilaian observasi pembelajaran dan rekomendasi pembinaan tersedia.',
    'Tindak Lanjut',
    NULL,
    'Guru-guru memerlukan pelatihan tambahan di bidang asesmen diagnostik.',
    false,
    '[
      {"id":"FU-006","text":"Jadwalkan pelatihan asesmen diagnostik","done":false},
      {"id":"FU-007","text":"Susun instrumen supervisi lanjutan","done":false},
      {"id":"FU-008","text":"Kirim laporan hasil observasi ke dinas","done":true}
    ]'::jsonb
  );

-- ===========================================
-- Step 5: Seed documents
-- ===========================================

INSERT INTO public.documents (id, school_id, booking_id, history_id, file_name, storage_path, file_size, mime_type, stage, review_status, reviewer_notes, version, uploaded_at)
VALUES
  (
    'DOC-001',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    NULL, NULL,
    'Profil Sekolah UPT SDN 1 Mappak.pdf',
    NULL,
    2450000,
    'application/pdf',
    'Melayani',
    'Disetujui',
    NULL,
    1,
    '1 Maret 2026'
  ),
  (
    'DOC-002',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    NULL, NULL,
    'Surat Pengajuan Pendampingan.docx',
    NULL,
    540000,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Melayani',
    'Disetujui',
    NULL,
    1,
    '27 Februari 2026'
  ),
  (
    'DOC-003',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    NULL, NULL,
    'Analisis Kebutuhan Sekolah.pdf',
    NULL,
    1800000,
    'application/pdf',
    'Adaptif',
    'Disetujui',
    NULL,
    1,
    '24 Februari 2026'
  ),
  (
    'DOC-004',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    NULL, 'RH-001',
    'Berita Acara Pendampingan.pdf',
    NULL,
    980000,
    'application/pdf',
    'Pelaksanaan',
    'Menunggu Review',
    NULL,
    1,
    '18 Februari 2026'
  ),
  (
    'DOC-005',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    NULL, 'RH-002',
    'Laporan Refleksi Program.pdf',
    NULL,
    3200000,
    'application/pdf',
    'Laporan',
    'Perlu Revisi',
    'Bagian analisis dampak program perlu diperdalam. Tambahkan data kuantitatif dari hasil asesmen siswa.',
    1,
    '14 Februari 2026'
  );

-- ===========================================
-- Step 6: Seed notifications
-- ===========================================

INSERT INTO public.notifications (id, user_id, title, message, type, reference_id, reference_type, is_read, created_at)
VALUES
  (
    'NTF-001',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'Booking Disetujui',
    'Booking BK-002 (Supervisi Akademik) telah disetujui untuk besok.',
    'booking_approved',
    'BK-002',
    'booking',
    false,
    now()
  ),
  (
    'NTF-002',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'Dokumen Perlu Revisi',
    'Dokumen ''Laporan Refleksi Program.pdf'' perlu direvisi. Lihat catatan pengawas.',
    'doc_review',
    'DOC-005',
    'document',
    false,
    now() - INTERVAL '1 day'
  ),
  (
    'NTF-003',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'Tindak Lanjut Besok',
    'Tindak lanjut untuk RH-001 jatuh tempo besok. Pastikan semua item sudah diselesaikan.',
    'follow_up_reminder',
    'RH-001',
    'history',
    false,
    now() - INTERVAL '1 day'
  ),
  (
    'NTF-004',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'Booking Ditolak',
    'Booking BK-005 (Pelatihan Penilaian Formatif) ditolak. Jadwal bentrok dengan kegiatan dinas.',
    'booking_rejected',
    'BK-005',
    'booking',
    true,
    now() - INTERVAL '15 days'
  ),
  (
    'NTF-005',
    (SELECT id FROM public.profiles WHERE email = 'sdn1mappak@gmail.com'),
    'Sesi Selesai',
    'Booking BK-004 (Evaluasi Program Literasi) telah selesai. Berikan rating dan feedback.',
    'booking_completed',
    'BK-004',
    'booking',
    true,
    now() - INTERVAL '10 days'
  );

-- ===========================================
-- Step 7: Reset sequences past seeded IDs
-- ===========================================
SELECT setval('public.booking_id_seq', 10);
SELECT setval('public.doc_id_seq', 10);
SELECT setval('public.history_id_seq', 10);
SELECT setval('public.notif_id_seq', 10);
