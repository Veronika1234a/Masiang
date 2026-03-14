// ─── Status & Category Types ───

export type BookingStatus = "Menunggu" | "Disetujui" | "Dalam Proses" | "Selesai" | "Ditolak" | "Dibatalkan";
export type TimelineStatus = "done" | "active" | "pending";
export type RiwayatStatus = "Selesai" | "Laporan" | "Tindak Lanjut";
export type RiwayatDocumentCategory = "Laporan" | "Lampiran" | "Administrasi";
export type DocumentStage = "Melayani" | "Adaptif" | "Pelaksanaan" | "Laporan";
export type DocumentReviewStatus = "Menunggu Review" | "Disetujui" | "Perlu Revisi";
export type ServiceCategory =
  | "Workshop"
  | "Training Class"
  | "Seminar"
  | "Pendampingan"
  | "Supervisi"
  | "Konsultasi";

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "Workshop",
  "Training Class",
  "Seminar",
  "Pendampingan",
  "Supervisi",
  "Konsultasi",
];

export type NotificationType =
  | "booking_created"
  | "booking_approved"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_completed"
  | "doc_uploaded"
  | "doc_review"
  | "follow_up_reminder"
  | "stage_advanced";

// ─── Interfaces ───

export interface BookingTimelineItem {
  title: string;
  note: string;
  time: string;
  status: TimelineStatus;
}

export interface BookingItem {
  id: string;
  schoolId?: string;
  school: string;
  topic: string;
  category?: ServiceCategory;
  dateISO: string;
  session: string;
  status: BookingStatus;
  timeline: BookingTimelineItem[];
  goal?: string;
  notes?: string;
  cancelReason?: string;
  rating?: number;
  feedback?: string;
  supervisorNotes?: string;
}

export interface FollowUpItem {
  id: string;
  text: string;
  done: boolean;
}

export interface RiwayatItem {
  id: string;
  schoolId?: string;
  dateISO: string;
  school: string;
  session: string;
  title: string;
  description: string;
  status: RiwayatStatus;
  followUpISO?: string;
  documents: RiwayatDocument[];
  bookingId?: string;
  supervisorNotes?: string;
  followUpDone?: boolean;
  followUpItems?: FollowUpItem[];
}

export interface RiwayatDocument {
  id: string;
  fileName: string;
  category: RiwayatDocumentCategory;
  uploadedAt: string;
}

export interface SchoolDocument {
  id: string;
  schoolId?: string;
  fileName: string;
  uploadedAt: string;
  stage: DocumentStage;
  historyId?: string;
  bookingId?: string;
  fileSize?: number;
  mimeType?: string;
  reviewStatus?: DocumentReviewStatus;
  reviewerNotes?: string;
  version?: number;
  parentDocId?: string;
  storagePath?: string;
}

export interface SchoolProfile {
  schoolName: string;
  npsn: string;
  educationLevel: string;
  address: string;
  officialEmail: string;
  phone: string;
  principalName: string;
  operatorName: string;
  district: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: string;
  referenceType?: "booking" | "document" | "history";
  isRead: boolean;
  createdAt: string;
}

export interface StageProgress {
  currentStage: DocumentStage;
  melayaniPct: number;
  adaptifPct: number;
  pelaksanaanPct: number;
  laporanPct: number;
}

// ─── Required Documents Config ───

export const REQUIRED_DOCUMENTS: Record<DocumentStage, string[]> = {
  Melayani: ["Profil Sekolah", "Surat Pengajuan Pendampingan"],
  Adaptif: ["Analisis Kebutuhan Sekolah", "Rencana Aksi"],
  Pelaksanaan: ["Berita Acara Pendampingan", "Dokumentasi Kegiatan"],
  Laporan: ["Laporan Refleksi Program", "Rekomendasi Tindak Lanjut"],
};

export const ALL_STAGES: DocumentStage[] = ["Melayani", "Adaptif", "Pelaksanaan", "Laporan"];

// ─── Utility Functions ───

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function withDayOffset(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

function parseDateValue(dateValue: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return new Date(`${dateValue}T00:00:00`);
  }

  return new Date(dateValue);
}

export function formatLongDateID(dateISO: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDateValue(dateISO));
}

export function formatMediumDateID(dateISO: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDateValue(dateISO));
}

export function formatShortDateID(dateISO: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseDateValue(dateISO));
}

export function getDateDiffFromToday(dateISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDateValue(dateISO);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / ONE_DAY_IN_MS);
}

export function getBookingReminder(dateISO: string): {
  label: string;
  urgency: "high" | "medium";
} | null {
  const diff = getDateDiffFromToday(dateISO);

  if (diff === 0) {
    return { label: "Hari Ini", urgency: "high" };
  }

  if (diff === 1) {
    return { label: "Besok", urgency: "medium" };
  }

  return null;
}

export function getBookingSummary(bookings: BookingItem[]) {
  return {
    total: bookings.length,
    pending: bookings.filter((item) => item.status === "Menunggu").length,
    approved: bookings.filter((item) => item.status === "Disetujui").length,
    progress: bookings.filter((item) => item.status === "Dalam Proses").length,
    completed: bookings.filter((item) => item.status === "Selesai").length,
    rejected: bookings.filter((item) => item.status === "Ditolak").length,
    cancelled: bookings.filter((item) => item.status === "Dibatalkan").length,
  };
}

export function getNextBooking(bookings: BookingItem[]): BookingItem | null {
  const active = bookings.filter(
    (b) => b.status === "Disetujui" || b.status === "Dalam Proses" || b.status === "Menunggu",
  );
  const sorted = [...active].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  return sorted[0] ?? null;
}

export function getTodayISO(): string {
  return toDateInputValue(new Date());
}

export function getTomorrowISO(): string {
  return withDayOffset(1);
}

let bookingCounter = 6;
export function generateBookingId(): string {
  bookingCounter += 1;
  return `BK-${String(bookingCounter).padStart(3, "0")}`;
}

let docCounter = 10;
export function generateDocId(): string {
  docCounter += 1;
  return `DOC-${String(docCounter).padStart(3, "0")}`;
}

let historyCounter = 5;
export function generateHistoryId(): string {
  historyCounter += 1;
  return `RH-${String(historyCounter).padStart(3, "0")}`;
}

let notifCounter = 10;
export function generateNotifId(): string {
  notifCounter += 1;
  return `NTF-${String(notifCounter).padStart(3, "0")}`;
}

export function getFormattedNow(): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date());
}

export function getFormattedToday(): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

// ─── Seed Data ───

export function getBookingSeed(): BookingItem[] {
  return [
    {
      id: "BK-001",
      school: "UPT SDN 1 Mappak",
      topic: "Pendampingan Kurikulum Operasional",
      category: "Pendampingan",
      dateISO: withDayOffset(0),
      session: "09.00 - 12.00 WITA",
      status: "Dalam Proses",
      goal: "Menyusun kurikulum operasional sekolah sesuai kebijakan terbaru.",
      notes: "Siapkan dokumen kurikulum tahun sebelumnya.",
      timeline: [
        { title: "Pengajuan diterima", note: "Sekolah mengirim permintaan pendampingan", time: "07.30 WITA", status: "done" },
        { title: "Verifikasi admin", note: "Admin memvalidasi kebutuhan dokumen", time: "08.10 WITA", status: "done" },
        { title: "Pendampingan sesi berjalan", note: "Sesi aktif bersama pengawas", time: "09.00 WITA", status: "active" },
        { title: "Unggah laporan", note: "Dokumen hasil sesi diunggah sekolah", time: "Menunggu", status: "pending" },
      ],
    },
    {
      id: "BK-002",
      school: "SMP Negeri 2 Makale",
      topic: "Supervisi Akademik",
      category: "Supervisi",
      dateISO: withDayOffset(1),
      session: "08.30 - 11.30 WITA",
      status: "Disetujui",
      goal: "Melakukan supervisi akademik terhadap guru mata pelajaran.",
      notes: "Koordinasi dengan wakil kepala sekolah bidang kurikulum.",
      timeline: [
        { title: "Pengajuan diterima", note: "Data sekolah sudah lengkap", time: "Kemarin", status: "done" },
        { title: "Verifikasi admin", note: "Pendamping ditetapkan", time: "Kemarin", status: "done" },
        { title: "Sesi pendampingan", note: "Dijadwalkan besok pagi", time: "Besok, 08.30 WITA", status: "active" },
        { title: "Unggah laporan", note: "Dibuka setelah sesi selesai", time: "Belum tersedia", status: "pending" },
      ],
    },
    {
      id: "BK-003",
      school: "SMK Negeri 1 Rantepao",
      topic: "Monitoring Implementasi Projek",
      category: "Workshop",
      dateISO: withDayOffset(5),
      session: "10.00 - 13.00 WITA",
      status: "Menunggu",
      goal: "Memantau progres implementasi projek P5 di sekolah.",
      timeline: [
        { title: "Pengajuan diterima", note: "Pengajuan baru masuk", time: "Hari ini", status: "done" },
        { title: "Verifikasi admin", note: "Menunggu verifikasi data", time: "Dalam antrean", status: "active" },
        { title: "Sesi pendampingan", note: "Menunggu persetujuan jadwal", time: "Belum dijadwalkan", status: "pending" },
        { title: "Unggah laporan", note: "Dibuka setelah sesi berjalan", time: "Belum tersedia", status: "pending" },
      ],
    },
    {
      id: "BK-004",
      school: "UPT SDN 1 Mappak",
      topic: "Evaluasi Program Literasi Sekolah",
      category: "Training Class",
      dateISO: withDayOffset(-10),
      session: "08.00 - 11.00 WITA",
      status: "Selesai",
      goal: "Mengevaluasi efektivitas program literasi di sekolah.",
      rating: 5,
      feedback: "Sesi sangat membantu, pengawas memberikan rekomendasi yang actionable.",
      supervisorNotes: "Sekolah menunjukkan progres literasi yang baik. Perlu peningkatan di area menulis kreatif.",
      timeline: [
        { title: "Pengajuan diterima", note: "Data lengkap", time: "2 minggu lalu", status: "done" },
        { title: "Verifikasi admin", note: "Diverifikasi", time: "2 minggu lalu", status: "done" },
        { title: "Sesi pendampingan", note: "Sesi selesai dilaksanakan", time: "10 hari lalu", status: "done" },
        { title: "Unggah laporan", note: "Laporan sudah diunggah", time: "9 hari lalu", status: "done" },
      ],
    },
    {
      id: "BK-005",
      school: "SMP Negeri 2 Makale",
      topic: "Pelatihan Penilaian Formatif",
      category: "Seminar",
      dateISO: withDayOffset(-15),
      session: "13.00 - 16.00 WITA",
      status: "Ditolak",
      cancelReason: "Jadwal bentrok dengan kegiatan dinas. Silakan ajukan ulang untuk minggu berikutnya.",
      timeline: [
        { title: "Pengajuan diterima", note: "Data diterima", time: "3 minggu lalu", status: "done" },
        { title: "Verifikasi admin", note: "Ditolak — jadwal tidak tersedia", time: "3 minggu lalu", status: "done" },
        { title: "Sesi pendampingan", note: "Dibatalkan", time: "—", status: "pending" },
        { title: "Unggah laporan", note: "—", time: "—", status: "pending" },
      ],
    },
  ];
}

export function getRiwayatSeed(): RiwayatItem[] {
  return [
    {
      id: "RH-001",
      dateISO: withDayOffset(-6),
      school: "UPT SDN 1 Mappak",
      session: "09.00 - 12.00 WITA",
      title: "Pendampingan Kurikulum Operasional Sekolah",
      description: "Dokumen asesmen awal, rencana tindak lanjut, dan berita acara telah diunggah.",
      status: "Selesai",
      followUpISO: withDayOffset(1),
      bookingId: "BK-004",
      supervisorNotes: "Sekolah menunjukkan progres yang baik dalam penyusunan kurikulum. Perlu follow-up terkait implementasi modul ajar.",
      followUpDone: false,
      followUpItems: [
        { id: "FU-001", text: "Finalisasi modul ajar kelas 4-6", done: true },
        { id: "FU-002", text: "Koordinasi dengan guru mapel untuk jadwal implementasi", done: false },
        { id: "FU-003", text: "Siapkan instrumen evaluasi kurikulum", done: false },
      ],
      documents: [
        { id: "DOC-RH-001-1", fileName: "Asesmen Awal Kurikulum.pdf", category: "Laporan", uploadedAt: "28 Februari 2026, 10.41 WITA" },
        { id: "DOC-RH-001-2", fileName: "Rencana Tindak Lanjut.docx", category: "Administrasi", uploadedAt: "28 Februari 2026, 10.45 WITA" },
        { id: "DOC-RH-001-3", fileName: "Berita Acara Pendampingan.pdf", category: "Lampiran", uploadedAt: "28 Februari 2026, 10.49 WITA" },
      ],
    },
    {
      id: "RH-002",
      dateISO: withDayOffset(-12),
      school: "SMP Negeri 2 Makale",
      session: "08.30 - 11.30 WITA",
      title: "Monitoring Implementasi Projek Penguatan Profil Pelajar Pancasila",
      description: "Rekaman aktivitas kelas dan laporan refleksi guru tersimpan pada sistem.",
      status: "Laporan",
      followUpISO: withDayOffset(0),
      supervisorNotes: "Projek P5 berjalan sesuai rencana. Dokumentasi perlu diperkuat.",
      followUpDone: false,
      followUpItems: [
        { id: "FU-004", text: "Lengkapi dokumentasi foto kegiatan projek", done: false },
        { id: "FU-005", text: "Upload laporan refleksi guru", done: true },
      ],
      documents: [
        { id: "DOC-RH-002-1", fileName: "Laporan Monitoring Projek.pdf", category: "Laporan", uploadedAt: "22 Februari 2026, 13.12 WITA" },
        { id: "DOC-RH-002-2", fileName: "Dokumentasi Kegiatan.zip", category: "Lampiran", uploadedAt: "22 Februari 2026, 13.18 WITA" },
      ],
    },
    {
      id: "RH-003",
      dateISO: withDayOffset(-20),
      school: "SMK Negeri 1 Rantepao",
      session: "10.00 - 13.00 WITA",
      title: "Pendampingan Supervisi Akademik",
      description: "Penilaian observasi pembelajaran dan rekomendasi pembinaan tersedia.",
      status: "Tindak Lanjut",
      bookingId: "BK-003",
      supervisorNotes: "Guru-guru memerlukan pelatihan tambahan di bidang asesmen diagnostik.",
      followUpDone: false,
      followUpItems: [
        { id: "FU-006", text: "Jadwalkan pelatihan asesmen diagnostik", done: false },
        { id: "FU-007", text: "Susun instrumen supervisi lanjutan", done: false },
        { id: "FU-008", text: "Kirim laporan hasil observasi ke dinas", done: true },
      ],
      documents: [
        { id: "DOC-RH-003-1", fileName: "Instrumen Observasi Pembelajaran.xlsx", category: "Administrasi", uploadedAt: "14 Februari 2026, 15.05 WITA" },
        { id: "DOC-RH-003-2", fileName: "Rekomendasi Pembinaan Guru.pdf", category: "Laporan", uploadedAt: "14 Februari 2026, 15.11 WITA" },
      ],
    },
  ];
}

export function getUserDocumentSeed(): SchoolDocument[] {
  return [
    {
      id: "DOC-001",
      fileName: "Profil Sekolah UPT SDN 1 Mappak.pdf",
      uploadedAt: "1 Maret 2026",
      stage: "Melayani",
      mimeType: "application/pdf",
      fileSize: 2_450_000,
      reviewStatus: "Disetujui",
      version: 1,
    },
    {
      id: "DOC-002",
      fileName: "Surat Pengajuan Pendampingan.docx",
      uploadedAt: "27 Februari 2026",
      stage: "Melayani",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 540_000,
      reviewStatus: "Disetujui",
      version: 1,
    },
    {
      id: "DOC-003",
      fileName: "Analisis Kebutuhan Sekolah.pdf",
      uploadedAt: "24 Februari 2026",
      stage: "Adaptif",
      mimeType: "application/pdf",
      fileSize: 1_800_000,
      reviewStatus: "Disetujui",
      version: 1,
    },
    {
      id: "DOC-004",
      fileName: "Berita Acara Pendampingan.pdf",
      uploadedAt: "18 Februari 2026",
      stage: "Pelaksanaan",
      historyId: "RH-001",
      mimeType: "application/pdf",
      fileSize: 980_000,
      reviewStatus: "Menunggu Review",
      version: 1,
    },
    {
      id: "DOC-005",
      fileName: "Laporan Refleksi Program.pdf",
      uploadedAt: "14 Februari 2026",
      stage: "Laporan",
      historyId: "RH-002",
      mimeType: "application/pdf",
      fileSize: 3_200_000,
      reviewStatus: "Perlu Revisi",
      reviewerNotes: "Bagian analisis dampak program perlu diperdalam. Tambahkan data kuantitatif dari hasil asesmen siswa.",
      version: 1,
    },
  ];
}

export function getSchoolProfile(): SchoolProfile {
  return {
    schoolName: "UPT SDN 1 Mappak",
    npsn: "10265538",
    educationLevel: "Sekolah Dasar",
    address: "Jl. Raya Mappak No. 123, Tana Toraja",
    officialEmail: "sdn1mappak@gmail.com",
    phone: "(0423) 123456",
    principalName: "Dra. Siti Rahmawati",
    operatorName: "Andi Saputra",
    district: "Tana Toraja",
  };
}

export function getNotificationSeed(): Notification[] {
  return [
    {
      id: "NTF-001",
      title: "Booking Disetujui",
      message: "Booking BK-002 (Supervisi Akademik) telah disetujui untuk besok.",
      type: "booking_approved",
      referenceId: "BK-002",
      referenceType: "booking",
      isRead: false,
      createdAt: withDayOffset(0),
    },
    {
      id: "NTF-002",
      title: "Dokumen Perlu Revisi",
      message: "Dokumen 'Laporan Refleksi Program.pdf' perlu direvisi. Lihat catatan pengawas.",
      type: "doc_review",
      referenceId: "DOC-005",
      referenceType: "document",
      isRead: false,
      createdAt: withDayOffset(-1),
    },
    {
      id: "NTF-003",
      title: "Tindak Lanjut Besok",
      message: "Tindak lanjut untuk RH-001 jatuh tempo besok. Pastikan semua item sudah diselesaikan.",
      type: "follow_up_reminder",
      referenceId: "RH-001",
      referenceType: "history",
      isRead: false,
      createdAt: withDayOffset(-1),
    },
    {
      id: "NTF-004",
      title: "Booking Ditolak",
      message: "Booking BK-005 (Pelatihan Penilaian Formatif) ditolak. Jadwal bentrok dengan kegiatan dinas.",
      type: "booking_rejected",
      referenceId: "BK-005",
      referenceType: "booking",
      isRead: true,
      createdAt: withDayOffset(-15),
    },
    {
      id: "NTF-005",
      title: "Sesi Selesai",
      message: "Booking BK-004 (Evaluasi Program Literasi) telah selesai. Berikan rating dan feedback.",
      type: "booking_completed",
      referenceId: "BK-004",
      referenceType: "booking",
      isRead: true,
      createdAt: withDayOffset(-10),
    },
  ];
}
