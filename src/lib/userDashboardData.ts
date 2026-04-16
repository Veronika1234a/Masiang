// Status and category types

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

export const BOOKING_SESSION_OPTIONS = [
  "08.00 - 11.00 WITA",
  "08.30 - 11.30 WITA",
  "09.00 - 12.00 WITA",
  "10.00 - 13.00 WITA",
  "13.00 - 16.00 WITA",
] as const;

export type BookingSessionOption = (typeof BOOKING_SESSION_OPTIONS)[number];

export type NotificationType =
  | "booking_created"
  | "booking_approved"
  | "booking_started"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_completed"
  | "doc_uploaded"
  | "doc_review"
  | "follow_up_reminder"
  | "stage_advanced";

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
  contactName: string;
  educationLevel: string;
  address: string;
  officialEmail: string;
  phone: string;
  principalName: string;
  operatorName: string;
  district: string;
  avatarPath?: string;
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

export const REQUIRED_DOCUMENTS: Record<DocumentStage, string[]> = {
  Melayani: ["Profil Sekolah", "Surat Pengajuan Pendampingan"],
  Adaptif: ["Analisis Kebutuhan Sekolah", "Rencana Aksi"],
  Pelaksanaan: ["Berita Acara Pendampingan", "Dokumentasi Kegiatan"],
  Laporan: ["Laporan Refleksi Program", "Rekomendasi Tindak Lanjut"],
};

export const ALL_STAGES: DocumentStage[] = ["Melayani", "Adaptif", "Pelaksanaan", "Laporan"];

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
    (booking) =>
      booking.status === "Disetujui" ||
      booking.status === "Dalam Proses" ||
      booking.status === "Menunggu",
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

export function normalizeBookingSession(session: string): string {
  const trimmed = session.trim();
  if (trimmed.length === 0) {
    return "";
  }

  if ((BOOKING_SESSION_OPTIONS as readonly string[]).includes(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length < 8) {
    return trimmed;
  }

  const canonical = `${digits.slice(0, 2)}.${digits.slice(2, 4)} - ${digits.slice(4, 6)}.${digits.slice(6, 8)} WITA`;
  if ((BOOKING_SESSION_OPTIONS as readonly string[]).includes(canonical)) {
    return canonical;
  }

  return canonical;
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
