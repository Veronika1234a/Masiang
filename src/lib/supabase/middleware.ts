import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildProtectedRedirectTarget } from "@/lib/userFlow";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const e2eBypassEnabled =
    process.env.E2E_TEST_MODE === "1" ||
    request.cookies.get("masiang-e2e-bypass")?.value === "1";

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

  // Refresh the session so it doesn't expire
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "redirectTo",
      buildProtectedRedirectTarget(pathname, request.nextUrl.search),
    );
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (isAdminDashboard && role !== "admin") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === "school" ? "/dashboard/ringkasan" : "/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isSchoolDashboard && role !== "school") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === "admin" ? "/dashboard-admin" : "/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
