import { createClient } from "../client";
import type { SchoolProfile } from "../../userDashboardData";
import type { Database } from "../types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface RegisteredSchoolProfile {
  id: string;
  schoolName: string;
  npsn: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

function rowToSchoolProfile(row: ProfileRow): SchoolProfile {
  return {
    schoolName: row.school_name ?? "",
    npsn: row.npsn ?? "",
    educationLevel: row.education_level ?? "",
    address: row.address ?? "",
    officialEmail: row.email,
    phone: row.phone ?? "",
    principalName: row.principal_name ?? "",
    operatorName: row.operator_name ?? "",
    district: row.district ?? "",
  };
}

function rowToRegisteredSchool(row: ProfileRow): RegisteredSchoolProfile {
  return {
    id: row.id,
    schoolName: row.school_name ?? "",
    npsn: row.npsn ?? "",
    contactName: row.contact_name ?? "",
    email: row.email,
    phone: row.phone ?? "",
    address: row.address ?? "",
  };
}

export async function fetchProfile(
  userId: string,
): Promise<SchoolProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return rowToSchoolProfile(data as ProfileRow);
}

export async function updateProfile(
  userId: string,
  updates: Partial<SchoolProfile>,
): Promise<void> {
  const supabase = createClient();

  const payload: Record<string, unknown> = {};
  if (updates.schoolName !== undefined) payload.school_name = updates.schoolName;
  if (updates.npsn !== undefined) payload.npsn = updates.npsn;
  if (updates.educationLevel !== undefined) payload.education_level = updates.educationLevel;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.officialEmail !== undefined) payload.email = updates.officialEmail;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.principalName !== undefined) payload.principal_name = updates.principalName;
  if (updates.operatorName !== undefined) payload.operator_name = updates.operatorName;
  if (updates.district !== undefined) payload.district = updates.district;

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  if (error) throw error;
}

export async function fetchAllSchoolProfiles(): Promise<
  RegisteredSchoolProfile[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "school")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ProfileRow[]).map(rowToRegisteredSchool);
}

export async function fetchAdminUserIds(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (error) throw error;
  return (data ?? [])
    .map((row) => row.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}
