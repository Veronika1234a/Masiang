import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  createClient,
  type PostgrestError,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/types";
import { getNotificationHref } from "../src/lib/userFlow";
import type { Notification } from "../src/lib/userDashboardData";

type TypedClient = SupabaseClient<Database>;

const requiredRealEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_TEST_SCHOOL_EMAIL",
  "SUPABASE_TEST_SCHOOL_PASSWORD",
  "SUPABASE_TEST_ADMIN_EMAIL",
  "SUPABASE_TEST_ADMIN_PASSWORD",
] as const;

interface SignedInClient {
  client: TypedClient;
  userId: string;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function futureDateISO(daysAhead: number): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function createAnonClient(url: string, anonKey: string): TypedClient {
  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function createServiceClient(url: string, serviceRoleKey: string): TypedClient {
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

async function signInWithPassword(
  url: string,
  anonKey: string,
  email: string,
  password: string,
): Promise<SignedInClient> {
  const client = createAnonClient(url, anonKey);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error(`Gagal login user ${email}: ${error?.message ?? "unknown error"}`);
  }

  return {
    client,
    userId: data.user.id,
  };
}

async function waitForProfile(
  serviceClient: TypedClient,
  userId: string,
  timeoutMs = 10_000,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const { data, error } = await serviceClient
      .from("profiles")
      .select("id, role, school_name")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      return data;
    }

    await wait(300);
  }

  throw new Error(`Profile untuk user ${userId} tidak ditemukan dalam ${timeoutMs}ms`);
}

async function waitForNotification(
  client: TypedClient,
  referenceId: string,
  type: string,
  timeoutMs = 12_000,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const { data, error } = await client
      .from("notifications")
      .select("id, type, reference_id")
      .eq("reference_id", referenceId)
      .eq("type", type)
      .limit(1);

    if (error) {
      throw new Error(
        `Gagal memeriksa notifikasi ${type} untuk ${referenceId}: ${error.message}`,
      );
    }

    if ((data?.length ?? 0) > 0) {
      return data[0];
    }

    await wait(350);
  }

  throw new Error(
    `Notifikasi ${type} untuk reference ${referenceId} tidak muncul dalam ${timeoutMs}ms`,
  );
}

function assertConflictError(error: PostgrestError | null) {
  assert.ok(error, "Expected a conflict error but request succeeded.");
  const isConflict =
    error.code === "23505" ||
    error.message.toLowerCase().includes("bookings_active_slot_unique");
  assert.ok(
    isConflict,
    `Expected unique conflict 23505/bookings_active_slot_unique, got: ${error.message}`,
  );
}

function readRealSupabaseEnv() {
  const missing = requiredRealEnv.filter((key) => !process.env[key]);
  assert.equal(
    missing.length,
    0,
    `Missing required env for real Supabase validation: ${missing.join(", ")}`,
  );

  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    schoolEmail: process.env.SUPABASE_TEST_SCHOOL_EMAIL!,
    schoolPassword: process.env.SUPABASE_TEST_SCHOOL_PASSWORD!,
    adminEmail: process.env.SUPABASE_TEST_ADMIN_EMAIL!,
    adminPassword: process.env.SUPABASE_TEST_ADMIN_PASSWORD!,
  };
}

const realModeEnabled = process.env.REAL_SUPABASE_TEST_MODE === "1";

if (!realModeEnabled) {
  test(
    "real supabase validation (skipped)",
    { skip: "Set REAL_SUPABASE_TEST_MODE=1 to run this suite against staging Supabase." },
    () => {},
  );
} else {
  test(
    "real Supabase validation: RLS, triggers, signed URL, race conflict, session longevity",
    { timeout: 180_000 },
    async () => {
      const {
        supabaseUrl,
        anonKey,
        serviceRoleKey,
        schoolEmail,
        schoolPassword,
        adminEmail,
        adminPassword,
      } = readRealSupabaseEnv();

      const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey);
      const runTag = `RT${Date.now().toString(36).toUpperCase()}`;
      const bookingBaseOffset = 365 + (Date.now() % 90);
      const bookingPrimaryDate = futureDateISO(bookingBaseOffset);
      const bookingSecondaryDate = futureDateISO(bookingBaseOffset + 1);
      const bookingRaceDate = futureDateISO(bookingBaseOffset + 40);
      const secondarySchoolEmail = `qa-school-${runTag.toLowerCase()}@example.test`;
      const secondarySchoolPassword = `Qa!${randomUUID().slice(0, 12)}A1`;

      const bookingIds: string[] = [];
      const documentIds: string[] = [];
      const notificationReferenceIds: string[] = [];
      const storagePaths: string[] = [];

      let secondarySchoolId: string | null = null;
      let school: SignedInClient | null = null;
      let schoolSecondary: SignedInClient | null = null;
      let admin: SignedInClient | null = null;

      try {
        school = await signInWithPassword(supabaseUrl, anonKey, schoolEmail, schoolPassword);
        admin = await signInWithPassword(supabaseUrl, anonKey, adminEmail, adminPassword);

        const schoolProfile = await waitForProfile(serviceClient, school.userId);
        assert.equal(
          schoolProfile.role,
          "school",
          `SUPABASE_TEST_SCHOOL_EMAIL harus role 'school', saat ini '${schoolProfile.role}'.`,
        );

        const adminProfile = await waitForProfile(serviceClient, admin.userId);
        assert.equal(
          adminProfile.role,
          "admin",
          `SUPABASE_TEST_ADMIN_EMAIL harus role 'admin', saat ini '${adminProfile.role}'.`,
        );

        const createSecondary = await serviceClient.auth.admin.createUser({
          email: secondarySchoolEmail,
          password: secondarySchoolPassword,
          email_confirm: true,
          user_metadata: {
            role: "school",
            school_name: `QA School ${runTag}`,
            npsn: `9${Date.now().toString().slice(-7)}`,
            contact_name: "QA Bot",
            phone: "081234567899",
            address: "Jl. QA Integration",
          },
        });
        assert.ifError(createSecondary.error);
        assert.ok(createSecondary.data.user, "Secondary school user was not created.");
        secondarySchoolId = createSecondary.data.user.id;

        const secondaryProfile = await waitForProfile(serviceClient, secondarySchoolId);
        assert.equal(secondaryProfile.role, "school");

        schoolSecondary = await signInWithPassword(
          supabaseUrl,
          anonKey,
          secondarySchoolEmail,
          secondarySchoolPassword,
        );

        const primarySchoolName = schoolProfile.school_name ?? "School QA Primary";
        const secondarySchoolName = secondaryProfile.school_name ?? "School QA Secondary";

        const bookingPrimaryId = `BK-RLS-A-${runTag}`;
        const bookingSecondaryId = `BK-RLS-B-${runTag}`;
        bookingIds.push(bookingPrimaryId, bookingSecondaryId);
        notificationReferenceIds.push(bookingPrimaryId, bookingSecondaryId);

        const bookingPrimaryInsert = await school.client
          .from("bookings")
          .insert({
            id: bookingPrimaryId,
            school_id: school.userId,
            school_name: primarySchoolName,
            topic: `RLS primary ${runTag}`,
            category: "Pendampingan",
            date_iso: bookingPrimaryDate,
            session: "09.00 - 12.00 WITA",
            status: "Menunggu",
            timeline: [],
            goal: "RLS validation primary",
            notes: "QA insertion primary",
          })
          .select("id")
          .single();
        assert.ifError(bookingPrimaryInsert.error);

        const bookingSecondaryInsert = await schoolSecondary.client
          .from("bookings")
          .insert({
            id: bookingSecondaryId,
            school_id: schoolSecondary.userId,
            school_name: secondarySchoolName,
            topic: `RLS secondary ${runTag}`,
            category: "Supervisi",
            date_iso: bookingSecondaryDate,
            session: "08.00 - 10.00 WITA",
            status: "Menunggu",
            timeline: [],
            goal: "RLS validation secondary",
            notes: "QA insertion secondary",
          })
          .select("id")
          .single();
        assert.ifError(bookingSecondaryInsert.error);

        const schoolVisibleBookings = await school.client
          .from("bookings")
          .select("id, school_id")
          .in("id", [bookingPrimaryId, bookingSecondaryId]);
        assert.ifError(schoolVisibleBookings.error);
        const schoolVisibleIds = new Set((schoolVisibleBookings.data ?? []).map((row) => row.id));
        assert.ok(schoolVisibleIds.has(bookingPrimaryId), "School cannot read its own booking.");
        assert.ok(
          !schoolVisibleIds.has(bookingSecondaryId),
          "School can read another school's booking (RLS broken).",
        );

        const secondaryVisibleBookings = await schoolSecondary.client
          .from("bookings")
          .select("id, school_id")
          .in("id", [bookingPrimaryId, bookingSecondaryId]);
        assert.ifError(secondaryVisibleBookings.error);
        const secondaryVisibleIds = new Set(
          (secondaryVisibleBookings.data ?? []).map((row) => row.id),
        );
        assert.ok(
          secondaryVisibleIds.has(bookingSecondaryId),
          "Secondary school cannot read its own booking.",
        );
        assert.ok(
          !secondaryVisibleIds.has(bookingPrimaryId),
          "Secondary school can read primary school booking (RLS broken).",
        );

        const adminVisibleBookings = await admin.client
          .from("bookings")
          .select("id, school_id")
          .in("id", [bookingPrimaryId, bookingSecondaryId]);
        assert.ifError(adminVisibleBookings.error);
        const adminVisibleIds = new Set((adminVisibleBookings.data ?? []).map((row) => row.id));
        assert.ok(
          adminVisibleIds.has(bookingPrimaryId) && adminVisibleIds.has(bookingSecondaryId),
          "Admin cannot read all target bookings.",
        );

        const illegalUpdateAttempt = await school.client
          .from("bookings")
          .update({ status: "Disetujui" })
          .eq("id", bookingSecondaryId)
          .select("id, status");
        assert.ifError(illegalUpdateAttempt.error);
        assert.equal(
          illegalUpdateAttempt.data?.length ?? 0,
          0,
          "School unexpectedly updated another school's booking.",
        );

        const secondaryAfterIllegalUpdate = await serviceClient
          .from("bookings")
          .select("status")
          .eq("id", bookingSecondaryId)
          .single();
        assert.ifError(secondaryAfterIllegalUpdate.error);
        assert.equal(
          secondaryAfterIllegalUpdate.data.status,
          "Menunggu",
          "Illegal cross-school booking update changed target status.",
        );

        await waitForNotification(admin.client, bookingPrimaryId, "booking_created");

        const cancelPrimaryBooking = await school.client
          .from("bookings")
          .update({
            status: "Dibatalkan",
            cancel_reason: `QA cancel ${runTag}`,
          })
          .eq("id", bookingPrimaryId)
          .select("id")
          .single();
        assert.ifError(cancelPrimaryBooking.error);

        await waitForNotification(admin.client, bookingPrimaryId, "booking_cancelled");

        const documentId = `DOC-TRG-${runTag}`;
        documentIds.push(documentId);
        notificationReferenceIds.push(documentId);
        const documentInsert = await school.client
          .from("documents")
          .insert({
            id: documentId,
            school_id: school.userId,
            booking_id: null,
            history_id: null,
            file_name: `qa-${runTag}.pdf`,
            storage_path: null,
            file_size: 1024,
            mime_type: "application/pdf",
            stage: "Laporan",
            review_status: "Menunggu Review",
            reviewer_notes: null,
            version: 1,
            parent_doc_id: null,
            uploaded_at: "17 Maret 2026",
          })
          .select("id")
          .single();
        assert.ifError(documentInsert.error);

        await waitForNotification(admin.client, documentId, "doc_uploaded");

        const storagePath = `${school.userId}/${runTag}/qa-storage.txt`;
        storagePaths.push(storagePath);
        const uploadResult = await school.client.storage
          .from("school-documents")
          .upload(
            storagePath,
            new Blob([`real-supabase-validation ${runTag}`], { type: "text/plain" }),
            {
              upsert: true,
              contentType: "text/plain",
            },
          );
        assert.ifError(uploadResult.error);

        const schoolSignedUrl = await school.client.storage
          .from("school-documents")
          .createSignedUrl(storagePath, 120);
        assert.ifError(schoolSignedUrl.error);
        assert.ok(
          schoolSignedUrl.data?.signedUrl?.includes("/storage/v1/object/sign/school-documents/"),
          "School signed URL did not contain expected storage path.",
        );

        const adminSignedUrl = await admin.client.storage
          .from("school-documents")
          .createSignedUrl(storagePath, 120);
        assert.ifError(adminSignedUrl.error);
        assert.ok(adminSignedUrl.data?.signedUrl, "Admin failed to generate signed URL.");

        const secondarySignedUrl = await schoolSecondary.client.storage
          .from("school-documents")
          .createSignedUrl(storagePath, 120);
        assert.ok(
          secondarySignedUrl.error,
          "Secondary school can generate signed URL for another school's file (RLS broken).",
        );

        const raceDate = bookingRaceDate;
        const raceSession = "10.00 - 12.00 WITA";
        const raceBookingPrimaryId = `BK-RACE-A-${runTag}`;
        const raceBookingSecondaryId = `BK-RACE-B-${runTag}`;
        bookingIds.push(raceBookingPrimaryId, raceBookingSecondaryId);
        notificationReferenceIds.push(raceBookingPrimaryId, raceBookingSecondaryId);

        const [racePrimary, raceSecondary] = await Promise.all([
          school.client
            .from("bookings")
            .insert({
              id: raceBookingPrimaryId,
              school_id: school.userId,
              school_name: primarySchoolName,
              topic: `Race primary ${runTag}`,
              category: "Workshop",
              date_iso: raceDate,
              session: raceSession,
              status: "Menunggu",
              timeline: [],
              goal: "Race condition check primary",
              notes: "Race test primary",
            })
            .select("id")
            .single(),
          schoolSecondary.client
            .from("bookings")
            .insert({
              id: raceBookingSecondaryId,
              school_id: schoolSecondary.userId,
              school_name: secondarySchoolName,
              topic: `Race secondary ${runTag}`,
              category: "Workshop",
              date_iso: raceDate,
              session: raceSession,
              status: "Menunggu",
              timeline: [],
              goal: "Race condition check secondary",
              notes: "Race test secondary",
            })
            .select("id")
            .single(),
        ]);

        const raceResults = [racePrimary, raceSecondary];
        const raceSuccess = raceResults.filter((result) => !result.error);
        const raceFailure = raceResults.filter((result) => result.error);
        assert.equal(
          raceSuccess.length,
          1,
          "Booking race test should have exactly one successful insert.",
        );
        assert.equal(
          raceFailure.length,
          1,
          "Booking race test should have exactly one failed insert.",
        );
        assertConflictError(raceFailure[0].error);

        const sessionBeforeRefresh = await school.client.auth.getSession();
        assert.ifError(sessionBeforeRefresh.error);
        assert.ok(sessionBeforeRefresh.data.session, "Primary school session missing before refresh.");

        await wait(1_200);

        const refreshedSession = await school.client.auth.refreshSession();
        assert.ifError(refreshedSession.error);
        assert.ok(refreshedSession.data.session, "Refresh token did not return a session.");

        const secondTabClient = createAnonClient(supabaseUrl, anonKey);
        const copiedSession = refreshedSession.data.session!;
        const setSessionResult = await secondTabClient.auth.setSession({
          access_token: copiedSession.access_token,
          refresh_token: copiedSession.refresh_token,
        });
        assert.ifError(setSessionResult.error);

        const logoutResult = await school.client.auth.signOut({ scope: "global" });
        assert.ifError(logoutResult.error);
        await wait(500);

        const secondTabRefreshResult = await secondTabClient.auth.refreshSession();
        assert.ok(
          secondTabRefreshResult.error || !secondTabRefreshResult.data.session,
          "Session still refreshable after global logout (multi-tab invalidation failed).",
        );
      } finally {
        await Promise.allSettled([
          school?.client.auth.signOut({ scope: "local" }),
          schoolSecondary?.client.auth.signOut({ scope: "local" }),
          admin?.client.auth.signOut({ scope: "local" }),
        ]);

        if (documentIds.length > 0) {
          await serviceClient.from("documents").delete().in("id", documentIds);
        }

        if (bookingIds.length > 0) {
          await serviceClient.from("bookings").delete().in("id", bookingIds);
        }

        if (notificationReferenceIds.length > 0) {
          await serviceClient
            .from("notifications")
            .delete()
            .in("reference_id", Array.from(new Set(notificationReferenceIds)));
        }

        if (storagePaths.length > 0) {
          await serviceClient.storage.from("school-documents").remove(storagePaths);
        }

        if (secondarySchoolId) {
          await serviceClient.auth.admin.deleteUser(secondarySchoolId);
        }
      }
    },
  );

  test(
    "real Supabase notification flow: admin actions emit correct type, reference, and deep-link",
    { timeout: 150_000 },
    async () => {
      const {
        supabaseUrl,
        anonKey,
        serviceRoleKey,
        schoolEmail,
        schoolPassword,
        adminEmail,
        adminPassword,
      } = readRealSupabaseEnv();

      const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey);
      const runTag = `NTF${Date.now().toString(36).toUpperCase()}`;
      const notificationBaseOffset = 550 + (Date.now() % 60);
      const notificationApproveDate = futureDateISO(notificationBaseOffset);
      const notificationRejectDate = futureDateISO(notificationBaseOffset + 1);

      const bookingIds: string[] = [];
      const documentIds: string[] = [];
      const notificationIds: string[] = [];
      const notificationReferenceIds: string[] = [];

      let school: SignedInClient | null = null;
      let admin: SignedInClient | null = null;

      try {
        school = await signInWithPassword(supabaseUrl, anonKey, schoolEmail, schoolPassword);
        admin = await signInWithPassword(supabaseUrl, anonKey, adminEmail, adminPassword);

        const schoolProfile = await waitForProfile(serviceClient, school.userId);
        const adminProfile = await waitForProfile(serviceClient, admin.userId);
        assert.equal(schoolProfile.role, "school");
        assert.equal(adminProfile.role, "admin");

        const schoolName = schoolProfile.school_name ?? "School QA Notification";

        const bookingApproveId = `BK-NTF-A-${runTag}`;
        const bookingRejectId = `BK-NTF-R-${runTag}`;
        bookingIds.push(bookingApproveId, bookingRejectId);
        notificationReferenceIds.push(bookingApproveId, bookingRejectId);

        const createApproveBooking = await school.client
          .from("bookings")
          .insert({
            id: bookingApproveId,
            school_id: school.userId,
            school_name: schoolName,
            topic: `Flow approve ${runTag}`,
            category: "Pendampingan",
            date_iso: notificationApproveDate,
            session: "08.30 - 11.30 WITA",
            status: "Menunggu",
            timeline: [],
            goal: "Flow approve/start/complete",
            notes: "QA notification flow",
          })
          .select("id")
          .single();
        assert.ifError(createApproveBooking.error);

        const createRejectBooking = await school.client
          .from("bookings")
          .insert({
            id: bookingRejectId,
            school_id: school.userId,
            school_name: schoolName,
            topic: `Flow reject ${runTag}`,
            category: "Supervisi",
            date_iso: notificationRejectDate,
            session: "09.00 - 12.00 WITA",
            status: "Menunggu",
            timeline: [],
            goal: "Flow reject",
            notes: "QA reject flow",
          })
          .select("id")
          .single();
        assert.ifError(createRejectBooking.error);

        const documentId = `DOC-NTF-${runTag}`;
        documentIds.push(documentId);
        notificationReferenceIds.push(documentId);
        const createDoc = await school.client
          .from("documents")
          .insert({
            id: documentId,
            school_id: school.userId,
            booking_id: bookingApproveId,
            history_id: null,
            file_name: `notif-flow-${runTag}.pdf`,
            storage_path: null,
            file_size: 2_048,
            mime_type: "application/pdf",
            stage: "Pelaksanaan",
            review_status: "Menunggu Review",
            reviewer_notes: null,
            version: 1,
            parent_doc_id: null,
            uploaded_at: "18 Maret 2026",
          })
          .select("id")
          .single();
        assert.ifError(createDoc.error);

        const approveAction = await admin.client
          .from("bookings")
          .update({ status: "Disetujui" })
          .eq("id", bookingApproveId)
          .eq("status", "Menunggu")
          .select("id")
          .single();
        assert.ifError(approveAction.error);

        const startAction = await admin.client
          .from("bookings")
          .update({ status: "Dalam Proses" })
          .eq("id", bookingApproveId)
          .eq("status", "Disetujui")
          .select("id")
          .single();
        assert.ifError(startAction.error);

        const completeAction = await admin.client
          .from("bookings")
          .update({ status: "Selesai" })
          .eq("id", bookingApproveId)
          .eq("status", "Dalam Proses")
          .select("id")
          .single();
        assert.ifError(completeAction.error);

        const rejectAction = await admin.client
          .from("bookings")
          .update({ status: "Ditolak", cancel_reason: `Jadwal bentrok ${runTag}` })
          .eq("id", bookingRejectId)
          .eq("status", "Menunggu")
          .select("id")
          .single();
        assert.ifError(rejectAction.error);

        const reviewApprovedAction = await admin.client
          .from("documents")
          .update({ review_status: "Disetujui", reviewer_notes: "Dokumen valid." })
          .eq("id", documentId)
          .select("id")
          .single();
        assert.ifError(reviewApprovedAction.error);

        const reviewRevisionAction = await admin.client
          .from("documents")
          .update({ review_status: "Perlu Revisi", reviewer_notes: "Tambahkan lampiran eviden." })
          .eq("id", documentId)
          .select("id")
          .single();
        assert.ifError(reviewRevisionAction.error);

        const adminFlowNotifs = [
          {
            id: `NTF-APP-${runTag}`,
            title: "Booking Disetujui",
            message: `Booking ${bookingApproveId} telah disetujui oleh admin.`,
            type: "booking_approved",
            referenceId: bookingApproveId,
            referenceType: "booking",
          },
          {
            id: `NTF-START-${runTag}`,
            title: "Sesi Dimulai",
            message: `Sesi pendampingan ${bookingApproveId} telah dimulai.`,
            type: "booking_started",
            referenceId: bookingApproveId,
            referenceType: "booking",
          },
          {
            id: `NTF-DONE-${runTag}`,
            title: "Sesi Selesai",
            message: `Booking ${bookingApproveId} telah selesai.`,
            type: "booking_completed",
            referenceId: bookingApproveId,
            referenceType: "booking",
          },
          {
            id: `NTF-REJ-${runTag}`,
            title: "Booking Ditolak",
            message: `Booking ${bookingRejectId} ditolak.`,
            type: "booking_rejected",
            referenceId: bookingRejectId,
            referenceType: "booking",
          },
          {
            id: `NTF-DOC-OK-${runTag}`,
            title: "Review Dokumen",
            message: `Dokumen ${documentId} telah di-review: disetujui.`,
            type: "doc_review",
            referenceId: documentId,
            referenceType: "document",
          },
          {
            id: `NTF-DOC-REV-${runTag}`,
            title: "Review Dokumen",
            message: `Dokumen ${documentId} telah di-review: perlu revisi.`,
            type: "doc_review",
            referenceId: documentId,
            referenceType: "document",
          },
        ] as const;

        notificationIds.push(...adminFlowNotifs.map((item) => item.id));

        for (const notif of adminFlowNotifs) {
          const insertNotif = await admin.client
            .from("notifications")
            .insert({
              id: notif.id,
              user_id: school.userId,
              title: notif.title,
              message: notif.message,
              type: notif.type,
              reference_id: notif.referenceId,
              reference_type: notif.referenceType,
              is_read: false,
            });
          assert.ifError(insertNotif.error);
        }

        const schoolNotifsResult = await school.client
          .from("notifications")
          .select("id, user_id, type, reference_id, reference_type")
          .in("id", notificationIds);
        assert.ifError(schoolNotifsResult.error);
        const schoolNotifs = schoolNotifsResult.data ?? [];
        assert.equal(
          schoolNotifs.length,
          notificationIds.length,
          "School did not receive all admin-action notifications.",
        );

        const expectedById = new Map(
          adminFlowNotifs.map((item) => [item.id, item]),
        );

        for (const notifId of notificationIds) {
          const row = schoolNotifs.find((notif) => notif.id === notifId);
          assert.ok(row, `Missing notification row ${notifId}.`);
          assert.equal(row.user_id, school.userId);

          const expected = expectedById.get(notifId)!;
          assert.equal(row.type, expected.type);
          assert.equal(row.reference_id, expected.referenceId);
          assert.equal(row.reference_type, expected.referenceType);

          const schoolHref = getNotificationHref("school", {
            referenceId: (row.reference_id as string | undefined) ?? undefined,
            referenceType:
              (row.reference_type as Notification["referenceType"] | undefined) ?? undefined,
          });
          const expectedSchoolHref =
            expected.referenceType === "booking"
              ? `/dashboard/booking/${expected.referenceId}`
              : "/dashboard/dokumen";
          assert.equal(
            schoolHref,
            expectedSchoolHref,
            `Unexpected school deep-link for notification ${notifId}.`,
          );

          const adminHref = getNotificationHref("admin", {
            referenceId: (row.reference_id as string | undefined) ?? undefined,
            referenceType:
              (row.reference_type as Notification["referenceType"] | undefined) ?? undefined,
          });
          const expectedAdminHref =
            expected.referenceType === "booking"
              ? `/dashboard-admin/booking/${expected.referenceId}`
              : `/dashboard-admin/detail-dokumen?documentId=${encodeURIComponent(expected.referenceId)}`;
          assert.equal(
            adminHref,
            expectedAdminHref,
            `Unexpected admin deep-link for notification ${notifId}.`,
          );
        }
      } finally {
        await Promise.allSettled([
          school?.client.auth.signOut({ scope: "local" }),
          admin?.client.auth.signOut({ scope: "local" }),
        ]);

        if (notificationIds.length > 0) {
          await serviceClient.from("notifications").delete().in("id", notificationIds);
        }

        if (notificationReferenceIds.length > 0) {
          await serviceClient
            .from("notifications")
            .delete()
            .in("reference_id", Array.from(new Set(notificationReferenceIds)));
        }

        if (documentIds.length > 0) {
          await serviceClient.from("documents").delete().in("id", documentIds);
        }

        if (bookingIds.length > 0) {
          await serviceClient.from("bookings").delete().in("id", bookingIds);
        }
      }
    },
  );

  test(
    "real Supabase hardening: extended session durability and cross-table RLS penetration checks",
    { timeout: 220_000 },
    async () => {
      const {
        supabaseUrl,
        anonKey,
        serviceRoleKey,
        schoolEmail,
        schoolPassword,
        adminEmail,
        adminPassword,
      } = readRealSupabaseEnv();

      const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey);
      const runTag = `HARD${Date.now().toString(36).toUpperCase()}`;
      const baseOffset = 720 + (Date.now() % 45);
      const bookingPrimaryDate = futureDateISO(baseOffset);
      const bookingSecondaryDate = futureDateISO(baseOffset + 1);
      const secondarySchoolEmail = `qa-hardening-${runTag.toLowerCase()}@example.test`;
      const secondarySchoolPassword = `Qa!${randomUUID().slice(0, 12)}A1`;

      const bookingIds: string[] = [];
      const documentIds: string[] = [];
      const historyIds: string[] = [];
      const notificationIds: string[] = [];
      const notificationReferenceIds: string[] = [];
      const storagePaths: string[] = [];

      let secondarySchoolId: string | null = null;
      let school: SignedInClient | null = null;
      let schoolSecondary: SignedInClient | null = null;
      let admin: SignedInClient | null = null;
      let reopenedClient: TypedClient | null = null;

      try {
        school = await signInWithPassword(supabaseUrl, anonKey, schoolEmail, schoolPassword);
        admin = await signInWithPassword(supabaseUrl, anonKey, adminEmail, adminPassword);

        const schoolProfile = await waitForProfile(serviceClient, school.userId);
        const adminProfile = await waitForProfile(serviceClient, admin.userId);
        assert.equal(schoolProfile.role, "school");
        assert.equal(adminProfile.role, "admin");

        const createSecondary = await serviceClient.auth.admin.createUser({
          email: secondarySchoolEmail,
          password: secondarySchoolPassword,
          email_confirm: true,
          user_metadata: {
            role: "school",
            school_name: `QA Hardening ${runTag}`,
            npsn: `8${Date.now().toString().slice(-7)}`,
            contact_name: "QA Hardening Bot",
            phone: "081234560001",
            address: "Jl. QA Hardening",
          },
        });
        assert.ifError(createSecondary.error);
        assert.ok(createSecondary.data.user);
        secondarySchoolId = createSecondary.data.user.id;

        const secondaryProfile = await waitForProfile(serviceClient, secondarySchoolId);
        assert.equal(secondaryProfile.role, "school");

        schoolSecondary = await signInWithPassword(
          supabaseUrl,
          anonKey,
          secondarySchoolEmail,
          secondarySchoolPassword,
        );

        // PROFILE RLS: school cannot read/update another school's profile.
        const profileCrossRead = await school.client
          .from("profiles")
          .select("id, email")
          .eq("id", secondarySchoolId)
          .maybeSingle();
        assert.ifError(profileCrossRead.error);
        assert.equal(
          profileCrossRead.data,
          null,
          "School can read another school's profile (RLS broken).",
        );

        const profileIllegalUpdate = await school.client
          .from("profiles")
          .update({ contact_name: `RLS blocked ${runTag}` })
          .eq("id", secondarySchoolId)
          .select("id");
        assert.ifError(profileIllegalUpdate.error);
        assert.equal(
          profileIllegalUpdate.data?.length ?? 0,
          0,
          "School unexpectedly updated another school's profile.",
        );

        const adminProfileRead = await admin.client
          .from("profiles")
          .select("id")
          .in("id", [school.userId, secondarySchoolId]);
        assert.ifError(adminProfileRead.error);
        assert.equal(
          adminProfileRead.data?.length ?? 0,
          2,
          "Admin cannot read both school profiles.",
        );

        const primarySchoolName = schoolProfile.school_name ?? "School QA Hardening Primary";
        const secondarySchoolName = secondaryProfile.school_name ?? "School QA Hardening Secondary";

        const bookingPrimaryId = `BK-HARD-A-${runTag}`;
        const bookingSecondaryId = `BK-HARD-B-${runTag}`;
        bookingIds.push(bookingPrimaryId, bookingSecondaryId);
        notificationReferenceIds.push(bookingPrimaryId, bookingSecondaryId);

        const createPrimaryBooking = await school.client
          .from("bookings")
          .insert({
            id: bookingPrimaryId,
            school_id: school.userId,
            school_name: primarySchoolName,
            topic: `Hardening primary ${runTag}`,
            category: "Pendampingan",
            date_iso: bookingPrimaryDate,
            session: "09.00 - 12.00 WITA",
            status: "Menunggu",
            timeline: [],
            goal: "RLS penetration primary",
            notes: "hardening primary",
          })
          .select("id")
          .single();
        assert.ifError(createPrimaryBooking.error);

        const createSecondaryBooking = await schoolSecondary.client
          .from("bookings")
          .insert({
            id: bookingSecondaryId,
            school_id: schoolSecondary.userId,
            school_name: secondarySchoolName,
            topic: `Hardening secondary ${runTag}`,
            category: "Supervisi",
            date_iso: bookingSecondaryDate,
            session: "08.00 - 10.00 WITA",
            status: "Menunggu",
            timeline: [],
            goal: "RLS penetration secondary",
            notes: "hardening secondary",
          })
          .select("id")
          .single();
        assert.ifError(createSecondaryBooking.error);

        // DOCUMENT RLS
        const primaryDocumentId = `DOC-HARD-A-${runTag}`;
        const secondaryDocumentId = `DOC-HARD-B-${runTag}`;
        documentIds.push(primaryDocumentId, secondaryDocumentId);
        notificationReferenceIds.push(primaryDocumentId, secondaryDocumentId);

        const createPrimaryDocument = await school.client
          .from("documents")
          .insert({
            id: primaryDocumentId,
            school_id: school.userId,
            booking_id: bookingPrimaryId,
            history_id: null,
            file_name: `hard-primary-${runTag}.pdf`,
            storage_path: null,
            file_size: 1024,
            mime_type: "application/pdf",
            stage: "Melayani",
            review_status: "Menunggu Review",
            reviewer_notes: null,
            version: 1,
            parent_doc_id: null,
            uploaded_at: "19 Maret 2026",
          })
          .select("id")
          .single();
        assert.ifError(createPrimaryDocument.error);

        const createSecondaryDocument = await schoolSecondary.client
          .from("documents")
          .insert({
            id: secondaryDocumentId,
            school_id: schoolSecondary.userId,
            booking_id: bookingSecondaryId,
            history_id: null,
            file_name: `hard-secondary-${runTag}.pdf`,
            storage_path: null,
            file_size: 1024,
            mime_type: "application/pdf",
            stage: "Melayani",
            review_status: "Menunggu Review",
            reviewer_notes: null,
            version: 1,
            parent_doc_id: null,
            uploaded_at: "19 Maret 2026",
          })
          .select("id")
          .single();
        assert.ifError(createSecondaryDocument.error);

        const schoolVisibleDocs = await school.client
          .from("documents")
          .select("id, school_id")
          .in("id", [primaryDocumentId, secondaryDocumentId]);
        assert.ifError(schoolVisibleDocs.error);
        const schoolDocIds = new Set((schoolVisibleDocs.data ?? []).map((row) => row.id));
        assert.ok(schoolDocIds.has(primaryDocumentId), "School cannot read own document.");
        assert.ok(
          !schoolDocIds.has(secondaryDocumentId),
          "School can read another school's document (RLS broken).",
        );

        const illegalDocumentUpdate = await school.client
          .from("documents")
          .update({ review_status: "Disetujui" })
          .eq("id", secondaryDocumentId)
          .select("id");
        assert.ifError(illegalDocumentUpdate.error);
        assert.equal(
          illegalDocumentUpdate.data?.length ?? 0,
          0,
          "School unexpectedly updated another school's document.",
        );

        // HISTORY RLS
        const primaryHistoryId = `RH-HARD-A-${runTag}`;
        const secondaryHistoryId = `RH-HARD-B-${runTag}`;
        historyIds.push(primaryHistoryId, secondaryHistoryId);

        const createPrimaryHistory = await school.client
          .from("histories")
          .insert({
            id: primaryHistoryId,
            school_id: school.userId,
            booking_id: bookingPrimaryId,
            date_iso: bookingPrimaryDate,
            school_name: primarySchoolName,
            session: "09.00 - 12.00 WITA",
            title: `History primary ${runTag}`,
            description: "Primary history record for RLS hardening test.",
            status: "Selesai",
            follow_up_iso: null,
            supervisor_notes: null,
            follow_up_done: false,
            follow_up_items: [],
          })
          .select("id")
          .single();
        assert.ifError(createPrimaryHistory.error);

        const createSecondaryHistory = await schoolSecondary.client
          .from("histories")
          .insert({
            id: secondaryHistoryId,
            school_id: schoolSecondary.userId,
            booking_id: bookingSecondaryId,
            date_iso: bookingSecondaryDate,
            school_name: secondarySchoolName,
            session: "08.00 - 10.00 WITA",
            title: `History secondary ${runTag}`,
            description: "Secondary history record for RLS hardening test.",
            status: "Selesai",
            follow_up_iso: null,
            supervisor_notes: null,
            follow_up_done: false,
            follow_up_items: [],
          })
          .select("id")
          .single();
        assert.ifError(createSecondaryHistory.error);

        const schoolVisibleHistories = await school.client
          .from("histories")
          .select("id, school_id")
          .in("id", [primaryHistoryId, secondaryHistoryId]);
        assert.ifError(schoolVisibleHistories.error);
        const schoolHistoryIds = new Set(
          (schoolVisibleHistories.data ?? []).map((row) => row.id),
        );
        assert.ok(schoolHistoryIds.has(primaryHistoryId), "School cannot read own history.");
        assert.ok(
          !schoolHistoryIds.has(secondaryHistoryId),
          "School can read another school's history (RLS broken).",
        );

        const illegalHistoryUpdate = await school.client
          .from("histories")
          .update({ follow_up_done: true })
          .eq("id", secondaryHistoryId)
          .select("id");
        assert.ifError(illegalHistoryUpdate.error);
        assert.equal(
          illegalHistoryUpdate.data?.length ?? 0,
          0,
          "School unexpectedly updated another school's history.",
        );

        // NOTIFICATION RLS
        const ownNotifId = `NTF-HARD-OWN-${runTag}`;
        const adminToSecondaryNotifId = `NTF-HARD-ADM-${runTag}`;
        notificationIds.push(ownNotifId, adminToSecondaryNotifId);

        const schoolOwnNotifInsert = await school.client
          .from("notifications")
          .insert({
            id: ownNotifId,
            user_id: school.userId,
            title: "Own notification",
            message: "Allowed self insert notification.",
            type: "doc_uploaded",
            reference_id: primaryDocumentId,
            reference_type: "document",
            is_read: false,
          });
        assert.ifError(schoolOwnNotifInsert.error);

        const illegalSchoolNotifInsert = await school.client
          .from("notifications")
          .insert({
            id: `NTF-HARD-X-${runTag}`,
            user_id: schoolSecondary.userId,
            title: "Illegal notification",
            message: "This should be blocked.",
            type: "doc_uploaded",
            reference_id: secondaryDocumentId,
            reference_type: "document",
            is_read: false,
          });
        assert.ok(
          illegalSchoolNotifInsert.error,
          "School can insert notification for another school user (RLS broken).",
        );

        const adminNotifInsert = await admin.client
          .from("notifications")
          .insert({
            id: adminToSecondaryNotifId,
            user_id: schoolSecondary.userId,
            title: "Admin direct notification",
            message: "Allowed admin insert notification.",
            type: "booking_approved",
            reference_id: bookingSecondaryId,
            reference_type: "booking",
            is_read: false,
          });
        assert.ifError(adminNotifInsert.error);

        const schoolCrossNotifRead = await school.client
          .from("notifications")
          .select("id")
          .eq("user_id", schoolSecondary.userId)
          .in("id", [ownNotifId, adminToSecondaryNotifId]);
        assert.ifError(schoolCrossNotifRead.error);
        assert.equal(
          schoolCrossNotifRead.data?.length ?? 0,
          0,
          "School can read another user's notifications (RLS broken).",
        );

        // STORAGE RLS
        const primaryStoragePath = `${school.userId}/${runTag}/hardening.txt`;
        storagePaths.push(primaryStoragePath);

        const storageUpload = await school.client.storage
          .from("school-documents")
          .upload(
            primaryStoragePath,
            new Blob([`hardening storage ${runTag}`], { type: "text/plain" }),
            { upsert: true, contentType: "text/plain" },
          );
        assert.ifError(storageUpload.error);

        const secondarySignedUrl = await schoolSecondary.client.storage
          .from("school-documents")
          .createSignedUrl(primaryStoragePath, 120);
        assert.ok(
          secondarySignedUrl.error,
          "Secondary school can create signed URL for another school's file (RLS broken).",
        );

        const secondaryDownload = await schoolSecondary.client.storage
          .from("school-documents")
          .download(primaryStoragePath);
        assert.ok(
          secondaryDownload.error,
          "Secondary school can download another school's file (RLS broken).",
        );

        const adminSignedUrl = await admin.client.storage
          .from("school-documents")
          .createSignedUrl(primaryStoragePath, 120);
        assert.ifError(adminSignedUrl.error);
        assert.ok(adminSignedUrl.data?.signedUrl);

        // SESSION DURABILITY: repeated refresh + reopen client + post-idle check.
        const sessionBeforeRefresh = await school.client.auth.getSession();
        assert.ifError(sessionBeforeRefresh.error);
        assert.ok(sessionBeforeRefresh.data.session);

        let rollingSession = sessionBeforeRefresh.data.session!;
        for (let idx = 0; idx < 3; idx += 1) {
          await wait(1_100);
          const refreshed = await school.client.auth.refreshSession();
          assert.ifError(refreshed.error);
          assert.ok(refreshed.data.session, "Refresh did not return a session.");
          rollingSession = refreshed.data.session!;
        }

        reopenedClient = createAnonClient(supabaseUrl, anonKey);
        const reopenSessionSet = await reopenedClient.auth.setSession({
          access_token: rollingSession.access_token,
          refresh_token: rollingSession.refresh_token,
        });
        assert.ifError(reopenSessionSet.error);

        const reopenedUser = await reopenedClient.auth.getUser();
        assert.ifError(reopenedUser.error);
        assert.equal(
          reopenedUser.data.user?.id,
          school.userId,
          "Reopened client did not restore the expected school session.",
        );

        await wait(1_200);

        const reopenedRefresh = await reopenedClient.auth.refreshSession();
        assert.ifError(reopenedRefresh.error);
        assert.ok(
          reopenedRefresh.data.session,
          "Reopened client could not refresh session after idle wait.",
        );

        const globalLogout = await school.client.auth.signOut({ scope: "global" });
        assert.ifError(globalLogout.error);
        await wait(500);

        const reopenedAfterLogout = await reopenedClient.auth.refreshSession();
        assert.ok(
          reopenedAfterLogout.error || !reopenedAfterLogout.data.session,
          "Reopened session still valid after global logout.",
        );
      } finally {
        await Promise.allSettled([
          school?.client.auth.signOut({ scope: "local" }),
          schoolSecondary?.client.auth.signOut({ scope: "local" }),
          admin?.client.auth.signOut({ scope: "local" }),
          reopenedClient?.auth.signOut({ scope: "local" }),
        ]);

        if (notificationIds.length > 0) {
          await serviceClient.from("notifications").delete().in("id", notificationIds);
        }

        if (notificationReferenceIds.length > 0) {
          await serviceClient
            .from("notifications")
            .delete()
            .in("reference_id", Array.from(new Set(notificationReferenceIds)));
        }

        if (historyIds.length > 0) {
          await serviceClient.from("histories").delete().in("id", historyIds);
        }

        if (documentIds.length > 0) {
          await serviceClient.from("documents").delete().in("id", documentIds);
        }

        if (bookingIds.length > 0) {
          await serviceClient.from("bookings").delete().in("id", bookingIds);
        }

        if (storagePaths.length > 0) {
          await serviceClient.storage.from("school-documents").remove(storagePaths);
        }

        if (secondarySchoolId) {
          await serviceClient.auth.admin.deleteUser(secondarySchoolId);
        }
      }
    },
  );
}
