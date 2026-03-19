import { createClient } from "../client";
import type { Notification } from "../../userDashboardData";

function rowToNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    title: row.title as string,
    message: row.message as string,
    type: row.type as Notification["type"],
    referenceId: (row.reference_id as string) ?? undefined,
    referenceType: (row.reference_type as Notification["referenceType"]) ?? undefined,
    isRead: row.is_read as boolean,
    createdAt: row.created_at as string,
  };
}

export async function fetchNotifications(
  userId: string,
): Promise<Notification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToNotification);
}

export async function insertNotification(
  userId: string,
  notif: Omit<Notification, "isRead" | "createdAt">,
): Promise<Notification> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .insert({
      id: notif.id,
      user_id: userId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      reference_id: notif.referenceId ?? null,
      reference_type: notif.referenceType ?? null,
      is_read: false,
    });

  if (error) throw error;
  return {
    ...notif,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
}

export async function markRead(userId: string, notifId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("id", notifId);

  if (error) throw error;
}

export async function markAllRead(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}
