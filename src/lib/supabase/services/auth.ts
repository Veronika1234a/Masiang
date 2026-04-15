import type { User } from "@supabase/supabase-js";
import { createClient } from "../client";
import type { Database } from "../types";
import type { SchoolApprovalStatus } from "./profiles";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface SignUpPayload {
  email: string;
  password: string;
  schoolName: string;
  npsn: string;
  contactName: string;
  phone: string;
  address: string;
}

function mapAuthErrorMessage(message?: string | null) {
  const normalized = (message ?? "").toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "Akun belum bisa digunakan. Pastikan verifikasi email dinonaktifkan dan tunggu persetujuan operator sekolah.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Email atau kata sandi tidak cocok.";
  }

  if (normalized.includes("user already registered")) {
    return "Email ini sudah terdaftar. Silakan login atau hubungi operator sekolah.";
  }

  if (normalized.includes("signup is disabled")) {
    return "Registrasi sedang dinonaktifkan sementara.";
  }

  if (normalized.includes("email rate limit exceeded")) {
    return "Terlalu banyak permintaan email. Coba lagi beberapa saat.";
  }

  return message ?? "Terjadi kesalahan autentikasi.";
}

function getApprovalStatus(profile: Profile | null): SchoolApprovalStatus {
  return (profile?.approval_status as SchoolApprovalStatus | null) ?? "pending";
}

async function fetchProfileRecord(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}

async function blockSchoolSession(
  message: string,
): Promise<{ user: null; profile: null; error: string }> {
  const supabase = createClient();
  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (signOutError || session) {
    return {
      user: null,
      profile: null,
      error: "Akun belum aktif dan sesi gagal dibersihkan. Tutup browser lalu coba lagi, atau hubungi admin.",
    };
  }

  return { user: null, profile: null, error: message };
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { user: null, profile: null, error: mapAuthErrorMessage(error.message) };
  if (!data.user) return { user: null, profile: null, error: "Terjadi kesalahan autentikasi." };

  const profile = await fetchProfileRecord(supabase, data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    return {
      user: null,
      profile: null,
      error: "Akun belum siap dipakai. Hubungi operator sekolah.",
    };
  }

  if (profile.role === "school") {
    const approvalStatus = getApprovalStatus(profile);

    if (approvalStatus === "pending") {
      return blockSchoolSession("Akun menunggu verifikasi operator sekolah.");
    }

    if (approvalStatus === "rejected") {
      return blockSchoolSession("Akun ditolak. Hubungi admin atau operator sekolah.");
    }
  }

  return { user: data.user, profile, error: null };
}

export async function signUp(payload: SignUpPayload) {
  if (process.env.NEXT_PUBLIC_E2E_TEST_MODE !== "1") {
    const response = await fetch("/api/register-school", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      return { user: null, error: mapAuthErrorMessage(body?.error) };
    }

    return { user: null, error: null };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        role: "school",
        school_name: payload.schoolName,
        npsn: payload.npsn,
        contact_name: payload.contactName,
        phone: payload.phone,
        address: payload.address,
      },
    },
  });
  if (error) return { user: null, error: mapAuthErrorMessage(error.message) };
  return { user: data.user, error: null };
}

export async function resendSignupVerification(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  return { error: error ? mapAuthErrorMessage(error.message) : null };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return { error: "Sesi login tidak valid. Silakan login ulang." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return { error: "Kata sandi saat ini tidak sesuai." };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { error: error?.message ?? null };
}

export async function updateUserMetadata(
  updates: Record<string, unknown>,
): Promise<{ user: User | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}

export async function updateEmail(
  nextEmail: string,
): Promise<{ user: User | null; error: string | null; emailChanged: boolean }> {
  const supabase = createClient();
  const normalizedEmail = nextEmail.trim().toLowerCase();
  const { data, error } = await supabase.auth.updateUser({
    email: normalizedEmail,
  });

  if (error) {
    return { user: null, error: mapAuthErrorMessage(error.message), emailChanged: false };
  }

  return {
    user: data.user,
    error: null,
    emailChanged: (data.user?.email ?? "").toLowerCase() === normalizedEmail,
  };
}

export async function getSession() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  return fetchProfileRecord(supabase, userId);
}

export function onAuthStateChange(
  callback: (event: string, session: unknown) => void,
) {
  const supabase = createClient();
  return supabase.auth.onAuthStateChange(callback);
}
