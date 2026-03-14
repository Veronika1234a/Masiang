"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ALL_STAGES,
  REQUIRED_DOCUMENTS,
  getFormattedNow,
  getFormattedToday,
  getTodayISO,
  type BookingItem,
  type BookingTimelineItem,
  type DocumentReviewStatus,
  type DocumentStage,
  type Notification,
  type RiwayatItem,
  type SchoolDocument,
  type SchoolProfile,
  type StageProgress,
} from "./userDashboardData";
import { useAuth } from "./AuthContext";

import * as bookingSvc from "./supabase/services/bookings";
import * as docSvc from "./supabase/services/documents";
import * as historySvc from "./supabase/services/histories";
import * as notifSvc from "./supabase/services/notifications";
import * as profileSvc from "./supabase/services/profiles";
import * as storageSvc from "./supabase/services/storage";

// ─── New Booking Input ───

export interface NewBookingInput {
  topic: string;
  category: string;
  date: string;
  session: string;
  goal: string;
  notes: string;
}

// ─── Toast State ───

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

// ─── Context Value ───

interface DashboardContextValue {
  bookings: BookingItem[];
  documents: SchoolDocument[];
  histories: RiwayatItem[];
  profile: SchoolProfile;
  notifications: Notification[];
  progress: StageProgress;
  toasts: ToastItem[];
  dashboardLoading: boolean;

  createBooking(data: NewBookingInput): Promise<BookingItem>;
  cancelBooking(id: string, reason: string): Promise<void>;
  confirmBookingDone(id: string): Promise<string | null>;
  rateBooking(id: string, rating: number, feedback: string): Promise<void>;

  uploadDocument(
    fileName: string,
    stage: DocumentStage,
    fileSize?: number,
    mimeType?: string,
    bookingId?: string,
    file?: File,
  ): Promise<SchoolDocument>;
  deleteDocument(id: string): Promise<void>;
  replaceDocument(
    id: string,
    fileName: string,
    fileSize?: number,
    mimeType?: string,
    file?: File,
  ): Promise<SchoolDocument>;

  toggleFollowUpItem(historyId: string, itemId: string): Promise<void>;
  markFollowUpDone(historyId: string): Promise<void>;

  updateProfile(data: Partial<SchoolProfile>): Promise<void>;

  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  unreadCount: number;

  addToast(message: string, type?: ToastItem["type"]): void;
  removeToast(id: string): void;

  checkAvailability(date: string, session: string): Promise<boolean>;

  approveBooking(id: string): Promise<void>;
  rejectBooking(id: string, reason: string): Promise<void>;
  startSession(id: string): Promise<void>;
  reviewDocument(id: string, status: DocumentReviewStatus, notes?: string): Promise<void>;
  addSupervisorNotes(bookingId: string, notes: string): Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}

// ─── Progress Calculator ───

function calcProgress(documents: SchoolDocument[]): StageProgress {
  const stages = ALL_STAGES;
  const pcts: Record<DocumentStage, number> = {
    Melayani: 0,
    Adaptif: 0,
    Pelaksanaan: 0,
    Laporan: 0,
  };

  for (const stage of stages) {
    const required = REQUIRED_DOCUMENTS[stage];
    if (required.length === 0) {
      pcts[stage] = 100;
      continue;
    }
    const matchCount = required.filter((reqName) =>
      documents.some(
        (doc) =>
          doc.stage === stage &&
          doc.fileName.toLowerCase().includes(reqName.toLowerCase()),
      ),
    ).length;
    pcts[stage] = Math.round((matchCount / required.length) * 100);
  }

  let currentStage: DocumentStage = "Melayani";
  for (const stage of stages) {
    currentStage = stage;
    if (pcts[stage] < 100) break;
  }

  return {
    currentStage,
    melayaniPct: pcts.Melayani,
    adaptifPct: pcts.Adaptif,
    pelaksanaanPct: pcts.Pelaksanaan,
    laporanPct: pcts.Laporan,
  };
}

// ─── ID Generators (client-side, matching readable format) ───

let idCounter = Date.now();
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter % 100000).padStart(3, "0")}`;
}

const emptyProfile: SchoolProfile = {
  schoolName: "",
  npsn: "",
  educationLevel: "",
  address: "",
  officialEmail: "",
  phone: "",
  principalName: "",
  operatorName: "",
  district: "",
};

function attachDocumentsToHistories(
  histories: RiwayatItem[],
  documents: SchoolDocument[],
): RiwayatItem[] {
  return histories.map((history) => ({
    ...history,
    documents: documents
      .filter((document) => document.historyId === history.id)
      .map((document) => ({
        id: document.id,
        fileName: document.fileName,
        category: "Laporan" as const,
        uploadedAt: document.uploadedAt,
      })),
  }));
}

// ─── Provider ───

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [histories, setHistories] = useState<RiwayatItem[]>([]);
  const [profile, setProfile] = useState<SchoolProfile>(emptyProfile);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loadedDashboardUserId, setLoadedDashboardUserId] = useState<string | null>(null);
  const completingBookingIdsRef = useRef<Set<string>>(new Set());

  const progress = useMemo(() => calcProgress(documents), [documents]);
  const dashboardLoading = Boolean(user && loadedDashboardUserId !== user.id);
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  // ─── Fetch all data when user is available ───

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const isAdmin = user.role === "admin";
    const schoolId = isAdmin ? undefined : user.id;

    Promise.all([
      bookingSvc.fetchBookings(schoolId),
      docSvc.fetchDocuments(schoolId),
      historySvc.fetchHistories(schoolId),
      profileSvc.fetchProfile(user.id),
      notifSvc.fetchNotifications(user.id),
    ])
      .then(([b, d, h, p, n]) => {
        if (cancelled) return;

        setBookings(b);
        setDocuments(d);
        setHistories(attachDocumentsToHistories(h, d));
        setProfile(p ?? emptyProfile);
        setNotifications(n);
        setLoadedDashboardUserId(user.id);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Dashboard fetch error:", err);
        setLoadedDashboardUserId(user.id);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const refreshNotifications = async () => {
      try {
        const nextNotifications = await notifSvc.fetchNotifications(user.id);
        if (!cancelled) {
          setNotifications(nextNotifications);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Notification refresh error:", error);
        }
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 15000);

    const handleFocus = () => {
      void refreshNotifications();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);

  // ─── Toast helpers ───

  const addToast = useCallback(
    (message: string, type: ToastItem["type"] = "success") => {
      const id = `toast-${Date.now()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Notification helper ───

  const pushNotif = useCallback(
    async (
      title: string,
      message: string,
      type: Notification["type"],
      referenceId?: string,
      referenceType?: Notification["referenceType"],
      recipientUserIds?: string[],
    ) => {
      if (!user) return;
      const requestedTargets = recipientUserIds?.length ? recipientUserIds : [user.id];
      const uniqueTargets = Array.from(new Set(requestedTargets.filter(Boolean)));
      const targets =
        user.role === "admin"
          ? uniqueTargets
          : uniqueTargets.filter((targetUserId) => targetUserId === user.id);

      if (targets.length === 0) {
        return;
      }

      const localNotifId = targets.includes(user.id) ? nextId("NTF") : null;
      const notifBase = {
        title,
        message,
        type,
        referenceId,
        referenceType,
        isRead: false,
        createdAt: getTodayISO(),
      };

      if (localNotifId) {
        setNotifications((prev) => [{ id: localNotifId, ...notifBase }, ...prev]);
      }

      try {
        await Promise.all(
          targets.map((targetUserId) =>
            notifSvc.insertNotification(targetUserId, {
              id: targetUserId === user.id && localNotifId ? localNotifId : nextId("NTF"),
              title,
              message,
              type,
              referenceId,
              referenceType,
            }),
          ),
        );
      } catch (error) {
        console.error("pushNotif error:", error);
      }
    },
    [user],
  );

  // ─── Booking Actions ───

  const createBooking = useCallback(
    async (data: NewBookingInput): Promise<BookingItem> => {
      if (!user) throw new Error("Not authenticated");
      const id = nextId("BK");
      const newBooking: BookingItem = {
        id,
        schoolId: user.id,
        school: profile.schoolName,
        topic: data.topic,
        category: data.category as BookingItem["category"],
        dateISO: data.date,
        session: data.session,
        status: "Menunggu",
        goal: data.goal,
        notes: data.notes,
        timeline: [
          { title: "Pengajuan diterima", note: "Pengajuan baru masuk ke sistem", time: getFormattedNow(), status: "done" },
          { title: "Verifikasi admin", note: "Menunggu verifikasi data", time: "Dalam antrean", status: "active" },
          { title: "Sesi pendampingan", note: "Menunggu persetujuan jadwal", time: "Belum dijadwalkan", status: "pending" },
          { title: "Unggah laporan", note: "Dibuka setelah sesi berjalan", time: "Belum tersedia", status: "pending" },
        ] satisfies BookingTimelineItem[],
      };

      setBookings((prev) => [newBooking, ...prev]);

      try {
        await bookingSvc.insertBooking(user.id, profile.schoolName, newBooking);
      } catch (err) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        throw err;
      }

      await pushNotif(
        "Booking Dibuat",
        `Booking ${id} (${data.topic}) berhasil diajukan.`,
        "booking_created",
        id,
        "booking",
        [user.id],
      );
      addToast(`Booking ${id} berhasil diajukan.`);
      return newBooking;
    },
    [user, profile.schoolName, pushNotif, addToast],
  );

  const cancelBooking = useCallback(
    async (id: string, reason: string) => {
      if (!user) return;
      const previousBookings = bookings;

      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: "Dibatalkan" as const, cancelReason: reason } : b,
        ),
      );

      try {
        await bookingSvc.updateBooking(id, { status: "Dibatalkan", cancel_reason: reason });
      } catch (err) {
        console.error("cancelBooking error:", err);
        setBookings(previousBookings);
        addToast(`Gagal membatalkan booking ${id}.`, "error");
        throw err;
      }

      await pushNotif(
        "Booking Dibatalkan",
        `Booking ${id} telah dibatalkan.`,
        "booking_cancelled",
        id,
        "booking",
        [user.id],
      );
      addToast(`Booking ${id} dibatalkan.`, "info");
    },
    [user, bookings, pushNotif, addToast],
  );

  const confirmBookingDone = useCallback(
    async (id: string): Promise<string | null> => {
      if (!user || user.role !== "admin") {
        throw new Error("Only admin can complete a booking.");
      }

      const matchedBooking = bookings.find((booking) => booking.id === id);
      if (!matchedBooking) {
        return null;
      }

      const existingHistory = histories.find((history) => history.bookingId === id);
      if (matchedBooking.status === "Selesai" || existingHistory) {
        addToast(`Sesi ${id} sudah selesai.`, "info");
        return existingHistory?.id ?? null;
      }

      if (completingBookingIdsRef.current.has(id)) {
        addToast(`Sesi ${id} sedang diproses.`, "info");
        return null;
      }

      completingBookingIdsRef.current.add(id);

      try {
        const doneTimeline = matchedBooking.timeline.map((timelineItem) => ({
          ...timelineItem,
          status: "done" as const,
        }));
        const relatedDocs = documents.filter((document) => document.bookingId === matchedBooking.id);
        const schoolId = matchedBooking.schoolId ?? relatedDocs[0]?.schoolId;
        if (!schoolId) {
          throw new Error("Cannot create history without a school owner.");
        }

        const historyId = nextId("RH");
        const historyDocs = relatedDocs.map((document) => ({
          id: document.id,
          fileName: document.fileName,
          category: "Laporan" as const,
          uploadedAt: document.uploadedAt,
        }));
        const newHistory: RiwayatItem = {
          id: historyId,
          schoolId,
          dateISO: matchedBooking.dateISO,
          school: matchedBooking.school,
          session: matchedBooking.session,
          title: matchedBooking.topic,
          description: `Sesi pendampingan "${matchedBooking.topic}" telah selesai dilaksanakan.`,
          status: "Tindak Lanjut",
          followUpISO: undefined,
          bookingId: matchedBooking.id,
          supervisorNotes: matchedBooking.supervisorNotes,
          followUpDone: false,
          followUpItems: [
            { id: `FU-${Date.now()}-1`, text: "Upload laporan hasil sesi", done: false },
            { id: `FU-${Date.now()}-2`, text: "Tindak lanjut rekomendasi pengawas", done: false },
          ],
          documents: historyDocs,
        };

        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === id
              ? {
                  ...booking,
                  status: "Selesai" as const,
                  timeline: doneTimeline,
                }
              : booking,
          ),
        );
        setDocuments((prev) =>
          prev.map((document) =>
            document.bookingId === matchedBooking.id ? { ...document, historyId } : document,
          ),
        );
        setHistories((prev) => [newHistory, ...prev]);

        try {
          await bookingSvc.updateBooking(id, {
            status: "Selesai",
            timeline: doneTimeline as BookingTimelineItem[],
          });
          await historySvc.insertHistory(schoolId, newHistory);
          await docSvc.updateDocumentsHistoryId(matchedBooking.id, historyId);
        } catch (err) {
          console.error("confirmBookingDone error:", err);
          setBookings(bookings);
          setDocuments(documents);
          setHistories(histories);
          const message =
            err instanceof Error && err.message
              ? err.message
              : `Gagal menyelesaikan sesi ${id}.`;
          addToast(message, "error");
          return null;
        }

        const recipientUserIds = matchedBooking.schoolId ? [matchedBooking.schoolId] : [user.id];

        await pushNotif(
          "Sesi Selesai",
          `Booking ${id} telah selesai. Berikan rating dan feedback.`,
          "booking_completed",
          id,
          "booking",
          recipientUserIds,
        );
        addToast(`Sesi ${id} ditandai selesai.`);
        return historyId;
      } finally {
        completingBookingIdsRef.current.delete(id);
      }
    },
    [user, documents, bookings, histories, pushNotif, addToast],
  );

  const rateBooking = useCallback(
    async (id: string, rating: number, feedback: string) => {
      const previousBookings = bookings;

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, rating, feedback } : b)),
      );

      try {
        await bookingSvc.updateBooking(id, { rating, feedback });
      } catch (err) {
        console.error("rateBooking error:", err);
        setBookings(previousBookings);
        addToast("Gagal menyimpan rating dan feedback.", "error");
        throw err;
      }

      addToast("Rating dan feedback berhasil disimpan.");
    },
    [bookings, addToast],
  );

  // ─── Document Actions ───

  const uploadDocument = useCallback(
    async (
      fileName: string,
      stage: DocumentStage,
      fileSize?: number,
      mimeType?: string,
      bookingId?: string,
      file?: File,
    ): Promise<SchoolDocument> => {
      if (!user) throw new Error("Not authenticated");

      const id = nextId("DOC");
      let storagePath: string | undefined;

      if (file) {
        const { path, error } = await storageSvc.uploadFile(user.id, file, fileName);
        if (error) throw new Error(error);
        storagePath = path;
      }

      const doc: SchoolDocument = {
        id,
        schoolId: user.id,
        fileName,
        uploadedAt: getFormattedToday(),
        stage,
        fileSize,
        mimeType,
        bookingId,
        reviewStatus: "Menunggu Review",
        version: 1,
        storagePath,
      };

      setDocuments((prev) => [doc, ...prev]);

      try {
        await docSvc.insertDocument(user.id, doc);
      } catch (err) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        throw err;
      }

      await pushNotif(
        "Dokumen Diunggah",
        `Dokumen "${fileName}" berhasil diunggah.`,
        "doc_uploaded",
        id,
        "document",
        [user.id],
      );
      addToast(`Dokumen "${fileName}" berhasil diunggah.`);
      return doc;
    },
    [user, pushNotif, addToast],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      const doc = documents.find((d) => d.id === id);
      const previousDocuments = documents;
      const previousHistories = histories;

      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (doc?.historyId) {
        setHistories((prev) =>
          prev.map((history) =>
            history.id === doc.historyId
              ? {
                  ...history,
                  documents: history.documents.filter((historyDoc) => historyDoc.id !== id),
                }
              : history,
          ),
        );
      }

      try {
        await docSvc.deleteDocument(id);
      } catch (err) {
        console.error("deleteDocument error:", err);
        setDocuments(previousDocuments);
        setHistories(previousHistories);
        addToast(`Gagal menghapus dokumen "${doc?.fileName ?? id}".`, "error");
        throw err;
      }

      if (doc?.storagePath) {
        try {
          await storageSvc.deleteFile(doc.storagePath);
        } catch (err) {
          console.error("deleteDocument storage cleanup error:", err);
          addToast(`Dokumen "${doc.fileName}" terhapus, tetapi file storage belum berhasil dibersihkan.`, "info");
          return;
        }
      }

      addToast(`Dokumen "${doc?.fileName ?? id}" berhasil dihapus.`, "info");
    },
    [documents, histories, addToast],
  );

  const replaceDocument = useCallback(
    async (
      id: string,
      fileName: string,
      fileSize?: number,
      mimeType?: string,
      file?: File,
    ): Promise<SchoolDocument> => {
      if (!user) throw new Error("Not authenticated");

      const existing = documents.find((d) => d.id === id);
      const previousDocuments = documents;
      const previousHistories = histories;
      const newId = nextId("DOC");

      let storagePath: string | undefined;
      if (file) {
        const { path, error } = await storageSvc.uploadFile(user.id, file, fileName);
        if (error) throw new Error(error);
        storagePath = path;
      }

      const doc: SchoolDocument = {
        id: newId,
        schoolId: existing?.schoolId ?? user.id,
        fileName,
        uploadedAt: getFormattedToday(),
        stage: existing?.stage ?? "Melayani",
        fileSize,
        mimeType,
        bookingId: existing?.bookingId,
        historyId: existing?.historyId,
        reviewStatus: "Menunggu Review",
        version: (existing?.version ?? 0) + 1,
        parentDocId: id,
        storagePath,
      };

      setDocuments((prev) => prev.map((d) => (d.id === id ? doc : d)));
      if (existing?.historyId) {
        setHistories((prev) =>
          prev.map((history) =>
            history.id === existing.historyId
              ? {
                  ...history,
                  documents: history.documents.map((historyDoc) =>
                    historyDoc.id === id
                      ? {
                          id: newId,
                          fileName,
                          category: historyDoc.category,
                          uploadedAt: doc.uploadedAt,
                        }
                      : historyDoc,
                  ),
                }
              : history,
          ),
        );
      }

      try {
        await docSvc.insertDocument(user.id, doc);
        if (existing) {
          await docSvc.deleteDocument(id);
        }
      } catch (err) {
        console.error("replaceDocument error:", err);
        if (storagePath) {
          try {
            await storageSvc.deleteFile(storagePath);
          } catch (cleanupError) {
            console.error("replaceDocument cleanup error:", cleanupError);
          }
        }
        setDocuments(previousDocuments);
        setHistories(previousHistories);
        addToast(`Gagal mengunggah revisi "${fileName}".`, "error");
        throw err;
      }

      if (existing?.storagePath) {
        try {
          await storageSvc.deleteFile(existing.storagePath);
        } catch (err) {
          console.error("replaceDocument storage cleanup error:", err);
          addToast(`Revisi "${fileName}" tersimpan, tetapi file lama belum berhasil dibersihkan dari storage.`, "info");
        }
      }

      await pushNotif(
        "Dokumen Diperbarui",
        `Revisi dokumen "${fileName}" berhasil diunggah.`,
        "doc_uploaded",
        newId,
        "document",
        [user.id],
      );
      addToast(`Revisi "${fileName}" berhasil diunggah.`);
      return doc;
    },
    [user, documents, histories, pushNotif, addToast],
  );

  // ─── History / Follow-up Actions ───

  const toggleFollowUpItem = useCallback(
    async (historyId: string, itemId: string) => {
      const previousHistories = histories;
      let updatedItems: RiwayatItem["followUpItems"];

      setHistories((prev) =>
        prev.map((h) => {
          if (h.id !== historyId) return h;
          const newItems = h.followUpItems?.map((fi) =>
            fi.id === itemId ? { ...fi, done: !fi.done } : fi,
          );
          updatedItems = newItems;
          return { ...h, followUpItems: newItems };
        }),
      );

      if (updatedItems) {
        try {
          await historySvc.updateHistory(historyId, {
            follow_up_items: updatedItems,
          });
        } catch (err) {
          console.error("toggleFollowUpItem error:", err);
          setHistories(previousHistories);
          addToast("Gagal menyimpan checklist tindak lanjut.", "error");
        }
      }
    },
    [histories, addToast],
  );

  const markFollowUpDone = useCallback(
    async (historyId: string) => {
      const previousHistories = histories;
      let updatedItems: RiwayatItem["followUpItems"];

      setHistories((prev) =>
        prev.map((h) => {
          if (h.id !== historyId) return h;
          const newItems = h.followUpItems?.map((fi) => ({ ...fi, done: true }));
          updatedItems = newItems;
          return { ...h, followUpDone: true, followUpItems: newItems };
        }),
      );

      try {
        await historySvc.updateHistory(historyId, {
          follow_up_done: true,
          follow_up_items: updatedItems ?? [],
        });
      } catch (err) {
        console.error("markFollowUpDone error:", err);
        setHistories(previousHistories);
        addToast("Gagal menandai semua tindak lanjut.", "error");
        return;
      }

      addToast("Semua tindak lanjut ditandai selesai.");
    },
    [histories, addToast],
  );

  // ─── Profile Actions ───

  const updateProfileFn = useCallback(
    async (data: Partial<SchoolProfile>) => {
      if (!user) return;
      const previousProfile = profile;
      setProfile((prev) => ({ ...prev, ...data }));

      try {
        await profileSvc.updateProfile(user.id, data);
      } catch (err) {
        console.error("updateProfile error:", err);
        setProfile(previousProfile);
        addToast("Gagal menyimpan profil.", "error");
        throw err;
      }

      addToast("Profil berhasil disimpan.");
    },
    [user, profile, addToast],
  );

  // ─── Notification Actions ───

  const markNotificationRead = useCallback(
    async (id: string) => {
      if (!user) return;
      const previousNotifications = notifications;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );

      try {
        await notifSvc.markRead(user.id, id);
      } catch (err) {
        console.error("markNotificationRead error:", err);
        setNotifications(previousNotifications);
        addToast("Gagal memperbarui status notifikasi.", "error");
      }
    },
    [user, notifications, addToast],
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;
    const previousNotifications = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await notifSvc.markAllRead(user.id);
    } catch (err) {
      console.error("markAllNotificationsRead error:", err);
      setNotifications(previousNotifications);
      addToast("Gagal menandai semua notifikasi sebagai dibaca.", "error");
    }
  }, [user, notifications, addToast]);

  // ─── Availability Check ───

  const checkAvailabilityFn = useCallback(
    async (date: string, session: string): Promise<boolean> => {
      try {
        return await bookingSvc.checkAvailability(date, session);
      } catch {
        return !bookings.some(
          (b) =>
            b.dateISO === date &&
            b.session === session &&
            b.status !== "Dibatalkan" &&
            b.status !== "Ditolak",
        );
      }
    },
    [bookings],
  );

  // ─── Admin: Booking Actions ───

  const approveBooking = useCallback(
    async (id: string) => {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) {
        return;
      }

      const newTimeline = booking?.timeline.map((t, i) =>
        i <= 1
          ? { ...t, status: "done" as const, time: i === 1 ? getFormattedNow() : t.time }
          : i === 2
            ? { ...t, status: "active" as const }
            : t,
      );

      setBookings((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "Disetujui" as const,
                timeline: newTimeline as BookingTimelineItem[],
              }
            : item,
        ),
      );

      try {
        await bookingSvc.updateBooking(id, {
          status: "Disetujui",
          timeline: newTimeline as BookingTimelineItem[],
        });
      } catch (err) {
        console.error("approveBooking error:", err);
        setBookings(bookings);
        addToast(`Gagal menyetujui booking ${id}.`, "error");
        return;
      }

      await pushNotif(
        "Booking Disetujui",
        `Booking ${id} telah disetujui oleh admin.`,
        "booking_approved",
        id,
        "booking",
        booking?.schoolId ? [booking.schoolId] : undefined,
      );
      addToast(`Booking ${id} disetujui.`);
    },
    [bookings, pushNotif, addToast],
  );

  const rejectBooking = useCallback(
    async (id: string, reason: string) => {
      const booking = bookings.find((item) => item.id === id);
      if (!booking) {
        return;
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: "Ditolak" as const, cancelReason: reason } : b,
        ),
      );

      try {
        await bookingSvc.updateBooking(id, { status: "Ditolak", cancel_reason: reason });
      } catch (err) {
        console.error("rejectBooking error:", err);
        setBookings(bookings);
        addToast(`Gagal menolak booking ${id}.`, "error");
        throw err;
      }

      await pushNotif(
        "Booking Ditolak",
        `Booking ${id} ditolak: ${reason}`,
        "booking_rejected",
        id,
        "booking",
        booking?.schoolId ? [booking.schoolId] : undefined,
      );
      addToast(`Booking ${id} ditolak.`, "info");
    },
    [bookings, pushNotif, addToast],
  );

  const startSession = useCallback(
    async (id: string) => {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) {
        return;
      }

      const newTimeline = booking?.timeline.map((t, i) =>
        i <= 2
          ? { ...t, status: i < 2 ? ("done" as const) : ("active" as const), time: i === 2 ? getFormattedNow() : t.time }
          : t,
      );

      setBookings((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "Dalam Proses" as const,
                timeline: newTimeline as BookingTimelineItem[],
              }
            : item,
        ),
      );

      try {
        await bookingSvc.updateBooking(id, {
          status: "Dalam Proses",
          timeline: newTimeline as BookingTimelineItem[],
        });
      } catch (err) {
        console.error("startSession error:", err);
        setBookings(bookings);
        addToast(`Gagal memulai sesi ${id}.`, "error");
        return;
      }

      await pushNotif(
        "Sesi Dimulai",
        `Sesi pendampingan ${id} telah dimulai.`,
        "booking_approved",
        id,
        "booking",
        booking?.schoolId ? [booking.schoolId] : undefined,
      );
      addToast(`Sesi ${id} dimulai.`);
    },
    [bookings, pushNotif, addToast],
  );

  // ─── Admin: Document Review ───

  const reviewDocumentFn = useCallback(
    async (id: string, reviewStatus: DocumentReviewStatus, notes?: string) => {
      const document = documents.find((item) => item.id === id);
      if (!document) {
        return;
      }

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, reviewStatus, reviewerNotes: notes } : d,
        ),
      );

      try {
        await docSvc.updateDocument(id, {
          review_status: reviewStatus,
          reviewer_notes: notes ?? null,
        });
      } catch (err) {
        console.error("reviewDocument error:", err);
        setDocuments(documents);
        addToast(`Gagal menyimpan review dokumen ${id}.`, "error");
        throw err;
      }

      const label = reviewStatus === "Disetujui" ? "disetujui" : "perlu revisi";
      await pushNotif(
        "Review Dokumen",
        `Dokumen ${id} telah di-review: ${label}.`,
        "doc_review",
        id,
        "document",
        document?.schoolId ? [document.schoolId] : undefined,
      );
      addToast(`Dokumen ${id} ditandai ${label}.`);
    },
    [documents, pushNotif, addToast],
  );

  // ─── Admin: Supervisor Notes ───

  const addSupervisorNotesFn = useCallback(
    async (bookingId: string, notes: string) => {
      const booking = bookings.find((item) => item.id === bookingId);
      if (!booking) {
        return;
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, supervisorNotes: notes } : b,
        ),
      );
      setHistories((prev) =>
        prev.map((h) =>
          h.bookingId === bookingId ? { ...h, supervisorNotes: notes } : h,
        ),
      );

      try {
        await bookingSvc.updateBooking(bookingId, { supervisor_notes: notes });
        await historySvc.updateHistoriesByBookingId(bookingId, { supervisor_notes: notes });
      } catch (err) {
        console.error("addSupervisorNotes error:", err);
        setBookings(bookings);
        setHistories(histories);
        addToast("Gagal menyimpan catatan pengawas.", "error");
        throw err;
      }

      if (booking?.schoolId) {
        await pushNotif(
          "Catatan Pengawas",
          `Booking ${bookingId} menerima catatan baru dari admin.`,
          "booking_completed",
          bookingId,
          "booking",
          [booking.schoolId],
        );
      }

      addToast("Catatan pengawas berhasil disimpan.");
    },
    [bookings, histories, pushNotif, addToast],
  );

  // ─── Context Value ───

  const value = useMemo<DashboardContextValue>(
    () => ({
      bookings,
      documents,
      histories,
      profile,
      notifications,
      progress,
      toasts,
      dashboardLoading,
      createBooking,
      cancelBooking,
      confirmBookingDone,
      rateBooking,
      uploadDocument,
      deleteDocument,
      replaceDocument,
      toggleFollowUpItem,
      markFollowUpDone,
      updateProfile: updateProfileFn,
      markNotificationRead,
      markAllNotificationsRead,
      unreadCount,
      addToast,
      removeToast,
      checkAvailability: checkAvailabilityFn,
      approveBooking,
      rejectBooking,
      startSession,
      reviewDocument: reviewDocumentFn,
      addSupervisorNotes: addSupervisorNotesFn,
    }),
    [
      bookings, documents, histories, profile, notifications, progress, toasts, dashboardLoading,
      createBooking, cancelBooking, confirmBookingDone, rateBooking,
      uploadDocument, deleteDocument, replaceDocument,
      toggleFollowUpItem, markFollowUpDone,
      updateProfileFn,
      markNotificationRead, markAllNotificationsRead, unreadCount,
      addToast, removeToast, checkAvailabilityFn,
      approveBooking, rejectBooking, startSession, reviewDocumentFn, addSupervisorNotesFn,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
