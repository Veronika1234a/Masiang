import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SchoolApprovalStatus } from "@/lib/supabase/services/profiles";

interface ApprovalRequest {
  schoolId?: string;
  approvalStatus?: SchoolApprovalStatus;
  rejectionReason?: string;
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

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { ok: false as const, error: "Hanya admin yang bisa memverifikasi akun sekolah.", status: 403 };
  }

  return { ok: true as const, userId: user.id };
}

export async function POST(request: Request) {
  const adminCheck = await ensureAdmin();
  if (!adminCheck.ok) {
    return jsonError(adminCheck.error, adminCheck.status);
  }

  let body: ApprovalRequest;
  try {
    body = (await request.json()) as ApprovalRequest;
  } catch {
    return jsonError("Payload verifikasi akun tidak valid.");
  }

  if (!body.schoolId || !body.approvalStatus) {
    return jsonError("ID sekolah dan status verifikasi wajib diisi.");
  }

  if (!["approved", "rejected"].includes(body.approvalStatus)) {
    return jsonError("Status verifikasi tidak valid.");
  }

  const reason = body.rejectionReason?.trim() ?? "";
  if (body.approvalStatus === "rejected" && !reason) {
    return jsonError("Alasan penolakan wajib diisi.");
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .update({
      approval_status: body.approvalStatus,
      approval_reviewed_at: new Date().toISOString(),
      approval_reviewed_by: adminCheck.userId,
      approval_rejection_reason: body.approvalStatus === "rejected" ? reason : null,
    })
    .eq("id", body.schoolId)
    .eq("role", "school")
    .select("id, approval_status, approval_reviewed_at, approval_reviewed_by, approval_rejection_reason")
    .single();

  if (error) {
    return jsonError("Gagal memperbarui status akun sekolah.", 500);
  }

  if (
    !data ||
    data.approval_status !== body.approvalStatus ||
    !data.approval_reviewed_at ||
    data.approval_reviewed_by !== adminCheck.userId ||
    (body.approvalStatus === "rejected" && !data.approval_rejection_reason)
  ) {
    return jsonError("Status akun sekolah belum tersimpan. Coba lagi.", 500);
  }

  return NextResponse.json({ school: data });
}
