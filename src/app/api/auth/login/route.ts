import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface LoginRequest {
  email?: string;
  password?: string;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getTrustedProfileFromAuthUser(user: User) {
  const appMetadata = user.app_metadata as Record<string, unknown> | null;
  const userMetadata = user.user_metadata as Record<string, unknown> | null;
  const role = getString(appMetadata?.role);

  if (role !== "admin" && role !== "school") {
    return null;
  }

  const approvalStatus =
    role === "admin"
      ? "approved"
      : getString(appMetadata?.approval_status) ?? "pending";

  if (
    role === "school" &&
    approvalStatus !== "pending" &&
    approvalStatus !== "approved" &&
    approvalStatus !== "rejected"
  ) {
    return null;
  }

  return {
    role,
    approval_status: approvalStatus,
    school_name: getString(userMetadata?.school_name),
    contact_name: getString(userMetadata?.contact_name),
    email: user.email ?? "",
    avatar_path: getString(userMetadata?.avatar_path),
  };
}

async function failClosedSignOut(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  message: string,
  status = 403,
) {
  await supabase.auth.signOut({ scope: "global" }).catch(() => null);
  return jsonError(message, status);
}

export async function POST(request: Request) {
  let body: LoginRequest;
  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return jsonError("Payload login tidak valid.");
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return jsonError("Email dan kata sandi wajib diisi.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return jsonError(error.message || "Login gagal.", 401);
  }

  if (!data.user) {
    return jsonError("Terjadi kesalahan autentikasi.", 401);
  }

  const trustedProfile = getTrustedProfileFromAuthUser(data.user);
  let profile: Partial<Profile> | null = trustedProfile;

  if (!profile) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role, approval_status, school_name, contact_name, email, avatar_path")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profileData) {
      return failClosedSignOut(supabase, "Akun belum siap dipakai. Hubungi operator sekolah.", 403);
    }

    profile = profileData as Partial<Profile>;
  }

  if (profile.role === "school") {
    const approvalStatus = profile.approval_status ?? "pending";

    if (approvalStatus === "pending") {
      return failClosedSignOut(supabase, "Akun menunggu verifikasi operator sekolah.", 403);
    }

    if (approvalStatus === "rejected") {
      return failClosedSignOut(supabase, "Akun ditolak. Hubungi admin atau operator sekolah.", 403);
    }
  }

  return NextResponse.json({
    user: data.user,
    profile,
  });
}
