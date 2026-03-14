import { createClient } from "../client";
import type { SchoolDocument } from "../../userDashboardData";

function rowToDocument(row: Record<string, unknown>): SchoolDocument {
  return {
    id: row.id as string,
    schoolId: (row.school_id as string) ?? undefined,
    fileName: row.file_name as string,
    uploadedAt: row.uploaded_at as string,
    stage: row.stage as SchoolDocument["stage"],
    historyId: (row.history_id as string) ?? undefined,
    bookingId: (row.booking_id as string) ?? undefined,
    fileSize: (row.file_size as number) ?? undefined,
    mimeType: (row.mime_type as string) ?? undefined,
    reviewStatus: (row.review_status as SchoolDocument["reviewStatus"]) ?? undefined,
    reviewerNotes: (row.reviewer_notes as string) ?? undefined,
    version: (row.version as number) ?? undefined,
    parentDocId: (row.parent_doc_id as string) ?? undefined,
    storagePath: (row.storage_path as string) ?? undefined,
  };
}

export async function fetchDocuments(
  schoolId?: string,
): Promise<SchoolDocument[]> {
  const supabase = createClient();
  let query = supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToDocument);
}

export async function insertDocument(
  schoolId: string,
  doc: SchoolDocument & { storagePath?: string },
): Promise<SchoolDocument> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      id: doc.id,
      school_id: schoolId,
      booking_id: doc.bookingId ?? null,
      history_id: doc.historyId ?? null,
      file_name: doc.fileName,
      storage_path: doc.storagePath ?? null,
      file_size: doc.fileSize ?? null,
      mime_type: doc.mimeType ?? null,
      stage: doc.stage,
      review_status: doc.reviewStatus ?? "Menunggu Review",
      reviewer_notes: doc.reviewerNotes ?? null,
      version: doc.version ?? 1,
      parent_doc_id: doc.parentDocId ?? null,
      uploaded_at: doc.uploadedAt,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToDocument(data as Record<string, unknown>);
}

export async function updateDocument(
  docId: string,
  updates: Partial<{
    history_id: string | null;
    review_status: string;
    reviewer_notes: string | null;
    file_name: string;
    storage_path: string;
    file_size: number;
    mime_type: string;
    version: number;
    parent_doc_id: string;
    uploaded_at: string;
    booking_id: string | null;
  }>,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", docId);

  if (error) throw error;
}

export async function deleteDocument(docId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", docId);

  if (error) throw error;
}

export async function updateDocumentsHistoryId(
  bookingId: string,
  historyId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("documents")
    .update({ history_id: historyId })
    .eq("booking_id", bookingId);

  if (error) throw error;
}
