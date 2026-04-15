import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface AuthHealthActionRequest {
  action?: "repair" | "delete";
  userId?: string;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function ensureAdmin() {
  const serverClient = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await serverClient.auth.getUser();

  if (error || !user) {
    return { ok: false as const, error: "Sesi admin tidak valid.", status: 401 };
  }

  const { data: profile } = await serverClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { ok: false as const, error: "Hanya admin yang bisa mengakses pemeriksaan akun.", status: 403 };
  }

  return { ok: true as const, userId: user.id };
}

async function listAllAuthUsers() {
  const adminClient = createAdminClient();
  const users: User[] = [];
  let page = 1;

  while (page <= 20) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw error;
    }

    users.push(...data.users);
    if (data.users.length < 100) {
      break;
    }

    page += 1;
  }

  return users;
}

function toOrphanPayload(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | null;
  return {
    id: user.id,
    email: user.email ?? "",
    createdAt: user.created_at,
    role: typeof metadata?.role === "string" ? metadata.role : "school",
    schoolName: typeof metadata?.school_name === "string" ? metadata.school_name : "",
    npsn: typeof metadata?.npsn === "string" ? metadata.npsn : "",
    contactName: typeof metadata?.contact_name === "string" ? metadata.contact_name : "",
    phone: typeof metadata?.phone === "string" ? metadata.phone : "",
    address: typeof metadata?.address === "string" ? metadata.address : "",
    repairable: Boolean(user.email && metadata?.school_name && metadata?.npsn),
  };
}

export async function GET() {
  const adminCheck = await ensureAdmin();
  if (!adminCheck.ok) {
    return jsonError(adminCheck.error, adminCheck.status);
  }

  const adminClient = createAdminClient();
  const [users, profilesResult] = await Promise.all([
    listAllAuthUsers(),
    adminClient.from("profiles").select("id"),
  ]);

  if (profilesResult.error) {
    return jsonError("Gagal membaca profil sekolah.", 500);
  }

  const profileIds = new Set((profilesResult.data ?? []).map((row) => row.id));
  const orphans = users
    .filter((user) => !profileIds.has(user.id))
    .map(toOrphanPayload);

  return NextResponse.json({ orphans });
}

export async function POST(request: Request) {
  const adminCheck = await ensureAdmin();
  if (!adminCheck.ok) {
    return jsonError(adminCheck.error, adminCheck.status);
  }

  let body: AuthHealthActionRequest;
  try {
    body = (await request.json()) as AuthHealthActionRequest;
  } catch {
    return jsonError("Payload pemeriksaan akun tidak valid.");
  }

  if (!body.userId || !body.action) {
    return jsonError("Aksi dan user ID wajib diisi.");
  }

  const adminClient = createAdminClient();
  const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(body.userId);
  const user = userData.user;

  if (userError || !user) {
    return jsonError("Akun auth tidak ditemukan.", 404);
  }

  const { data: existingProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return jsonError("Gagal memeriksa profil akun.", 500);
  }

  if (body.action === "delete") {
    if (existingProfile) {
      return jsonError("Akun ini sudah memiliki profil dan tidak dianggap yatim.", 409);
    }

    const { error } = await adminClient.auth.admin.deleteUser(user.id);
    if (error) {
      return jsonError("Gagal menghapus akun yatim.", 500);
    }

    return NextResponse.json({ status: "deleted", userId: user.id });
  }

  if (existingProfile) {
    return jsonError("Akun ini sudah memiliki profil.", 409);
  }

  const orphan = toOrphanPayload(user);
  if (!orphan.email || !orphan.schoolName || !orphan.npsn) {
    return jsonError("Akun yatim tidak memiliki metadata cukup untuk diperbaiki.", 422);
  }

  const { error: insertError } = await adminClient
    .from("profiles")
    .insert({
      id: user.id,
      role: "school",
      approval_status: "pending",
      school_name: orphan.schoolName,
      npsn: orphan.npsn,
      contact_name: orphan.contactName,
      email: orphan.email,
      phone: orphan.phone,
      address: orphan.address,
    });

  if (insertError) {
    return jsonError("Gagal memperbaiki profil akun yatim.", 500);
  }

  return NextResponse.json({ status: "repaired", userId: user.id });
}
