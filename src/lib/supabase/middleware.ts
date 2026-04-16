import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildProtectedRedirectTarget } from "@/lib/userFlow";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const isLocalRequest =
    request.nextUrl.hostname === "localhost" ||
    request.nextUrl.hostname === "127.0.0.1";
  const e2eBypassEnabled =
    process.env.NODE_ENV !== "production" &&
    isLocalRequest &&
    (
      process.env.E2E_TEST_MODE === "1" ||
      request.cookies.get("masiang-e2e-bypass")?.value === "1"
    );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { pathname } = request.nextUrl;
  const isAdminDashboard =
    pathname === "/dashboard-admin" || pathname.startsWith("/dashboard-admin/");
  const isSchoolDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (!isSchoolDashboard && !isAdminDashboard) {
    return supabaseResponse;
  }

  if (e2eBypassEnabled) {
    return supabaseResponse;
  }

  let userId: string | null = null;
  let role: string | null = null;
  let approvalStatus: string | null = null;

  try {
    const result = await supabase.auth.getClaims();
    const claims = result.data?.claims as Record<string, unknown> | undefined;
    const appMetadata = claims?.app_metadata as Record<string, unknown> | undefined;

    userId = typeof claims?.sub === "string" ? claims.sub : null;
    role = typeof appMetadata?.role === "string" ? appMetadata.role : null;
    approvalStatus =
      typeof appMetadata?.approval_status === "string"
        ? appMetadata.approval_status
        : null;
  } catch {
    userId = null;
    role = null;
    approvalStatus = null;
  }

  if (!userId) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "redirectTo",
      buildProtectedRedirectTarget(pathname, request.nextUrl.search),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (
    !role ||
    (role === "school" && !approvalStatus)
  ) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, approval_status")
        .eq("id", userId)
        .single();
      role = profile?.role ?? null;
      approvalStatus = profile?.approval_status ?? null;
    } catch {
      role = null;
      approvalStatus = null;
    }
  }

  if (!role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "redirectTo",
      buildProtectedRedirectTarget(pathname, request.nextUrl.search),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminDashboard && role !== "admin") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === "school" ? "/dashboard/ringkasan" : "/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isSchoolDashboard && role === "school" && approvalStatus !== "approved") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "redirectTo",
      buildProtectedRedirectTarget(pathname, request.nextUrl.search),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (isSchoolDashboard && role !== "school") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === "admin" ? "/dashboard-admin" : "/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
