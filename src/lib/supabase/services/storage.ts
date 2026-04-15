import { createClient } from "../client";

const BUCKET = "school-documents";

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

export async function resolveDownloadUrl(
  storagePath?: string | null,
  expiresIn = 3600,
): Promise<string | null> {
  if (!storagePath) {
    return null;
  }

  if (isDirectDownloadPath(storagePath)) {
    return storagePath;
  }

  return getSignedUrl(storagePath, expiresIn);
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) throw error;
}
