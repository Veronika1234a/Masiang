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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  let body: RegisterSchoolRequest;

  try {
    body = (await request.json()) as RegisterSchoolRequest;
  } catch {
    return badRequest("Payload registrasi tidak valid.");
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const schoolName = body.schoolName?.trim();
  const npsn = body.npsn?.trim();
  const contactName = body.contactName?.trim();
  const phone = body.phone?.trim();
  const address = body.address?.trim();

  if (!email || !password || !schoolName || !npsn || !contactName || !phone || !address) {
    return badRequest("Data registrasi belum lengkap.");
  }

  if (!isValidEmail(email)) {
    return badRequest("Format email tidak valid.");
  }

  if (!/^\d{8}$/.test(npsn)) {
    return badRequest("NPSN harus 8 digit angka.");
  }

  if (password.length < 8) {
    return badRequest("Password minimal 8 karakter.");
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return badRequest("Registrasi server belum siap. Hubungi admin sistem.", 500);
  }

  const ipAddress = getClientIp(request);
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [ipAttempts, emailAttempts, npsnAttempts] = await Promise.all([
    adminClient
      .from("registration_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ipAddress)
      .gte("created_at", windowStart),
    adminClient
      .from("registration_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", windowStart),
    adminClient
      .from("registration_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("npsn", npsn)
      .gte("created_at", windowStart),
  ]);

  if (ipAttempts.error || emailAttempts.error || npsnAttempts.error) {
    return badRequest("Registrasi server belum siap. Hubungi admin sistem.", 500);
  }

  if (
    (ipAttempts.count ?? 0) >= 10 ||
    (emailAttempts.count ?? 0) >= 3 ||
    (npsnAttempts.count ?? 0) >= 3
  ) {
    return badRequest("Terlalu banyak percobaan registrasi. Coba lagi nanti.", 429);
  }

  const { error: rateLimitInsertError } = await adminClient
    .from("registration_rate_limits")
    .insert({
      ip_address: ipAddress,
      email,
      npsn,
    });

  if (rateLimitInsertError) {
    return badRequest("Registrasi server belum siap. Hubungi admin sistem.", 500);
  }

  const { data: existingEmailProfile, error: existingEmailError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingEmailError) {
    return badRequest("Gagal memvalidasi email sekolah. Coba lagi.", 500);
  }

  if (existingEmailProfile) {
    return badRequest("Email ini sudah terdaftar. Silakan login atau hubungi operator sekolah.", 409);
  }

  const { data: existingNpsnProfile, error: existingNpsnError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("npsn", npsn)
    .maybeSingle();

  if (existingNpsnError) {
    return badRequest("Gagal memvalidasi NPSN sekolah. Coba lagi.", 500);
  }

  if (existingNpsnProfile) {
    return badRequest("NPSN ini sudah terdaftar. Silakan login atau hubungi operator sekolah.", 409);
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      role: "school",
      approval_status: "pending",
    },
    user_metadata: {
      role: "school",
      approval_status: "pending",
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

    if (normalized.includes("database error") || error.code === "unexpected_failure") {
      return badRequest("Registrasi gagal karena data sekolah bentrok atau database belum sinkron. Periksa email/NPSN atau hubungi admin sistem.", 500);
    }

    return badRequest(error.message || "Registrasi gagal.", 500);
  }

  const userId = data.user?.id;
  if (!userId) {
    return badRequest("Registrasi gagal membuat akun sekolah.", 500);
  }

  const { data: createdProfile, error: profileCheckError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileCheckError) {
    await adminClient.auth.admin.deleteUser(userId).catch(() => null);
    return badRequest("Registrasi gagal memvalidasi profil sekolah.", 500);
  }

  if (!createdProfile) {
    const { error: insertProfileError } = await adminClient
      .from("profiles")
      .insert({
        id: userId,
        role: "school",
        approval_status: "pending",
        school_name: schoolName,
        npsn,
        contact_name: contactName,
        email,
        phone,
        address,
      });

    if (insertProfileError) {
      await adminClient.auth.admin.deleteUser(userId).catch(() => null);
      return badRequest("Registrasi gagal membuat profil sekolah. Hubungi admin sistem.", 500);
    }
  }

  return NextResponse.json(
    {
      userId,
      email,
      status: "pending",
    },
    { status: 201 },
  );
}
