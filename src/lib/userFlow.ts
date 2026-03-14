import type {
  BookingItem,
  Notification,
  RiwayatItem,
  SchoolDocument,
} from "./userDashboardData";

export type DashboardArea = "school" | "admin";

export function buildProtectedRedirectTarget(pathname: string, search: string): string {
  return search ? `${pathname}${search}` : pathname;
}

export function resolvePostLoginRedirect(
  requestedRedirect: string | null | undefined,
  fallbackRedirect: string,
): string {
  const normalized = requestedRedirect?.trim();

  if (!normalized || !normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallbackRedirect;
  }

  return normalized;
}

export function getNotificationHref(
  area: DashboardArea,
  notification: Pick<Notification, "referenceId" | "referenceType">,
): string | null {
  if (!notification.referenceId || !notification.referenceType) {
    return null;
  }

  if (notification.referenceType === "booking") {
    return area === "admin"
      ? `/dashboard-admin/booking/${notification.referenceId}`
      : `/dashboard/booking/${notification.referenceId}`;
  }

  if (notification.referenceType === "document") {
    return area === "admin"
      ? `/dashboard-admin/detail-dokumen?documentId=${encodeURIComponent(notification.referenceId)}`
      : "/dashboard/dokumen";
  }

  if (notification.referenceType === "history") {
    return area === "school"
      ? `/dashboard/riwayat/${notification.referenceId}`
      : null;
  }

  return null;
}

export interface SchoolDocumentMatchInput {
  schoolId: string;
  schoolName: string;
  bookings: BookingItem[];
  documents: SchoolDocument[];
  histories: RiwayatItem[];
}

export function getSchoolDocumentsForAdmin(input: SchoolDocumentMatchInput): SchoolDocument[] {
  const bookingIds = new Set(
    input.bookings
      .filter((booking) => {
        if (booking.schoolId) {
          return booking.schoolId === input.schoolId;
        }

        return booking.school === input.schoolName;
      })
      .map((booking) => booking.id),
  );

  const historyIds = new Set(
    input.histories
      .filter((history) => {
        if (history.schoolId) {
          return history.schoolId === input.schoolId;
        }

        return history.school === input.schoolName;
      })
      .map((history) => history.id),
  );

  return input.documents.filter((document) => {
    if (document.schoolId) {
      return document.schoolId === input.schoolId;
    }

    if (document.bookingId) {
      return bookingIds.has(document.bookingId);
    }

    if (document.historyId) {
      return historyIds.has(document.historyId);
    }

    return false;
  });
}
