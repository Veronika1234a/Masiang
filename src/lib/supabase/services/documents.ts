import { createClient } from "../client";
import type { SchoolDocument } from "../../userDashboardData";

function rowToDocument(row: Record<string, unknown>): SchoolDocument {
  const uploadedAtText =
    typeof row.uploaded_at === "string" ? row.uploaded_at : null;
  const uploadedAtIso =
    typeof row.uploaded_at_ts === "string" ? row.uploaded_at_ts : null;

  return {
    id: row.id as string,
    schoolId: (row.school_id as string) ?? undefined,
    fileName: row.file_name as string,
    uploadedAt:
      uploadedAtText ??
      (uploadedAtIso
        ? new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date(uploadedAtIso))
        : ""),
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
  const mapped = (data ?? []).map(rowToDocument);
  const supersededIds = new Set(
    mapped
      .map((document) => document.parentDocId)
      .filter((documentId): documentId is string => Boolean(documentId)),
  );

  // Show only latest revision per chain in default listing.
  return mapped.filter((document) => !supersededIds.has(document.id));
}

export async function insertDocument(
  schoolId: string,
  doc: SchoolDocument & { storagePath?: string },
): Promise<SchoolDocument> {
  const supabase = createClient();
  const payload = {
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
    uploaded_at_ts: new Date().toISOString(),
  };

  const firstAttempt = await supabase
    .from("documents")
    .insert(payload)
    .select()
    .single();

  if (!firstAttempt.error) {
    return rowToDocument(firstAttempt.data as Record<string, unknown>);
  }

  // Backward-compatibility for projects that haven't applied uploaded_at_ts migration yet.
  if (
    firstAttempt.error.code === "PGRST204" &&
    firstAttempt.error.message.includes("uploaded_at_ts")
  ) {
    const { uploaded_at_ts: _legacyUploadedAtTs, ...legacyPayload } = payload;
    const legacyAttempt = await supabase
      .from("documents")
      .insert(legacyPayload)
      .select()
      .single();

    if (legacyAttempt.error) throw legacyAttempt.error;
    return rowToDocument(legacyAttempt.data as Record<string, unknown>);
  }

  throw firstAttempt.error;
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
