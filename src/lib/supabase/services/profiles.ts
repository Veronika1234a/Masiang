import { createClient } from "../client";
import type { SchoolProfile } from "../../userDashboardData";
import type { Database } from "../types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type SchoolApprovalStatus = "pending" | "approved" | "rejected";

export interface RegisteredSchoolProfile {
  id: string;
  schoolName: string;
  npsn: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  approvalStatus: SchoolApprovalStatus;
  approvalReviewedAt?: string;
  approvalReviewedBy?: string;
  approvalRejectionReason?: string;
}

function rowToSchoolProfile(row: ProfileRow): SchoolProfile {
  return {
    schoolName: row.school_name ?? "",
    npsn: row.npsn ?? "",
    contactName: row.contact_name ?? "",
    educationLevel: row.education_level ?? "",
    address: row.address ?? "",
    officialEmail: row.email,
    phone: row.phone ?? "",
    principalName: row.principal_name ?? "",
    operatorName: row.operator_name ?? "",
    district: row.district ?? "",
    avatarPath: row.avatar_path ?? undefined,
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
    approvalStatus: (row.approval_status as SchoolApprovalStatus | null) ?? "pending",
    approvalReviewedAt: row.approval_reviewed_at ?? undefined,
    approvalReviewedBy: row.approval_reviewed_by ?? undefined,
    approvalRejectionReason: row.approval_rejection_reason ?? undefined,
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
  if (updates.contactName !== undefined) payload.contact_name = updates.contactName;
  if (updates.educationLevel !== undefined) payload.education_level = updates.educationLevel;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.officialEmail !== undefined) payload.email = updates.officialEmail;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.principalName !== undefined) payload.principal_name = updates.principalName;
  if (updates.operatorName !== undefined) payload.operator_name = updates.operatorName;
  if (updates.district !== undefined) payload.district = updates.district;
  if (updates.avatarPath !== undefined) payload.avatar_path = updates.avatarPath ?? null;

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

export async function updateSchoolApprovalStatus(
  userId: string,
  approvalStatus: SchoolApprovalStatus,
  reviewerId: string,
  rejectionReason?: string,
): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      approval_status: approvalStatus,
      approval_reviewed_at: new Date().toISOString(),
      approval_reviewed_by: reviewerId,
      approval_rejection_reason: approvalStatus === "rejected" ? (rejectionReason ?? "") : null,
    })
    .eq("id", userId)
    .eq("role", "school")
    .select("id, approval_status, approval_reviewed_at, approval_reviewed_by, approval_rejection_reason")
    .single();

  if (error) {
    throw error;
  }

  if (
    !data ||
    data.approval_status !== approvalStatus ||
    !data.approval_reviewed_at ||
    data.approval_reviewed_by !== reviewerId ||
    (approvalStatus === "rejected" && !data.approval_rejection_reason)
  ) {
    throw new Error("Status akun sekolah belum tersimpan. Coba lagi atau cek koneksi Supabase.");
  }
}
