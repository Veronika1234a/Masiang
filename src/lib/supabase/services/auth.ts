import { createClient } from "../client";
import type { Database } from "../types";

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

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signUp(payload: SignUpPayload) {
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
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
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
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}

export function onAuthStateChange(
  callback: (event: string, session: unknown) => void,
) {
  const supabase = createClient();
  return supabase.auth.onAuthStateChange(callback);
}
