import { createClient } from "../client";
import type {
  BookingItem,
  BookingTimelineItem,
} from "../../userDashboardData";
import type { Json } from "../types";

function rowToBooking(row: Record<string, unknown>): BookingItem {
  return {
    id: row.id as string,
    schoolId: (row.school_id as string) ?? undefined,
    school: row.school_name as string,
    topic: row.topic as string,
    category: (row.category as BookingItem["category"]) ?? undefined,
    dateISO: row.date_iso as string,
    session: row.session as string,
    status: row.status as BookingItem["status"],
    timeline: (row.timeline ?? []) as BookingTimelineItem[],
    goal: (row.goal as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    cancelReason: (row.cancel_reason as string) ?? undefined,
    rating: (row.rating as number) ?? undefined,
    feedback: (row.feedback as string) ?? undefined,
    supervisorNotes: (row.supervisor_notes as string) ?? undefined,
  };
}

export async function fetchBookings(schoolId?: string): Promise<BookingItem[]> {
  const supabase = createClient();
  let query = supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToBooking);
}

export async function insertBooking(
  schoolId: string,
  schoolName: string,
  booking: BookingItem,
): Promise<BookingItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      id: booking.id,
      school_id: schoolId,
      school_name: schoolName,
      topic: booking.topic,
      category: booking.category ?? null,
      date_iso: booking.dateISO,
      session: booking.session,
      status: booking.status,
      timeline: booking.timeline as unknown as Json,
      goal: booking.goal ?? null,
      notes: booking.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    if (
      error.code === "23505" ||
      error.message.toLowerCase().includes("bookings_active_slot_unique")
    ) {
      throw new Error("Jadwal sudah dipakai. Pilih tanggal atau sesi lain.");
    }
    throw error;
  }
  return rowToBooking(data as Record<string, unknown>);
}

export async function updateBooking(
  bookingId: string,
  updates: Partial<{
    status: string;
    timeline: BookingTimelineItem[];
    cancel_reason: string;
    rating: number;
    feedback: string;
    supervisor_notes: string;
  }>,
): Promise<void> {
  const supabase = createClient();
  const payload: Record<string, unknown> = {};

  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.timeline !== undefined) payload.timeline = updates.timeline;
  if (updates.cancel_reason !== undefined) payload.cancel_reason = updates.cancel_reason;
  if (updates.rating !== undefined) payload.rating = updates.rating;
  if (updates.feedback !== undefined) payload.feedback = updates.feedback;
  if (updates.supervisor_notes !== undefined) payload.supervisor_notes = updates.supervisor_notes;

  const { error } = await supabase
    .from("bookings")
    .update(payload)
    .eq("id", bookingId);

  if (error) throw error;
}

export async function checkAvailability(
  date: string,
  session: string,
): Promise<boolean> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("date_iso", date)
    .eq("session", session)
    .not("status", "in", '("Dibatalkan","Ditolak")');

  if (error) throw error;
  return (count ?? 0) === 0;
}
