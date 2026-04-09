import { createClient } from "../client";

const BUCKET = "school-documents";
const seedDocumentMap: Record<string, string> = {
  "DOC-004": "/api/seed-documents/DOC-004",
  "DOC-005": "/api/seed-documents/DOC-005",
};

export function isDirectDownloadPath(path?: string | null): boolean {
  return Boolean(path && (/^https?:\/\//i.test(path) || path.startsWith("/")));
}

export async function uploadFile(
  schoolId: string,
  file: File,
  fileName?: string,
): Promise<{ path: string; error: string | null }> {
  const supabase = createClient();
  const safeName = fileName ?? file.name;
  const timestamp = Date.now();
  const path = `${schoolId}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) return { path: "", error: error.message };
  return { path, error: null };
}

export async function getSignedUrl(
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) return null;
  return data.signedUrl;
}

export function getSeedDocumentDownloadUrl(
  documentId: string,
  storagePath?: string | null,
): string | null {
  if (storagePath && isDirectDownloadPath(storagePath)) {
    return storagePath;
  }

  if (storagePath?.startsWith("__seed__/")) {
    return `/api/seed-documents/${encodeURIComponent(documentId)}`;
  }

  return seedDocumentMap[documentId] ?? null;
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) throw error;
}
