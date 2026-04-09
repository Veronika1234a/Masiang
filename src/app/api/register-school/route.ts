import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RegisterSchoolRequest {
  email?: string;
  password?: string;
  schoolName?: string;
  npsn?: string;
  contactName?: string;
  phone?: string;
  address?: string;
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: RegisterSchoolRequest;

  try {
    body = (await request.json()) as RegisterSchoolRequest;
  } catch {
    return badRequest("Payload registrasi tidak valid.");
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  const schoolName = body.schoolName?.trim();
  const npsn = body.npsn?.trim();
  const contactName = body.contactName?.trim();
  const phone = body.phone?.trim();
  const address = body.address?.trim();

  if (!email || !password || !schoolName || !npsn || !contactName || !phone || !address) {
    return badRequest("Data registrasi belum lengkap.");
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return badRequest("Registrasi server belum siap. Hubungi admin sistem.", 500);
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "school",
      school_name: schoolName,
      npsn,
      contact_name: contactName,
      phone,
      address,
    },
  });

  if (error) {
    const normalized = error.message.toLowerCase();
    if (normalized.includes("already") || normalized.includes("registered")) {
      return badRequest("Email ini sudah terdaftar. Silakan login atau hubungi operator sekolah.", 409);
    }

    return badRequest(error.message || "Registrasi gagal.", 500);
  }

  return NextResponse.json(
    {
      userId: data.user?.id ?? null,
      email,
      status: "pending",
    },
    { status: 201 },
  );
}
