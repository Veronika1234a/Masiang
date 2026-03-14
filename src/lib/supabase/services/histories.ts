import { createClient } from "../client";
import type { RiwayatItem, FollowUpItem } from "../../userDashboardData";
import type { Json } from "../types";

function rowToHistory(row: Record<string, unknown>): RiwayatItem {
  return {
    id: row.id as string,
    schoolId: (row.school_id as string) ?? undefined,
    dateISO: row.date_iso as string,
    school: row.school_name as string,
    session: row.session as string,
    title: row.title as string,
    description: row.description as string,
    status: row.status as RiwayatItem["status"],
    followUpISO: (row.follow_up_iso as string) ?? undefined,
    bookingId: (row.booking_id as string) ?? undefined,
    supervisorNotes: (row.supervisor_notes as string) ?? undefined,
    followUpDone: (row.follow_up_done as boolean) ?? false,
    followUpItems: (row.follow_up_items ?? []) as FollowUpItem[],
    documents: [],
  };
}

export async function fetchHistories(
  schoolId?: string,
): Promise<RiwayatItem[]> {
  const supabase = createClient();
  let query = supabase
    .from("histories")
    .select("*")
    .order("created_at", { ascending: false });

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToHistory);
}

export async function insertHistory(
  schoolId: string,
  history: RiwayatItem,
): Promise<RiwayatItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("histories")
    .insert({
      id: history.id,
      school_id: schoolId,
      booking_id: history.bookingId ?? null,
      date_iso: history.dateISO,
      school_name: history.school,
      session: history.session,
      title: history.title,
      description: history.description,
      status: history.status,
      follow_up_iso: history.followUpISO ?? null,
      supervisor_notes: history.supervisorNotes ?? null,
      follow_up_done: history.followUpDone ?? false,
      follow_up_items: (history.followUpItems ?? []) as unknown as Json,
    })
    .select()
    .single();

  if (error) {
    if (
      error.code === "23505" ||
      error.message.toLowerCase().includes("histories_booking_id_unique")
    ) {
      throw new Error("Riwayat untuk booking ini sudah ada.");
    }
    throw error;
  }
  return rowToHistory(data as Record<string, unknown>);
}

export async function updateHistory(
  historyId: string,
  updates: Partial<{
    follow_up_items: FollowUpItem[];
    follow_up_done: boolean;
    supervisor_notes: string;
    status: string;
  }>,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("histories")
    .update(updates as Record<string, unknown>)
    .eq("id", historyId);

  if (error) throw error;
}

export async function updateHistoriesByBookingId(
  bookingId: string,
  updates: Partial<{ supervisor_notes: string }>,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("histories")
    .update(updates)
    .eq("booking_id", bookingId);

  if (error) throw error;
}
